"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";
import { writeCost } from "@/lib/costs";

export async function saveCost(productId: string, cost: number | null): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireStaff(["gerant", "stock"]);
  if (!/^[0-9a-f-]{36}$/.test(productId)) return { ok: false, error: "Produit introuvable." };
  if (cost != null && (!Number.isInteger(cost) || cost < 0 || cost > 10_000_000)) return { ok: false, error: "Montant invalide" };
  const { error } = await writeCost(supabase, productId, userId, cost);
  if (error) return { ok: false, error: "Échec" };
  revalidatePath("/gestion/prix-achat");
  return { ok: true };
}
