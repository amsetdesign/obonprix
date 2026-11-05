"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";
import { parseNum } from "@/lib/format";

export type StockState = { ok?: boolean; error?: string; message?: string };

/** Arrivage (+), perte (-) ou ajustement (+/-) : un mouvement dans le journal, le stock suit. */
export async function recordMovement(_prev: StockState, fd: FormData): Promise<StockState> {
  const { supabase, userId } = await requireStaff(["gerant", "stock"]);
  const productId = String(fd.get("product_id") ?? "");
  const kind = String(fd.get("kind") ?? "");
  const amount = parseNum(fd.get("qty"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  if (!/^[0-9a-f-]{36}$/.test(productId)) return { error: "Choisissez un produit." };
  if (!["achat", "perte", "ajustement_plus", "ajustement_moins"].includes(kind)) return { error: "Choisissez le type de mouvement." };
  if (amount == null || amount <= 0 || amount > 100000) return { error: "Quantité invalide." };

  const { data: p } = await supabase.from("products").select("name, unit").eq("id", productId).maybeSingle();
  if (!p) return { error: "Produit introuvable." };
  if (p.unit === "piece" && !Number.isInteger(amount)) return { error: "Ce produit se compte à la pièce : quantité entière." };
  if (kind === "perte" && !note) return { error: "Précisez la cause de la perte (casse, périmé…)." };

  const negative = kind === "perte" || kind === "ajustement_moins";
  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId,
    delta: negative ? -amount : amount,
    reason: kind.startsWith("ajustement") ? "ajustement" : kind,
    note,
    created_by: userId,
  });
  if (error) return { error: "L'enregistrement a échoué. Réessayez." };
  revalidatePath("/gestion/stock");
  revalidatePath(`/gestion/produits/${productId}`);
  return { ok: true, message: `${p.name} : ${negative ? "-" : "+"}${String(amount).replace(".", ",")}${p.unit === "kg" ? " kg" : ""} enregistré.` };
}

/** Inventaire : quantité comptée -> la base enregistre l'écart (fonction count_stock). */
export async function countStock(productId: string, counted: number): Promise<{ ok: boolean; diff?: number; error?: string }> {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  if (!/^[0-9a-f-]{36}$/.test(productId) || !Number.isFinite(counted) || counted < 0 || counted > 100000) {
    return { ok: false, error: "Quantité invalide." };
  }
  const { data, error } = await supabase.rpc("count_stock", { p_product: productId, p_counted: counted, p_note: "Inventaire" });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };
  revalidatePath("/gestion/inventaire");
  return { ok: true, diff: Number(data) };
}
