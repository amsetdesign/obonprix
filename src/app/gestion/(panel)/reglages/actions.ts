"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";
import { parseNum } from "@/lib/format";

export type SettingsState = { ok?: boolean; error?: string };

const DAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveSettings(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const { supabase } = await requireStaff(["gerant"]);
  const hours: Record<string, [string, string] | null> = {};
  for (const d of DAYS) {
    if (fd.get(`${d}_closed`) === "on") { hours[d] = null; continue; }
    const open = String(fd.get(`${d}_open`) ?? ""), close = String(fd.get(`${d}_close`) ?? "");
    if (!TIME.test(open) || !TIME.test(close)) return { error: "Horaires : format HH:MM." };
    hours[d] = [open, close];
  }
  const phone = String(fd.get("phone") ?? "").trim();
  const wave = String(fd.get("wave_number") ?? "").trim();
  const om = String(fd.get("om_number") ?? "").trim();
  if (![phone, wave, om].every((n) => /^\+?[0-9 ]{9,20}$/.test(n))) return { error: "Numéro de téléphone invalide." };

  const { error } = await supabase.from("store_settings").update({
    accepting_orders: fd.get("accepting_orders") === "on",
    phone, wave_number: wave, om_number: om,
    whatsapp: phone.replace(/\D/g, "").replace(/^(?!221)/, "221"),
    base_address: String(fd.get("base_address") ?? "").trim().slice(0, 200),
    hours,
  }).eq("id", 1);
  if (error) return { error: "L'enregistrement a échoué." };
  revalidatePath("/gestion/reglages");
  return { ok: true };
}

export async function saveZone(zoneId: number, fd: FormData) {
  const { supabase } = await requireStaff(["gerant"]);
  const price = parseNum(fd.get("price"));
  if (price == null || price < 0 || price > 50000 || !Number.isInteger(price)) return;
  const areas = String(fd.get("areas") ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 60);
  await supabase.from("delivery_zones").update({ price, areas, active: fd.get("active") === "on" }).eq("id", zoneId);
  revalidatePath("/gestion/reglages");
}
