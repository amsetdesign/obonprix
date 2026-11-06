/*
  # Notifications de nouvelles commandes (téléphones de l'équipe)

  - push_subscriptions : appareils de l'équipe abonnés aux notifications (gestion installée sur l'écran d'accueil).
  - notify_config : adresse du site et secret partagé (lisibles par la base seule, jamais par l'application).
  - À la fin de chaque commande (site ou application), la base appelle le site, qui envoie la notification
    au gérant et au vendeur. Gratuit : aucun SMS ni message payant.
  Le fichier « à coller » du Bureau contient le vrai secret à la place de __NOTIFY_SECRET__.
*/

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (endpoint LIKE 'https://%' AND char_length(endpoint) <= 1000),
  p256dh text NOT NULL CHECK (char_length(p256dh) <= 200),
  auth text NOT NULL CHECK (char_length(auth) <= 100),
  user_agent text NOT NULL DEFAULT '' CHECK (char_length(user_agent) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage own devices" ON public.push_subscriptions;
CREATE POLICY "Staff manage own devices" ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.has_role('gerant', 'vendeur'));
REVOKE ALL ON public.push_subscriptions FROM anon;

CREATE TABLE IF NOT EXISTS public.notify_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.notify_config ENABLE ROW LEVEL SECURITY;  -- aucune règle : illisible depuis l'application
REVOKE ALL ON public.notify_config FROM anon, authenticated;

INSERT INTO public.notify_config (key, value) VALUES
  ('order_hook_url', 'https://obonprix.vercel.app/api/notify-order'),
  ('order_hook_secret', '__NOTIFY_SECRET__')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- place_order crée la commande puis inscrit son total : c'est ce moment qui déclenche l'alerte
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE url text; secret text;
BEGIN
  SELECT value INTO url FROM notify_config WHERE key = 'order_hook_url';
  SELECT value INTO secret FROM notify_config WHERE key = 'order_hook_secret';
  IF url IS NULL OR secret IS NULL OR secret = '__NOTIFY_SECRET__' THEN RETURN NULL; END IF;
  PERFORM net.http_post(
    url := url,
    body := jsonb_build_object('order_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', secret),
    timeout_milliseconds := 5000
  );
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;  -- une alerte manquée ne doit jamais bloquer une commande
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_new_order ON public.orders;
CREATE TRIGGER notify_new_order AFTER UPDATE OF total ON public.orders
  FOR EACH ROW WHEN (old.total = 0 AND new.total > 0) EXECUTE FUNCTION public.notify_new_order();

-- Vérification
SELECT key, CASE WHEN key = 'order_hook_secret' THEN '(secret enregistré)' ELSE value END AS valeur FROM public.notify_config;
