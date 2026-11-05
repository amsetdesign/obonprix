import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { sessionClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";
import type { StaffRole } from "@/lib/roles";

/** Membre de l'équipe connecté (compte actif avec un rôle), ou null. Même règle que la base : has_role(). */
export const getStaff = cache(async () => {
  // toujours rendu à la demande : jamais de page de gestion figée à la compilation
  await connection();
  if (!hasSupabase) return null;
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role, active").eq("id", uid).maybeSingle();
  if (!profile?.role || !profile.active) return null;
  return {
    supabase,
    userId: uid,
    email: (data.claims.email as string | undefined) ?? "",
    name: (profile.full_name as string) || "",
    role: profile.role as StaffRole,
  };
});

/** Garde des pages et actions : renvoie vers la connexion, ou vers l'accueil si le rôle ne suffit pas. */
export async function requireStaff(roles?: StaffRole[]) {
  const staff = await getStaff();
  if (!staff) redirect("/gestion/connexion");
  if (roles && !roles.includes(staff.role)) redirect("/gestion");
  return staff;
}
