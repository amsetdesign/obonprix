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

export type RegisterStatus = { since: string; cash: number; wave: number; om: number; tickets: number; cancelled: number };
export type Closure = {
  id: string; period_start: string; period_end: string; opening_float: number; cash_sales: number; wave_sales: number; om_sales: number;
  tickets: number; cancelled: number; expected_cash: number; counted_cash: number; difference: number; note: string;
};

/** Point de caisse depuis la dernière clôture */
export async function registerStatus(): Promise<RegisterStatus | null> {
  const { supabase } = await requireStaff(["gerant", "vendeur"]);
  const { data } = await supabase.rpc("register_status");
  return (data as RegisterStatus | null) ?? null;
}

/** Clôture : espèces comptées comparées au montant attendu (fond + ventes en espèces) */
export async function closeRegister(openingFloat: number, counted: number, note: string): Promise<{ error?: string; closure?: Closure }> {
  const { supabase } = await requireStaff(["gerant", "vendeur"]);
  if (!Number.isInteger(openingFloat) || openingFloat < 0 || !Number.isInteger(counted) || counted < 0) return { error: "Montants invalides." };
  const { data, error } = await supabase.rpc("close_register", { p_float: openingFloat, p_counted: counted, p_note: note.slice(0, 300) });
  if (error || !data) return { error: "La clôture a échoué. Réessayez." };
  return { closure: data as Closure };
}
