"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";

const UUID = /^[0-9a-f-]{36}$/;

/** Ajoute un composant au pack (ou change sa quantité) */
export async function setPackItem(packId: string, productId: string, qty: number): Promise<{ error?: string }> {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  if (!UUID.test(packId) || !UUID.test(productId)) return { error: "Produit introuvable." };
  if (!Number.isFinite(qty) || qty <= 0 || qty > 500) return { error: "Quantité invalide." };
  const { error } = await supabase.from("pack_items").upsert({ pack_id: packId, product_id: productId, qty });
  if (error) return { error: error.message.includes("pack_in_pack") ? "Un pack ne peut pas contenir un autre pack." : "Échec de l'enregistrement." };
  revalidatePath(`/gestion/produits/${packId}`);
  return {};
}

export async function removePackItem(packId: string, productId: string): Promise<{ error?: string }> {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  if (!UUID.test(packId) || !UUID.test(productId)) return { error: "Produit introuvable." };
  const { error } = await supabase.from("pack_items").delete().eq("pack_id", packId).eq("product_id", productId);
  if (error) return { error: "Échec de la suppression." };
  revalidatePath(`/gestion/produits/${packId}`);
  return {};
}
