"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { serviceClient } from "@/lib/supabase/service";

export type TeamState = { ok?: boolean; error?: string; message?: string };

const ROLES = ["gerant", "stock", "vendeur", "livreur"] as const;

const newMember = z.object({
  full_name: z.string().trim().min(2, "Saisissez le nom.").max(120),
  email: z.email("E-mail invalide.").transform((s) => s.toLowerCase()),
  role: z.enum(ROLES),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum.").max(72),
});

/** Le gérant crée le compte d'un membre de l'équipe avec un mot de passe provisoire qu'il lui transmet. */
export async function addMember(_prev: TeamState, fd: FormData): Promise<TeamState> {
  await requireStaff(["gerant"]);
  const parsed = newMember.safeParse({
    full_name: fd.get("full_name") ?? "",
    email: String(fd.get("email") ?? "").trim(),
    role: fd.get("role") ?? "",
    password: fd.get("password") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const admin = serviceClient();
  if (!admin) return { error: "Clé de service absente : la création de comptes n'est pas encore activée." };

  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.full_name },
  });
  if (error || !data.user) {
    return { error: /already|exists|registered/i.test(error?.message ?? "") ? "Un compte existe déjà avec cet e-mail." : "La création du compte a échoué." };
  }
  // le profil est créé par la base à l'inscription ; on lui donne son rôle
  const { error: roleError } = await admin.from("profiles").update({ role: v.role, full_name: v.full_name, active: true }).eq("id", data.user.id);
  if (roleError) return { error: "Compte créé, mais le rôle n'a pas pu être attribué. Réessayez depuis la liste." };
  revalidatePath("/gestion/equipe");
  return { ok: true, message: `Compte créé pour ${v.full_name}. Transmettez-lui son e-mail et son mot de passe provisoire.` };
}

export async function updateMember(userId: string, fd: FormData) {
  const { supabase } = await requireStaff(["gerant"]);
  const role = String(fd.get("role") ?? "");
  if (!(ROLES as readonly string[]).includes(role) || !/^[0-9a-f-]{36}$/.test(userId)) return;
  await supabase.rpc("set_staff_role", { p_user: userId, p_role: role, p_active: fd.get("active") === "on" });
  revalidatePath("/gestion/equipe");
}
