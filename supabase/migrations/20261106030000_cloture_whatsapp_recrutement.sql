/*
  # Clôture de caisse, commandes WhatsApp, annulation automatique, recrutement, informations légales

  1. Clôture de caisse : le vendeur compte les espèces du tiroir, la base compare au montant attendu
     (fond de caisse + ventes en espèces depuis la dernière clôture) et garde l'historique.
  2. Commandes WhatsApp : l'équipe saisit les commandes reçues sur WhatsApp (stock, suivi, statistiques).
  3. Commandes non payées annulées automatiquement après N heures (3 par défaut) : le stock est rendu.
  4. Recrutement : offres d'emploi publiées sur le site, candidatures reçues dans la gestion (CV privés).
  5. Informations légales (raison sociale, NINEA, RCCM, e-mail) pour les mentions légales du site.
*/

-- ===================== Réglages =====================

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS unpaid_cancel_hours integer NOT NULL DEFAULT 3 CHECK (unpaid_cancel_hours BETWEEN 0 AND 72);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS legal_name text NOT NULL DEFAULT 'Ô Bon Prix Superette' CHECK (char_length(legal_name) <= 160);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS ninea text NOT NULL DEFAULT '' CHECK (char_length(ninea) <= 40);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS rccm text NOT NULL DEFAULT '' CHECK (char_length(rccm) <= 60);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT 'contact.obonprixsn@gmail.com' CHECK (char_length(email) <= 160);

-- ===================== 1. Clôture de caisse =====================

CREATE TABLE IF NOT EXISTS public.cash_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL DEFAULT now(),
  opening_float integer NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
  cash_sales integer NOT NULL,
  wave_sales integer NOT NULL,
  om_sales integer NOT NULL,
  tickets integer NOT NULL,
  cancelled integer NOT NULL DEFAULT 0,
  expected_cash integer NOT NULL,
  counted_cash integer NOT NULL CHECK (counted_cash >= 0),
  difference integer NOT NULL,
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 300),
  closed_by uuid REFERENCES public.profiles ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cash_closures_end_idx ON public.cash_closures (period_end DESC);
ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cash team reads closures" ON public.cash_closures;
CREATE POLICY "Cash team reads closures" ON public.cash_closures FOR SELECT TO authenticated USING (public.has_role('gerant', 'vendeur'));

-- Point de caisse depuis la dernière clôture (ou depuis minuit à Dakar si aucune)
CREATE OR REPLACE FUNCTION public.register_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE since timestamptz; r jsonb;
BEGIN
  IF NOT public.has_role('gerant', 'vendeur') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT coalesce(max(period_end), date_trunc('day', now() AT TIME ZONE 'Africa/Dakar') AT TIME ZONE 'Africa/Dakar') INTO since FROM cash_closures;
  SELECT jsonb_build_object(
    'since', since,
    'cash', coalesce(sum(total) FILTER (WHERE payment_method = 'especes' AND cancelled_at IS NULL), 0),
    'wave', coalesce(sum(total) FILTER (WHERE payment_method = 'wave' AND cancelled_at IS NULL), 0),
    'om', coalesce(sum(total) FILTER (WHERE payment_method = 'om' AND cancelled_at IS NULL), 0),
    'tickets', count(*) FILTER (WHERE cancelled_at IS NULL),
    'cancelled', count(*) FILTER (WHERE cancelled_at IS NOT NULL)
  ) INTO r FROM sales WHERE created_at >= since;
  RETURN r;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.close_register(p_float integer, p_counted integer, p_note text DEFAULT '')
RETURNS public.cash_closures LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE st jsonb; c cash_closures; expected integer;
BEGIN
  IF NOT public.has_role('gerant', 'vendeur') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_float IS NULL OR p_float < 0 OR p_counted IS NULL OR p_counted < 0 THEN RAISE EXCEPTION 'bad_amount'; END IF;
  st := public.register_status();
  expected := p_float + (st->>'cash')::integer;
  INSERT INTO cash_closures (period_start, opening_float, cash_sales, wave_sales, om_sales, tickets, cancelled, expected_cash, counted_cash, difference, note, closed_by)
  VALUES ((st->>'since')::timestamptz, p_float, (st->>'cash')::integer, (st->>'wave')::integer, (st->>'om')::integer,
          (st->>'tickets')::integer, (st->>'cancelled')::integer, expected, p_counted, p_counted - expected, left(coalesce(p_note, ''), 300), auth.uid())
  RETURNING * INTO c;
  RETURN c;
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_register(integer, integer, text) TO authenticated;

-- ===================== 2. Commandes reçues sur WhatsApp =====================

CREATE OR REPLACE FUNCTION public.staff_place_order(p_customer jsonb, p_items jsonb, p_delivery jsonb, p_payment text, p_note text DEFAULT '', p_paid boolean DEFAULT false, p_ref text DEFAULT '')
RETURNS TABLE (order_id uuid, order_number text, order_total integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.has_role('gerant', 'vendeur') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO r FROM public.place_order(p_customer, p_items, p_delivery, p_payment, p_note, 'site');
  -- la commande vient de WhatsApp et n'appartient pas au compte du vendeur qui la saisit
  UPDATE orders SET channel = 'whatsapp', customer_id = NULL WHERE id = r.order_id;
  IF p_paid THEN
    UPDATE orders SET payment_status = 'paye', payment_ref = left(coalesce(p_ref, ''), 80), paid_at = now(), status = 'preparation' WHERE id = r.order_id;
  END IF;
  RETURN QUERY SELECT r.order_id, r.order_number, r.order_total;
END;
$$;
GRANT EXECUTE ON FUNCTION public.staff_place_order(jsonb, jsonb, jsonb, text, text, boolean, text) TO authenticated;

-- ===================== 3. Annulation automatique des commandes non payées =====================

CREATE OR REPLACE FUNCTION public.cancel_stale_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h integer; o record; n integer := 0;
BEGIN
  SELECT unpaid_cancel_hours INTO h FROM store_settings WHERE id = 1;
  IF h IS NULL OR h = 0 THEN RETURN 0; END IF;
  FOR o IN SELECT id FROM orders WHERE status = 'nouvelle' AND payment_status = 'en_attente' AND created_at < now() - make_interval(hours => h) FOR UPDATE LOOP
    INSERT INTO stock_movements (product_id, delta, reason, note, order_id)
    SELECT m.product_id, -m.delta, 'annulation', 'Annulation automatique (non payée)', o.id
    FROM stock_movements m WHERE m.order_id = o.id AND m.reason = 'vente_en_ligne';
    UPDATE orders SET status = 'annulee', cancelled_at = now(), staff_note = 'Annulée automatiquement : non payée sous ' || h || ' h' WHERE id = o.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cancel_stale_orders() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN
  PERFORM cron.unschedule('obp-annulation-auto');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('obp-annulation-auto', '*/15 * * * *', 'SELECT public.cancel_stale_orders()');

-- ===================== 4. Recrutement =====================

CREATE TABLE IF NOT EXISTS public.job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  contract text NOT NULL DEFAULT 'CDD' CHECK (contract IN ('CDI', 'CDD', 'Stage', 'Temps partiel', 'Prestation')),
  location text NOT NULL DEFAULT 'Dakar' CHECK (char_length(location) <= 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  requirements text NOT NULL DEFAULT '' CHECK (char_length(requirements) <= 3000),
  is_open boolean NOT NULL DEFAULT true,
  closes_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone reads open offers" ON public.job_offers;
CREATE POLICY "Everyone reads open offers" ON public.job_offers FOR SELECT TO anon, authenticated
  USING ((is_open AND (closes_on IS NULL OR closes_on >= current_date)) OR public.has_role('gerant'));
DROP POLICY IF EXISTS "Gerant manages offers" ON public.job_offers;
CREATE POLICY "Gerant manages offers" ON public.job_offers FOR ALL TO authenticated
  USING (public.has_role('gerant')) WITH CHECK (public.has_role('gerant'));

-- Les candidatures arrivent par le site (serveur, clé de service) ; seul le gérant les lit
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.job_offers ON DELETE SET NULL,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 9 AND 30),
  email text NOT NULL DEFAULT '' CHECK (char_length(email) <= 160),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 3000),
  cv_path text NOT NULL DEFAULT '' CHECK (char_length(cv_path) <= 300),
  status text NOT NULL DEFAULT 'nouvelle' CHECK (status IN ('nouvelle', 'vue', 'retenue', 'refusee')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gerant reads applications" ON public.job_applications;
CREATE POLICY "Gerant reads applications" ON public.job_applications FOR SELECT TO authenticated USING (public.has_role('gerant'));
DROP POLICY IF EXISTS "Gerant updates applications" ON public.job_applications;
CREATE POLICY "Gerant updates applications" ON public.job_applications FOR UPDATE TO authenticated
  USING (public.has_role('gerant')) WITH CHECK (public.has_role('gerant'));
REVOKE ALL ON public.job_applications FROM anon;

-- CV : espace privé (jamais public), lu par le gérant via un lien temporaire
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('candidatures', 'candidatures', false, 3145728, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Vérification
SELECT jobname, schedule FROM cron.job WHERE jobname = 'obp-annulation-auto';
