"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";
import { serviceClient } from "@/lib/supabase/service";

export type OfferState = { ok?: boolean; error?: string; at?: number };
const CONTRACTS = ["CDI", "CDD", "Stage", "Temps partiel", "Prestation"];

export async function saveOffer(_prev: OfferState, fd: FormData): Promise<OfferState> {
  const { supabase } = await requireStaff(["gerant"]);
  const title = String(fd.get("title") ?? "").trim();
  const contract = String(fd.get("contract") ?? "CDD");
  const closes = String(fd.get("closes_on") ?? "");
  if (title.length < 3) return { error: "Indiquez l'intitulé du poste." };
  if (!CONTRACTS.includes(contract)) return { error: "Type de contrat invalide." };
  const { error } = await supabase.from("job_offers").insert({
    title: title.slice(0, 120), contract,
    location: String(fd.get("location") ?? "Dakar").trim().slice(0, 80) || "Dakar",
    description: String(fd.get("description") ?? "").trim().slice(0, 4000),
    requirements: String(fd.get("requirements") ?? "").trim().slice(0, 3000),
    closes_on: /^\d{4}-\d{2}-\d{2}$/.test(closes) ? closes : null,
  });
  if (error) return { error: "L'enregistrement a échoué." };
  revalidatePath("/gestion/recrutement");
  revalidatePath("/recrutement");
  return { ok: true, at: Date.now() };
}

export async function toggleOffer(id: string, open: boolean) {
  const { supabase } = await requireStaff(["gerant"]);
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await supabase.from("job_offers").update({ is_open: open }).eq("id", id);
  revalidatePath("/gestion/recrutement");
  revalidatePath("/recrutement");
}

export async function setApplicationStatus(id: string, status: string) {
  const { supabase } = await requireStaff(["gerant"]);
  if (!/^[0-9a-f-]{36}$/.test(id) || !["nouvelle", "vue", "retenue", "refusee"].includes(status)) return;
  await supabase.from("job_applications").update({ status }).eq("id", id);
  revalidatePath("/gestion/recrutement");
}

/** Lien temporaire (10 min) vers un CV de l'espace privé : réservé au gérant */
export async function cvLink(id: string): Promise<string | null> {
  const { supabase } = await requireStaff(["gerant"]);
  const { data } = await supabase.from("job_applications").select("cv_path").eq("id", id).maybeSingle();
  if (!data?.cv_path) return null;
  const db = serviceClient();
  const { data: signed } = (await db?.storage.from("candidatures").createSignedUrl(data.cv_path, 600)) ?? { data: null };
  return signed?.signedUrl ?? null;
}
