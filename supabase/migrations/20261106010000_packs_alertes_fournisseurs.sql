/*
  # Packs, alertes de stock et fournisseurs

  - products.kind : 'simple' ou 'pack'. Un pack est composé d'autres produits (pack_items).
    Vendre un pack retire du stock ses COMPOSANTS ; le stock affiché du pack est calculé tout seul
    (nombre de packs réalisables avec le stock des composants).
  - products.sale_ends_at : fin d'une offre (le produit disparaît de la boutique après cette date).
  - Alerte de stock : seuil par produit, 5 par défaut. « Stock bas » = stock sous le seuil.
  - suppliers + products.supplier_id : pour relancer chaque fournisseur avec sa liste à commander.
  - Annulation d'une commande ou d'un ticket : on rend exactement ce qui avait été retiré
    (fonctionne aussi pour les packs).
  - Pack Anniversaire 1 an (2 novembre 2026) : 2 kg de cuisses, 1 kg de pilons, 1 kg d'ailes,
    500 g de blancs de poulet, 10 000 F, jusqu'au 30 novembre 2026.
*/

-- ===================== Colonnes et tables =====================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'simple';
DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_kind_check CHECK (kind IN ('simple', 'pack'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;

CREATE TABLE IF NOT EXISTS public.suppliers (
  id serial PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stock team manages suppliers" ON public.suppliers;
CREATE POLICY "Stock team manages suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_role('gerant', 'stock')) WITH CHECK (public.has_role('gerant', 'stock'));
REVOKE ALL ON public.suppliers FROM anon;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id integer REFERENCES public.suppliers ON DELETE SET NULL;

-- seuil d'alerte : 5 par défaut
ALTER TABLE public.products ALTER COLUMN stock_alert SET DEFAULT 5;
UPDATE public.products SET stock_alert = 5 WHERE stock_alert = 0 AND kind = 'simple';

CREATE TABLE IF NOT EXISTS public.pack_items (
  pack_id uuid NOT NULL REFERENCES public.products ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products ON DELETE RESTRICT,
  qty numeric(10,3) NOT NULL CHECK (qty > 0 AND qty <= 500),
  PRIMARY KEY (pack_id, product_id)
);
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone reads pack items" ON public.pack_items;
CREATE POLICY "Everyone reads pack items" ON public.pack_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Stock team manages pack items" ON public.pack_items;
CREATE POLICY "Stock team manages pack items" ON public.pack_items FOR ALL TO authenticated
  USING (public.has_role('gerant', 'stock')) WITH CHECK (public.has_role('gerant', 'stock'));

-- ===================== Stock des packs =====================

-- Nombre de packs réalisables avec le stock des composants
CREATE OR REPLACE FUNCTION public.pack_stock(p_pack uuid)
RETURNS numeric LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(min(floor(greatest(c.stock, 0) / i.qty)), 0)
  FROM pack_items i JOIN products c ON c.id = i.product_id WHERE i.pack_id = p_pack;
$$;

CREATE OR REPLACE FUNCTION public.refresh_pack(p_pack uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE products SET stock = public.pack_stock(id) WHERE id = p_pack AND kind = 'pack';
$$;

-- Composition : un pack ne contient que des produits simples
CREATE OR REPLACE FUNCTION public.guard_pack_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP <> 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = new.pack_id AND kind = 'pack') THEN RAISE EXCEPTION 'not_a_pack'; END IF;
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = new.product_id AND kind = 'simple') THEN RAISE EXCEPTION 'pack_in_pack'; END IF;
  END IF;
  RETURN coalesce(new, old);
END;
$$;
DROP TRIGGER IF EXISTS guard_pack_item ON public.pack_items;
CREATE TRIGGER guard_pack_item BEFORE INSERT OR UPDATE ON public.pack_items FOR EACH ROW EXECUTE FUNCTION public.guard_pack_item();

CREATE OR REPLACE FUNCTION public.pack_items_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_pack(coalesce(new.pack_id, old.pack_id));
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS pack_items_changed ON public.pack_items;
CREATE TRIGGER pack_items_changed AFTER INSERT OR UPDATE OR DELETE ON public.pack_items FOR EACH ROW EXECUTE FUNCTION public.pack_items_changed();

-- Le stock d'un pack ne se saisit pas : il découle de ses composants
CREATE OR REPLACE FUNCTION public.guard_movement_on_pack()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE id = new.product_id AND kind = 'pack') THEN RAISE EXCEPTION 'pack_stock_is_computed'; END IF;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS guard_movement_on_pack ON public.stock_movements;
CREATE TRIGGER guard_movement_on_pack BEFORE INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.guard_movement_on_pack();

-- Chaque mouvement met à jour le produit, puis les packs qui le contiennent
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE products SET stock = stock + new.delta WHERE id = new.product_id;
  UPDATE products SET stock = public.pack_stock(id)
  WHERE kind = 'pack' AND id IN (SELECT pack_id FROM pack_items WHERE product_id = new.product_id);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_stock(p_product uuid, p_counted numeric, p_note text DEFAULT '')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur numeric; k text; diff numeric;
BEGIN
  IF NOT public.has_role('gerant', 'stock') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_counted IS NULL OR p_counted < 0 THEN RAISE EXCEPTION 'bad_qty'; END IF;
  SELECT stock, kind INTO cur, k FROM products WHERE id = p_product FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found'; END IF;
  IF k = 'pack' THEN RAISE EXCEPTION 'pack_stock_is_computed'; END IF;
  diff := p_counted - cur;
  IF diff <> 0 THEN
    INSERT INTO stock_movements (product_id, delta, reason, note, created_by)
    VALUES (p_product, diff, 'inventaire', left(coalesce(p_note, ''), 300), auth.uid());
  END IF;
  RETURN diff;
END;
$$;

-- ===================== Prix d'achat d'un pack = somme de ses composants =====================

CREATE OR REPLACE FUNCTION public.capture_unit_cost()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.product_id IS NULL THEN RETURN new; END IF;
  IF EXISTS (SELECT 1 FROM products WHERE id = new.product_id AND kind = 'pack') THEN
    SELECT CASE WHEN count(*) > 0 AND count(*) = count(c.cost_price) THEN round(sum(c.cost_price * i.qty))::integer END
    INTO new.unit_cost
    FROM pack_items i LEFT JOIN product_costs c ON c.product_id = i.product_id WHERE i.pack_id = new.product_id;
  ELSE
    SELECT cost_price INTO new.unit_cost FROM product_costs WHERE product_id = new.product_id;
  END IF;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.stock_value()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN NOT public.has_role('gerant', 'stock') THEN NULL ELSE jsonb_build_object(
    'value', coalesce(sum(round(p.stock * c.cost_price)) FILTER (WHERE c.cost_price IS NOT NULL), 0),
    'products_without_cost', count(*) FILTER (WHERE c.cost_price IS NULL)
  ) END
  FROM products p LEFT JOIN product_costs c ON c.product_id = p.id
  WHERE p.is_active AND p.kind = 'simple' AND p.stock > 0;
$$;

-- ===================== Vente en ligne (packs et fin d'offre) =====================

CREATE OR REPLACE FUNCTION public.place_order(p_customer jsonb, p_items jsonb, p_delivery jsonb, p_payment text, p_note text DEFAULT '', p_channel text DEFAULT 'site')
RETURNS TABLE (order_id uuid, order_number text, order_total integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s store_settings; z delivery_zones; o orders; pr products; it jsonb; comp record;
  q numeric; unit_p integer; line integer; sub integer := 0; fee integer := 0; mode text; n integer;
BEGIN
  SELECT * INTO s FROM store_settings WHERE id = 1;
  IF NOT s.accepting_orders THEN RAISE EXCEPTION 'orders_closed'; END IF;
  IF p_payment NOT IN ('wave', 'om') THEN RAISE EXCEPTION 'bad_payment'; END IF;
  IF p_channel NOT IN ('site', 'app') THEN RAISE EXCEPTION 'bad_channel'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 80 THEN
    RAISE EXCEPTION 'bad_items';
  END IF;

  mode := p_delivery->>'mode';
  IF mode = 'zone' THEN
    SELECT * INTO z FROM delivery_zones WHERE id = (p_delivery->>'zone_id')::integer AND active;
    IF NOT FOUND THEN RAISE EXCEPTION 'bad_zone'; END IF;
    fee := z.price;
  ELSIF mode <> 'yango' OR mode IS NULL THEN
    RAISE EXCEPTION 'bad_delivery';
  END IF;

  INSERT INTO orders (customer_id, customer_name, customer_phone, channel, delivery_mode, zone_id, area, address, landmark, lat, lng, payment_method, note)
  VALUES (auth.uid(), trim(p_customer->>'name'), trim(p_customer->>'phone'), p_channel, mode, z.id,
          left(coalesce(p_delivery->>'area', ''), 80), left(coalesce(p_delivery->>'address', ''), 300), left(coalesce(p_delivery->>'landmark', ''), 200),
          (p_delivery->>'lat')::double precision, (p_delivery->>'lng')::double precision, p_payment, left(coalesce(p_note, ''), 500))
  RETURNING * INTO o;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO pr FROM products WHERE id = (it->>'product_id')::uuid AND is_active AND is_online
      AND (sale_ends_at IS NULL OR sale_ends_at > now()) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_unavailable'; END IF;
    q := (it->>'qty')::numeric;
    IF NOT public.valid_qty(pr.unit, q) THEN RAISE EXCEPTION 'bad_qty'; END IF;
    unit_p := public.effective_price(pr);
    line := round(unit_p * q);

    IF pr.kind = 'pack' THEN
      n := 0;
      FOR comp IN SELECT i.product_id, i.qty, c.stock FROM pack_items i JOIN products c ON c.id = i.product_id WHERE i.pack_id = pr.id FOR UPDATE OF c LOOP
        IF comp.stock < q * comp.qty THEN RAISE EXCEPTION '%', 'out_of_stock:' || pr.name; END IF;
        n := n + 1;
      END LOOP;
      IF n = 0 THEN RAISE EXCEPTION 'product_unavailable'; END IF;
      INSERT INTO order_items (order_id, product_id, name, unit, unit_price, qty, line_total)
      VALUES (o.id, pr.id, pr.name, pr.unit, unit_p, q, line);
      INSERT INTO stock_movements (product_id, delta, reason, note, order_id, created_by)
      SELECT i.product_id, -(q * i.qty), 'vente_en_ligne', left('Pack : ' || pr.name, 300), o.id, auth.uid() FROM pack_items i WHERE i.pack_id = pr.id;
    ELSE
      IF pr.stock < q THEN RAISE EXCEPTION '%', 'out_of_stock:' || pr.name; END IF;
      INSERT INTO order_items (order_id, product_id, name, unit, unit_price, qty, line_total)
      VALUES (o.id, pr.id, pr.name, pr.unit, unit_p, q, line);
      INSERT INTO stock_movements (product_id, delta, reason, order_id, created_by)
      VALUES (pr.id, -q, 'vente_en_ligne', o.id, auth.uid());
    END IF;
    sub := sub + line;
  END LOOP;

  IF sub < s.min_order THEN RAISE EXCEPTION 'min_order'; END IF;
  IF s.free_delivery_from IS NOT NULL AND sub >= s.free_delivery_from THEN fee := 0; END IF;
  UPDATE orders SET subtotal = sub, delivery_fee = fee, total = sub + fee WHERE id = o.id;
  RETURN QUERY SELECT o.id, o.number, sub + fee;
END;
$$;

-- ===================== Caisse (packs) =====================

CREATE OR REPLACE FUNCTION public.record_sale(p_items jsonb, p_payment text, p_cash_given integer DEFAULT NULL)
RETURNS TABLE (sale_id uuid, sale_number text, sale_total integer, change_due integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sa sales; pr products; it jsonb; q numeric; unit_p integer; line integer; tot integer := 0; chg integer;
BEGIN
  IF NOT public.has_role('gerant', 'vendeur') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_payment NOT IN ('especes', 'wave', 'om') THEN RAISE EXCEPTION 'bad_payment'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 150 THEN
    RAISE EXCEPTION 'bad_items';
  END IF;

  INSERT INTO sales (cashier_id, payment_method) VALUES (auth.uid(), p_payment) RETURNING * INTO sa;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO pr FROM products WHERE id = (it->>'product_id')::uuid AND price IS NOT NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_unavailable'; END IF;
    q := (it->>'qty')::numeric;
    IF q IS NULL OR q <= 0 OR q > 1000 OR (pr.unit = 'piece' AND q <> trunc(q)) THEN RAISE EXCEPTION 'bad_qty'; END IF;
    unit_p := public.effective_price(pr);
    line := round(unit_p * q);
    INSERT INTO sale_items (sale_id, product_id, name, unit, unit_price, qty, line_total)
    VALUES (sa.id, pr.id, pr.name, pr.unit, unit_p, q, line);
    IF pr.kind = 'pack' THEN
      INSERT INTO stock_movements (product_id, delta, reason, note, sale_id, created_by)
      SELECT i.product_id, -(q * i.qty), 'vente_caisse', left('Pack : ' || pr.name, 300), sa.id, auth.uid() FROM pack_items i WHERE i.pack_id = pr.id;
    ELSE
      INSERT INTO stock_movements (product_id, delta, reason, sale_id, created_by)
      VALUES (pr.id, -q, 'vente_caisse', sa.id, auth.uid());
    END IF;
    tot := tot + line;
  END LOOP;

  IF p_payment = 'especes' THEN
    IF p_cash_given IS NULL OR p_cash_given < tot THEN RAISE EXCEPTION 'cash_insufficient'; END IF;
    chg := p_cash_given - tot;
  END IF;
  UPDATE sales SET total = tot, cash_given = CASE WHEN p_payment = 'especes' THEN p_cash_given END, change_given = chg WHERE id = sa.id;
  RETURN QUERY SELECT sa.id, sa.number, tot, chg;
END;
$$;

-- ===================== Annulations : on rend exactement ce qui a été retiré =====================

CREATE OR REPLACE FUNCTION public.set_order_status(p_order uuid, p_status text, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o orders;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF o.status IN ('livree', 'annulee') THEN RAISE EXCEPTION 'order_closed'; END IF;

  IF public.has_role('livreur') THEN
    IF p_status <> 'livree' OR o.assigned_to IS DISTINCT FROM auth.uid() OR o.status <> 'expediee' THEN RAISE EXCEPTION 'forbidden'; END IF;
  ELSIF NOT public.has_role('gerant', 'vendeur') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_status = 'preparation' THEN
    NULL;
  ELSIF p_status = 'expediee' THEN
    IF o.payment_status <> 'paye' THEN RAISE EXCEPTION 'payment_required'; END IF;
    UPDATE orders SET shipped_at = now() WHERE id = p_order;
  ELSIF p_status = 'livree' THEN
    IF o.payment_status <> 'paye' THEN RAISE EXCEPTION 'payment_required'; END IF;
    UPDATE orders SET delivered_at = now() WHERE id = p_order;
  ELSIF p_status = 'annulee' THEN
    INSERT INTO stock_movements (product_id, delta, reason, note, order_id, created_by)
    SELECT m.product_id, -m.delta, 'annulation', m.note, p_order, auth.uid()
    FROM stock_movements m WHERE m.order_id = p_order AND m.reason = 'vente_en_ligne';
    UPDATE orders SET cancelled_at = now() WHERE id = p_order;
  ELSE
    RAISE EXCEPTION 'bad_status';
  END IF;

  UPDATE orders SET status = p_status, staff_note = coalesce(left(p_note, 500), staff_note) WHERE id = p_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_sale(p_sale uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role('gerant') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE sales SET cancelled_at = now(), cancelled_by = auth.uid() WHERE id = p_sale AND cancelled_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'cannot_cancel'; END IF;
  INSERT INTO stock_movements (product_id, delta, reason, note, sale_id, created_by)
  SELECT m.product_id, -m.delta, 'annulation', m.note, p_sale, auth.uid()
  FROM stock_movements m WHERE m.sale_id = p_sale AND m.reason = 'vente_caisse';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_pack(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pack_items_changed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_pack_item() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_movement_on_pack() FROM PUBLIC, anon, authenticated;

-- ===================== Pack Anniversaire 1 an =====================

INSERT INTO public.products (slug, name, category_id, unit, price, is_online, stock_alert, description)
SELECT 'blancs-de-poulet-au-kg', 'Blancs de poulet (au kg)', c.id, 'kg', NULL, false, 5, ''
FROM public.categories c WHERE c.slug = 'surgeles'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, category_id, unit, kind, price, is_online, featured, stock_alert, sale_ends_at, image_url, description)
SELECT 'pack-anniversaire', 'Pack Anniversaire', c.id, 'piece', 'pack', 10000, true, true, 0, '2026-12-01T00:00:00Z', '/egeries/detoure/pack-poulet.webp',
       'Pour fêter nos 1 an (2 novembre 2026) : 2 kg de cuisses de poulet, 1 kg de pilons, 1 kg d''ailes et 500 g de blancs de poulet, le tout à 10 000 F. Offre valable jusqu''au 30 novembre 2026.'
FROM public.categories c WHERE c.slug = 'surgeles'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pack_items (pack_id, product_id, qty)
SELECT pk.id, p.id, v.qty
FROM (VALUES ('cuisses-de-poulet-au-kg', 2.0), ('pilons-de-poulet-au-kg', 1.0), ('ailes-de-poulet-au-kg', 1.0), ('blancs-de-poulet-au-kg', 0.5)) AS v(slug, qty)
JOIN public.products p ON p.slug = v.slug
JOIN public.products pk ON pk.slug = 'pack-anniversaire'
ON CONFLICT (pack_id, product_id) DO NOTHING;

-- Vérification : composition et nombre de packs réalisables
SELECT pk.name AS pack, p.name AS composant, i.qty, p.stock AS stock_composant, pk.stock AS packs_disponibles
FROM public.pack_items i JOIN public.products p ON p.id = i.product_id JOIN public.products pk ON pk.id = i.pack_id ORDER BY i.qty DESC;
