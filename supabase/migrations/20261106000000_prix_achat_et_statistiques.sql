/*
  # Prix d'achat, bénéfices et statistiques de vente

  - product_costs : prix d'achat de chaque produit. Table à part : seuls le gérant et la gestionnaire
    de stock la lisent ou la modifient (jamais le site public, jamais le vendeur).
  - order_items.unit_cost / sale_items.unit_cost : prix d'achat FIGÉ au moment de la vente,
    renseigné automatiquement. Le bénéfice passé reste juste même si le prix d'achat change ensuite.
    Ces colonnes ne sont pas lisibles directement : elles passent par les fonctions réservées au gérant.
  - sales_stats(début, fin) : chiffres d'une période (gérant uniquement).
  - stock_value() : valeur du stock au prix d'achat (gérant et stock).
  Une vente est comptée quand elle est payée : ticket de caisse non annulé, commande en ligne payée et non annulée.
*/

-- ===================== Prix d'achat =====================

CREATE TABLE IF NOT EXISTS public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products ON DELETE CASCADE,
  cost_price integer NOT NULL CHECK (cost_price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles ON DELETE SET NULL
);
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stock team reads costs" ON public.product_costs;
CREATE POLICY "Stock team reads costs" ON public.product_costs FOR SELECT TO authenticated USING (public.has_role('gerant', 'stock'));
DROP POLICY IF EXISTS "Stock team writes costs" ON public.product_costs;
CREATE POLICY "Stock team writes costs" ON public.product_costs FOR ALL TO authenticated
  USING (public.has_role('gerant', 'stock')) WITH CHECK (public.has_role('gerant', 'stock'));
REVOKE ALL ON public.product_costs FROM anon;
DROP TRIGGER IF EXISTS touch_product_costs ON public.product_costs;
CREATE TRIGGER touch_product_costs BEFORE UPDATE ON public.product_costs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===================== Prix d'achat figé à la vente =====================

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_cost integer;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit_cost integer;

CREATE OR REPLACE FUNCTION public.capture_unit_cost()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.product_id IS NOT NULL THEN
    SELECT cost_price INTO new.unit_cost FROM product_costs WHERE product_id = new.product_id;
  END IF;
  RETURN new;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.capture_unit_cost() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS capture_unit_cost ON public.order_items;
CREATE TRIGGER capture_unit_cost BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.capture_unit_cost();
DROP TRIGGER IF EXISTS capture_unit_cost ON public.sale_items;
CREATE TRIGGER capture_unit_cost BEFORE INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.capture_unit_cost();

-- le prix d'achat figé n'est pas lisible depuis l'application (seulement via sales_stats)
REVOKE SELECT ON public.order_items FROM anon, authenticated;
GRANT SELECT (id, order_id, product_id, name, unit, unit_price, qty, line_total) ON public.order_items TO authenticated;
REVOKE SELECT ON public.sale_items FROM anon, authenticated;
GRANT SELECT (id, sale_id, product_id, name, unit, unit_price, qty, line_total) ON public.sale_items TO authenticated;

-- ===================== Statistiques =====================

CREATE OR REPLACE FUNCTION public.sales_stats(p_from timestamptz, p_to timestamptz)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role('gerant') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_to <= p_from OR p_to - p_from > interval '400 days' THEN RAISE EXCEPTION 'bad_period'; END IF;

  WITH lines AS (
    -- caisse : tickets non annulés
    SELECT s.created_at AS at, 'caisse' AS channel, s.id AS ticket, s.payment_method AS method,
           i.product_id, i.name, i.unit, i.qty, i.line_total, i.unit_cost
    FROM sales s JOIN sale_items i ON i.sale_id = s.id
    WHERE s.cancelled_at IS NULL AND s.created_at >= p_from AND s.created_at < p_to
    UNION ALL
    -- en ligne : commandes payées et non annulées (date de la commande)
    SELECT o.created_at, 'en_ligne', o.id, o.payment_method,
           i.product_id, i.name, i.unit, i.qty, i.line_total, i.unit_cost
    FROM orders o JOIN order_items i ON i.order_id = o.id
    WHERE o.payment_status = 'paye' AND o.status <> 'annulee' AND o.created_at >= p_from AND o.created_at < p_to
  ),
  costed AS (
    SELECT *, CASE WHEN unit_cost IS NULL THEN NULL ELSE round(unit_cost * qty)::bigint END AS cost FROM lines
  ),
  fees AS (
    SELECT coalesce(sum(delivery_fee), 0) AS delivery_fees
    FROM orders WHERE payment_status = 'paye' AND status <> 'annulee' AND created_at >= p_from AND created_at < p_to
  )
  SELECT jsonb_build_object(
    'revenue', coalesce((SELECT sum(line_total) FROM costed), 0),
    'cost', coalesce((SELECT sum(cost) FROM costed), 0),
    'revenue_with_cost', coalesce((SELECT sum(line_total) FROM costed WHERE cost IS NOT NULL), 0),
    'lines_without_cost', (SELECT count(*) FROM costed WHERE cost IS NULL),
    'tickets', (SELECT count(DISTINCT ticket) FROM costed),
    'delivery_fees', (SELECT delivery_fees FROM fees),
    'by_channel', coalesce((SELECT jsonb_object_agg(channel, jsonb_build_object('revenue', r, 'tickets', t)) FROM (
        SELECT channel, sum(line_total) r, count(DISTINCT ticket) t FROM costed GROUP BY channel) c), '{}'),
    'by_method', coalesce((SELECT jsonb_object_agg(method, r) FROM (
        SELECT method, sum(line_total) r FROM costed GROUP BY method) m), '{}'),
    'by_day', coalesce((SELECT jsonb_agg(jsonb_build_object('day', d, 'revenue', r, 'margin', m, 'tickets', t) ORDER BY d) FROM (
        SELECT (at AT TIME ZONE 'Africa/Dakar')::date d, sum(line_total) r,
               sum(line_total - cost) FILTER (WHERE cost IS NOT NULL) m, count(DISTINCT ticket) t
        FROM costed GROUP BY 1) x), '[]'),
    'by_hour', coalesce((SELECT jsonb_agg(jsonb_build_object('hour', h, 'revenue', r) ORDER BY h) FROM (
        SELECT extract(hour FROM at AT TIME ZONE 'Africa/Dakar')::int h, sum(line_total) r FROM costed GROUP BY 1) x), '[]'),
    'top_products', coalesce((SELECT jsonb_agg(row_to_json(t) ORDER BY t.revenue DESC) FROM (
        SELECT product_id, max(name) AS name, max(unit) AS unit, sum(qty) AS qty, sum(line_total) AS revenue,
               CASE WHEN count(cost) = count(*) THEN sum(line_total - cost) END AS margin
        FROM costed GROUP BY product_id ORDER BY sum(line_total) DESC LIMIT 15) t), '[]'),
    'by_category', coalesce((SELECT jsonb_agg(row_to_json(t) ORDER BY t.revenue DESC) FROM (
        SELECT coalesce(c.name, 'Sans rayon') AS name, sum(l.line_total) AS revenue,
               sum(l.line_total - l.cost) FILTER (WHERE l.cost IS NOT NULL) AS margin
        FROM costed l LEFT JOIN products p ON p.id = l.product_id LEFT JOIN categories c ON c.id = p.category_id
        GROUP BY 1) t), '[]')
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.sales_stats(timestamptz, timestamptz) TO authenticated;

-- Valeur du stock au prix d'achat (produits actifs en stock)
CREATE OR REPLACE FUNCTION public.stock_value()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN NOT public.has_role('gerant', 'stock') THEN NULL ELSE jsonb_build_object(
    'value', coalesce(sum(round(p.stock * c.cost_price)) FILTER (WHERE c.cost_price IS NOT NULL), 0),
    'products_without_cost', count(*) FILTER (WHERE c.cost_price IS NULL)
  ) END
  FROM products p LEFT JOIN product_costs c ON c.product_id = p.id
  WHERE p.is_active AND p.stock > 0;
$$;
GRANT EXECUTE ON FUNCTION public.stock_value() TO authenticated;
