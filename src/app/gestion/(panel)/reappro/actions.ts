"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";

export type SupplierState = { ok?: boolean; error?: string; at?: number };

export async function addSupplier(_prev: SupplierState, fd: FormData): Promise<SupplierState> {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  if (name.length < 2 || name.length > 120) return { error: "Indiquez le nom du fournisseur." };
  if (phone && !/^\+?[0-9 ]{9,20}$/.test(phone)) return { error: "Numéro de téléphone invalide." };
  const { error } = await supabase.from("suppliers").insert({ name, phone, note });
  if (error) return { error: "L'enregistrement a échoué." };
  revalidatePath("/gestion/reappro");
  return { ok: true, at: Date.now() };
}

export async function removeSupplier(id: number) {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  if (!Number.isInteger(id)) return;
  await supabase.from("suppliers").delete().eq("id", id);
  revalidatePath("/gestion/reappro");
}

/** Rattache un produit à son fournisseur (depuis la liste à réapprovisionner) */
export async function setProductSupplier(productId: string, supplierId: number | null) {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  if (!/^[0-9a-f-]{36}$/.test(productId)) return;
  await supabase.from("products").update({ supplier_id: supplierId }).eq("id", productId);
  revalidatePath("/gestion/reappro");
}
