"use server";

import { z } from "zod";
import { serviceClient } from "@/lib/supabase/service";

export type ApplyState = { ok?: boolean; error?: string };

const CV_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const CV_MAX = 3 * 1024 * 1024;

// limite simple : 5 candidatures par numéro et par heure (mémoire de l'instance)
const recent = new Map<string, number[]>();
function tooMany(key: string) {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < 3_600_000);
  list.push(now);
  recent.set(key, list);
  return list.length > 5;
}

const schema = z.object({
  offer_id: z.union([z.uuid(), z.literal("")]),
  full_name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,20}$/, "Numéro de téléphone invalide."),
  email: z.union([z.email("E-mail invalide."), z.literal("")]),
  message: z.string().trim().max(3000),
});

/** Candidature : enregistrée dans la base, CV rangé dans un espace privé (lu par le gérant seulement) */
export async function applyJob(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  if (String(fd.get("website") ?? "")) return { error: "Envoi refusé." };
  const parsed = schema.safeParse({
    offer_id: String(fd.get("offer_id") ?? ""),
    full_name: fd.get("full_name") ?? "",
    phone: fd.get("phone") ?? "",
    email: String(fd.get("email") ?? "").trim(),
    message: fd.get("message") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (tooMany(v.phone.replace(/\D/g, ""))) return { error: "Trop de candidatures envoyées. Réessayez plus tard." };

  const db = serviceClient();
  if (!db) return { error: "Candidatures momentanément indisponibles." };

  let cv_path = "";
  const cv = fd.get("cv");
  if (cv instanceof File && cv.size > 0) {
    const ext = CV_TYPES[cv.type];
    if (!ext) return { error: "CV : PDF, JPG ou PNG uniquement." };
    if (cv.size > CV_MAX) return { error: "CV trop lourd (3 Mo maximum)." };
    cv_path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from("candidatures").upload(cv_path, cv, { contentType: cv.type });
    if (error) return { error: "Le CV n'a pas pu être envoyé. Réessayez sans CV ou plus tard." };
  }

  const { error } = await db.from("job_applications").insert({
    offer_id: v.offer_id || null, full_name: v.full_name, phone: v.phone, email: v.email, message: v.message, cv_path,
  });
  if (error) return { error: "La candidature n'a pas pu être enregistrée." };
  return { ok: true };
}
