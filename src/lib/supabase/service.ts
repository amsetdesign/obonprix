import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Client « service » (clé secrète) : réservé à la création des comptes de l'équipe par le gérant.
 * Il contourne les règles de la base : toujours vérifier le rôle gérant AVANT de l'utiliser.
 */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
