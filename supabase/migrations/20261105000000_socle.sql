/*
  # Ô Bon Prix : socle de la plateforme (site, application, caisse, back-office)

  Une seule base pour tout :
  - profiles        : comptes. role NULL = client ; gerant / stock / vendeur / livreur = équipe.
  - store_settings  : réglages de la boutique (téléphone, horaires, commandes ouvertes…).
  - categories, products : catalogue. Prix en francs CFA (entiers). Unité 'piece' ou 'kg'.
  - stock_movements : journal du stock. Le stock d'un produit ne change QUE par un mouvement
                      (achat, vente, inventaire, perte…) : on sait toujours qui a fait quoi.
  - delivery_zones  : zones de livraison autour de HLM Patte d'Oie, avec leurs quartiers.
  - orders, order_items : commandes en ligne (site, application, WhatsApp). Paiement Wave / Orange Money
                      AVANT livraison : une commande ne peut pas partir tant que le paiement n'est pas confirmé.
  - sales, sale_items : ventes en caisse (ticket).

  Les prix sont toujours recalculés par la base : un client ne peut pas modifier un prix depuis son téléphone.
*/

-- ===================== Comptes et rôles =====================

DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('gerant', 'stock', 'vendeur', 'livreur');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  role public.staff_role,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120), left(coalesce(new.raw_user_meta_data->>'phone', ''), 30))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vrai si la personne connectée a l'un des rôles demandés (et un compte actif)
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC roles public.staff_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT role = ANY (roles) FROM profiles WHERE id = auth.uid() AND active), false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role('gerant', 'stock', 'vendeur', 'livreur');
$$;

DROP POLICY IF EXISTS "Read own profile or gerant reads all" ON public.profiles;
CREATE POLICY "Read own profile or gerant reads all" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role('gerant'));
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- chacun modifie son nom et son téléphone, jamais son rôle
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

-- Le gérant donne ou retire un rôle (jamais le sien, pour ne pas se bloquer dehors)
CREATE OR REPLACE FUNCTION public.set_staff_role(p_user uuid, p_role public.staff_role, p_active boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role('gerant') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'cannot_change_self'; END IF;
  UPDATE profiles SET role = p_role, active = p_active WHERE id = p_user;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_staff_role(uuid, public.staff_role, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at := now(); RETURN new; END;
$$;

-- ===================== Réglages de la boutique =====================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'Ô Bon Prix',
  phone text NOT NULL DEFAULT '+221 78 737 82 90',
  whatsapp text NOT NULL DEFAULT '221787378290',
  wave_number text NOT NULL DEFAULT '78 737 82 90',
  om_number text NOT NULL DEFAULT '78 737 82 90',
  base_address text NOT NULL DEFAULT 'HLM Patte d''Oie, Dakar',
  hours jsonb NOT NULL DEFAULT '{"lun":["08:00","23:00"],"mar":["08:00","23:00"],"mer":["08:00","23:00"],"jeu":["08:00","23:00"],"ven":["08:00","23:00"],"sam":["08:00","23:00"],"dim":["12:00","23:00"]}',
  accepting_orders boolean NOT NULL DEFAULT true,
  min_order integer NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  free_delivery_from integer CHECK (free_delivery_from IS NULL OR free_delivery_from > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone reads settings" ON public.store_settings;
CREATE POLICY "Everyone reads settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Gerant updates settings" ON public.store_settings;
CREATE POLICY "Gerant updates settings" ON public.store_settings FOR UPDATE TO authenticated
  USING (public.has_role('gerant')) WITH CHECK (public.has_role('gerant'));
DROP TRIGGER IF EXISTS touch_store_settings ON public.store_settings;
CREATE TRIGGER touch_store_settings BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===================== Catalogue =====================

CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,60}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  position integer NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT ''
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone reads categories" ON public.categories;
CREATE POLICY "Everyone reads categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Stock team manages categories" ON public.categories;
CREATE POLICY "Stock team manages categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role('gerant', 'stock')) WITH CHECK (public.has_role('gerant', 'stock'));

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,120}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  category_id integer REFERENCES public.categories ON DELETE SET NULL,
  unit text NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece', 'kg')),
  price integer CHECK (price IS NULL OR price > 0),
  promo_price integer CHECK (promo_price IS NULL OR (promo_price > 0 AND price IS NOT NULL AND promo_price < price)),
  stock numeric(10,3) NOT NULL DEFAULT 0,
  stock_alert numeric(10,3) NOT NULL DEFAULT 0 CHECK (stock_alert >= 0),
  barcode text UNIQUE CHECK (barcode IS NULL OR barcode ~ '^[0-9A-Za-z-]{4,32}$'),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,   -- visible dans le catalogue
  is_online boolean NOT NULL DEFAULT true,   -- vendable sur le site et l'application
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT is_online OR price IS NOT NULL)  -- pas de vente en ligne sans prix
);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id) WHERE is_active;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read active products" ON public.products;
CREATE POLICY "Read active products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_staff());
DROP POLICY IF EXISTS "Stock team inserts products" ON public.products;
CREATE POLICY "Stock team inserts products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role('gerant', 'stock'));
DROP POLICY IF EXISTS "Stock team updates products" ON public.products;
CREATE POLICY "Stock team updates products" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role('gerant', 'stock')) WITH CHECK (public.has_role('gerant', 'stock'));
DROP POLICY IF EXISTS "Gerant deletes products" ON public.products;
CREATE POLICY "Gerant deletes products" ON public.products FOR DELETE TO authenticated
  USING (public.has_role('gerant'));

-- Le stock ne se modifie jamais à la main depuis l'application : il passe par stock_movements.
-- (dans les fonctions SECURITY DEFINER, current_user est le propriétaire et le contrôle laisse passer)
CREATE OR REPLACE FUNCTION public.guard_product_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN new.stock := 0;
    ELSIF new.stock IS DISTINCT FROM old.stock THEN RAISE EXCEPTION 'stock_only_by_movement';
    END IF;
  END IF;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS guard_product_stock ON public.products;
CREATE TRIGGER guard_product_stock BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_stock();
DROP TRIGGER IF EXISTS touch_products ON public.products;
CREATE TRIGGER touch_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Prix payé par le client : le prix promo s'il existe
CREATE OR REPLACE FUNCTION public.effective_price(p public.products)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT coalesce(p.promo_price, p.price); $$;

-- ===================== Livraison =====================

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id serial PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  price integer NOT NULL CHECK (price >= 0),
  areas text[] NOT NULL DEFAULT '{}',   -- quartiers proposés au client
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read zones" ON public.delivery_zones;
CREATE POLICY "Read zones" ON public.delivery_zones FOR SELECT TO anon, authenticated USING (active OR public.is_staff());
DROP POLICY IF EXISTS "Gerant manages zones" ON public.delivery_zones;
CREATE POLICY "Gerant manages zones" ON public.delivery_zones FOR ALL TO authenticated
  USING (public.has_role('gerant')) WITH CHECK (public.has_role('gerant'));

-- ===================== Commandes en ligne =====================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT 'C' || nextval('public.order_number_seq'),
  customer_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 120),
  customer_phone text NOT NULL CHECK (customer_phone ~ '^\+?[0-9 ]{9,20}$'),
  channel text NOT NULL DEFAULT 'site' CHECK (channel IN ('site', 'app', 'whatsapp')),
  delivery_mode text NOT NULL CHECK (delivery_mode IN ('zone', 'yango')),
  zone_id integer REFERENCES public.delivery_zones ON DELETE SET NULL,
  area text NOT NULL DEFAULT '' CHECK (char_length(area) <= 80),
  address text NOT NULL DEFAULT '' CHECK (char_length(address) <= 300),
  landmark text NOT NULL DEFAULT '' CHECK (char_length(landmark) <= 200),
  lat double precision CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng double precision CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  subtotal integer NOT NULL DEFAULT 0,
  delivery_fee integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('wave', 'om')),
  payment_status text NOT NULL DEFAULT 'en_attente' CHECK (payment_status IN ('en_attente', 'paye', 'rembourse')),
  payment_ref text NOT NULL DEFAULT '' CHECK (char_length(payment_ref) <= 80),
  status text NOT NULL DEFAULT 'nouvelle' CHECK (status IN ('nouvelle', 'preparation', 'expediee', 'livree', 'annulee')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  staff_note text NOT NULL DEFAULT '' CHECK (char_length(staff_note) <= 500),
  assigned_to uuid REFERENCES public.profiles ON DELETE SET NULL,
  paid_at timestamptz, shipped_at timestamptz, delivered_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON public.orders (customer_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read orders" ON public.orders;
CREATE POLICY "Read orders" ON public.orders FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role('gerant', 'vendeur') OR (public.has_role('livreur') AND assigned_to = auth.uid()));
DROP TRIGGER IF EXISTS touch_orders ON public.orders;
CREATE TRIGGER touch_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  product_id uuid REFERENCES public.products ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL,
  unit_price integer NOT NULL,
  qty numeric(10,3) NOT NULL CHECK (qty > 0),
  line_total integer NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read items of visible orders" ON public.order_items;
CREATE POLICY "Read items of visible orders" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));

-- ===================== Ventes en caisse =====================

CREATE SEQUENCE IF NOT EXISTS public.sale_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT 'T' || lpad(nextval('public.sale_number_seq')::text, 6, '0'),
  cashier_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('especes', 'wave', 'om')),
  total integer NOT NULL DEFAULT 0,
  cash_given integer CHECK (cash_given IS NULL OR cash_given >= 0),
  change_given integer CHECK (change_given IS NULL OR change_given >= 0),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_created_idx ON public.sales (created_at DESC);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cash team reads sales" ON public.sales;
CREATE POLICY "Cash team reads sales" ON public.sales FOR SELECT TO authenticated USING (public.has_role('gerant', 'vendeur'));

CREATE TABLE IF NOT EXISTS public.sale_items (
  id bigserial PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales ON DELETE CASCADE,
  product_id uuid REFERENCES public.products ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL,
  unit_price integer NOT NULL,
  qty numeric(10,3) NOT NULL CHECK (qty > 0),
  line_total integer NOT NULL
);
CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON public.sale_items (sale_id);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cash team reads sale items" ON public.sale_items;
CREATE POLICY "Cash team reads sale items" ON public.sale_items FOR SELECT TO authenticated USING (public.has_role('gerant', 'vendeur'));

-- ===================== Journal du stock =====================

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id bigserial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products ON DELETE CASCADE,
  delta numeric(10,3) NOT NULL CHECK (delta <> 0),
  reason text NOT NULL CHECK (reason IN ('import', 'achat', 'inventaire', 'ajustement', 'perte', 'vente_caisse', 'vente_en_ligne', 'annulation')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 300),
  order_id uuid REFERENCES public.orders ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON public.stock_movements (product_id, created_at DESC);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stock team reads movements" ON public.stock_movements;
CREATE POLICY "Stock team reads movements" ON public.stock_movements FOR SELECT TO authenticated USING (public.has_role('gerant', 'stock'));
-- arrivage, perte, ajustement : saisis par l'équipe stock ; les ventes passent par les fonctions ci-dessous
DROP POLICY IF EXISTS "Stock team records movements" ON public.stock_movements;
CREATE POLICY "Stock team records movements" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role('gerant', 'stock') AND created_by = auth.uid() AND reason IN ('achat', 'ajustement', 'perte')
              AND order_id IS NULL AND sale_id IS NULL);

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE products SET stock = stock + new.delta WHERE id = new.product_id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS apply_stock_movement ON public.stock_movements;
CREATE TRIGGER apply_stock_movement AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Inventaire : on saisit la quantité comptée, la base enregistre l'écart
CREATE OR REPLACE FUNCTION public.count_stock(p_product uuid, p_counted numeric, p_note text DEFAULT '')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur numeric; diff numeric;
BEGIN
  IF NOT public.has_role('gerant', 'stock') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_counted IS NULL OR p_counted < 0 THEN RAISE EXCEPTION 'bad_qty'; END IF;
  SELECT stock INTO cur FROM products WHERE id = p_product FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found'; END IF;
  diff := p_counted - cur;
  IF diff <> 0 THEN
    INSERT INTO stock_movements (product_id, delta, reason, note, created_by)
    VALUES (p_product, diff, 'inventaire', left(coalesce(p_note, ''), 300), auth.uid());
  END IF;
  RETURN diff;
END;
$$;
GRANT EXECUTE ON FUNCTION public.count_stock(uuid, numeric, text) TO authenticated;

-- ===================== Passer une commande (site, application) =====================

-- Quantité valide : entière pour les pièces, par demi-kilo pour les produits au poids
CREATE OR REPLACE FUNCTION public.valid_qty(p_unit text, q numeric)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT q IS NOT NULL AND q > 0 AND q <= 500 AND CASE WHEN p_unit = 'kg' THEN q * 2 = trunc(q * 2) ELSE q = trunc(q) END;
$$;

/*
  p_customer : {"name": "...", "phone": "..."}
  p_items    : [{"product_id": "...", "qty": 2}, ...]
  p_delivery : {"mode": "zone"|"yango", "zone_id": 1, "area": "...", "address": "...", "landmark": "...", "lat": .., "lng": ..}
  p_payment  : 'wave' | 'om'
*/
CREATE OR REPLACE FUNCTION public.place_order(p_customer jsonb, p_items jsonb, p_delivery jsonb, p_payment text, p_note text DEFAULT '', p_channel text DEFAULT 'site')
RETURNS TABLE (order_id uuid, order_number text, order_total integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s store_settings; z delivery_zones; o orders; pr products; it jsonb;
  q numeric; unit_p integer; line integer; sub integer := 0; fee integer := 0; mode text;
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
    SELECT * INTO pr FROM products WHERE id = (it->>'product_id')::uuid AND is_active AND is_online FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_unavailable'; END IF;
    q := (it->>'qty')::numeric;
    IF NOT public.valid_qty(pr.unit, q) THEN RAISE EXCEPTION 'bad_qty'; END IF;
    IF pr.stock < q THEN RAISE EXCEPTION '%', 'out_of_stock:' || pr.name; END IF;
    unit_p := public.effective_price(pr);
    line := round(unit_p * q);
    INSERT INTO order_items (order_id, product_id, name, unit, unit_price, qty, line_total)
    VALUES (o.id, pr.id, pr.name, pr.unit, unit_p, q, line);
    -- le stock est réservé dès la commande ; il revient si la commande est annulée
    INSERT INTO stock_movements (product_id, delta, reason, order_id, created_by)
    VALUES (pr.id, -q, 'vente_en_ligne', o.id, auth.uid());
    sub := sub + line;
  END LOOP;

  IF sub < s.min_order THEN RAISE EXCEPTION 'min_order'; END IF;
  IF s.free_delivery_from IS NOT NULL AND sub >= s.free_delivery_from THEN fee := 0; END IF;
  UPDATE orders SET subtotal = sub, delivery_fee = fee, total = sub + fee WHERE id = o.id;
  RETURN QUERY SELECT o.id, o.number, sub + fee;
END;
$$;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, jsonb, text, text, text) TO anon, authenticated;

-- Suivi d'une commande sans compte : numéro + téléphone
CREATE OR REPLACE FUNCTION public.track_order(p_number text, p_phone text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'number', o.number, 'status', o.status, 'payment_status', o.payment_status, 'payment_method', o.payment_method,
    'delivery_mode', o.delivery_mode, 'area', o.area, 'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total,
    'created_at', o.created_at,
    'items', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'unit', i.unit, 'qty', i.qty, 'unit_price', i.unit_price, 'line_total', i.line_total) ORDER BY i.id), '[]')
              FROM order_items i WHERE i.order_id = o.id))
  FROM orders o
  WHERE upper(o.number) = upper(trim(p_number))
    AND right(regexp_replace(o.customer_phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 9);
$$;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;

-- ===================== Traitement des commandes par l'équipe =====================

CREATE OR REPLACE FUNCTION public.confirm_order_payment(p_order uuid, p_ref text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role('gerant', 'vendeur') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE orders SET payment_status = 'paye', payment_ref = left(coalesce(p_ref, ''), 80), paid_at = now(),
                    status = CASE WHEN status = 'nouvelle' THEN 'preparation' ELSE status END
  WHERE id = p_order AND payment_status = 'en_attente' AND status <> 'annulee';
  IF NOT FOUND THEN RAISE EXCEPTION 'cannot_confirm'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_order_status(p_order uuid, p_status text, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o orders; it order_items;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF o.status IN ('livree', 'annulee') THEN RAISE EXCEPTION 'order_closed'; END IF;

  IF public.has_role('livreur') THEN
    -- le livreur confirme seulement la remise de ses propres commandes
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
    FOR it IN SELECT * FROM order_items WHERE order_id = p_order AND product_id IS NOT NULL LOOP
      INSERT INTO stock_movements (product_id, delta, reason, order_id, created_by)
      VALUES (it.product_id, it.qty, 'annulation', p_order, auth.uid());
    END LOOP;
    UPDATE orders SET cancelled_at = now() WHERE id = p_order;
  ELSE
    RAISE EXCEPTION 'bad_status';
  END IF;

  UPDATE orders SET status = p_status, staff_note = coalesce(left(p_note, 500), staff_note) WHERE id = p_order;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_order(p_order uuid, p_livreur uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role('gerant', 'vendeur') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_livreur IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_livreur AND role = 'livreur' AND active) THEN
    RAISE EXCEPTION 'not_a_livreur';
  END IF;
  UPDATE orders SET assigned_to = p_livreur WHERE id = p_order AND status NOT IN ('livree', 'annulee');
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_order(uuid, uuid) TO authenticated;

-- ===================== Caisse =====================

/*
  p_items : [{"product_id": "...", "qty": 1.25}, ...]  (au poids : quantité en kg, pesée libre)
  Le prix vient toujours de la fiche produit. En caisse, une vente n'est jamais bloquée par le stock
  affiché (le produit est dans la main du client) : un stock négatif signale un inventaire à refaire.
*/
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
    INSERT INTO stock_movements (product_id, delta, reason, sale_id, created_by)
    VALUES (pr.id, -q, 'vente_caisse', sa.id, auth.uid());
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
GRANT EXECUTE ON FUNCTION public.record_sale(jsonb, text, integer) TO authenticated;

-- Annuler un ticket : réservé au gérant, le stock revient
CREATE OR REPLACE FUNCTION public.cancel_sale(p_sale uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it sale_items;
BEGIN
  IF NOT public.has_role('gerant') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE sales SET cancelled_at = now(), cancelled_by = auth.uid() WHERE id = p_sale AND cancelled_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'cannot_cancel'; END IF;
  FOR it IN SELECT * FROM sale_items WHERE sale_id = p_sale AND product_id IS NOT NULL LOOP
    INSERT INTO stock_movements (product_id, delta, reason, sale_id, created_by)
    VALUES (it.product_id, it.qty, 'annulation', p_sale, auth.uid());
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_sale(uuid) TO authenticated;

-- Les fonctions internes ne sont pas appelables directement depuis l'application
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
