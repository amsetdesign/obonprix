"use server";

import { requireStaff } from "@/lib/staff";

export type SaleResult = { error?: string; sale?: { id: string; number: string; total: number; change: number | null; at: string } };

const ERRORS: Record<string, string> = {
  cash_insufficient: "Le montant donné est inférieur au total.",
  product_unavailable: "Un produit n'a pas de prix : vérifiez sa fiche.",
  bad_qty: "Une quantité est invalide.",
  forbidden: "Votre rôle ne permet pas d'encaisser.",
};

/** Encaisse un ticket : la base recalcule les prix, retire le stock et rend la monnaie */
export async function recordSale(items: { product_id: string; qty: number }[], payment: "especes" | "wave" | "om", cashGiven: number | null): Promise<SaleResult> {
  const { supabase } = await requireStaff(["gerant", "vendeur"]);
  if (!Array.isArray(items) || !items.length || items.length > 150) return { error: "Le ticket est vide." };
  if (!["especes", "wave", "om"].includes(payment)) return { error: "Moyen de paiement invalide." };
  const { data, error } = await supabase.rpc("record_sale", {
    p_items: items.map((i) => ({ product_id: String(i.product_id), qty: Number(i.qty) })),
    p_payment: payment,
    p_cash_given: payment === "especes" ? cashGiven : null,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return { error: Object.entries(ERRORS).find(([k]) => error?.message.includes(k))?.[1] ?? "L'encaissement a échoué. Réessayez." };
  return { sale: { id: row.sale_id, number: row.sale_number, total: row.sale_total, change: row.change_due, at: new Date().toISOString() } };
}

/** Tickets du jour (réimpression, annulation par le gérant) */
export async function todaySales() {
  const { supabase } = await requireStaff(["gerant", "vendeur"]);
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("sales")
    .select("id, number, total, payment_method, cash_given, change_given, cancelled_at, created_at, sale_items(name, unit, unit_price, qty, line_total)")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function cancelSale(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireStaff(["gerant"]);
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "Ticket introuvable." };
  const { error } = await supabase.rpc("cancel_sale", { p_sale: id });
  return error ? { error: "Annulation impossible." } : {};
}
