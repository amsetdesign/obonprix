"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";

export type OrderActionState = { error?: string; ok?: string };

const ERRORS: Record<string, string> = {
  payment_required: "Confirmez d'abord le paiement : une commande ne part jamais sans paiement.",
  cannot_confirm: "Ce paiement est déjà confirmé ou la commande est annulée.",
  order_closed: "Cette commande est déjà terminée.",
  forbidden: "Votre rôle ne permet pas cette action.",
  not_a_livreur: "Cette personne n'a pas le rôle livreur.",
};
const explain = (msg = "") => Object.entries(ERRORS).find(([k]) => msg.includes(k))?.[1] ?? "L'action a échoué. Réessayez.";

export async function orderAction(orderId: string, _prev: OrderActionState, fd: FormData): Promise<OrderActionState> {
  const { supabase } = await requireStaff(["gerant", "vendeur", "livreur"]);
  if (!/^[0-9a-f-]{36}$/.test(orderId)) return { error: "Commande introuvable." };
  const op = String(fd.get("op") ?? "");
  let res;
  if (op === "pay") {
    res = await supabase.rpc("confirm_order_payment", { p_order: orderId, p_ref: String(fd.get("ref") ?? "").trim().slice(0, 80) });
  } else if (op === "assign") {
    const who = String(fd.get("livreur") ?? "");
    res = await supabase.rpc("assign_order", { p_order: orderId, p_livreur: who || null });
  } else if (["expediee", "livree", "annulee"].includes(op)) {
    if (op === "annulee" && !String(fd.get("reason") ?? "").trim()) return { error: "Indiquez la raison de l'annulation." };
    res = await supabase.rpc("set_order_status", { p_order: orderId, p_status: op, p_note: op === "annulee" ? String(fd.get("reason")).trim().slice(0, 500) : null });
  } else {
    return { error: "Action inconnue." };
  }
  if (res.error) return { error: explain(res.error.message) };
  revalidatePath("/gestion/commandes");
  revalidatePath(`/gestion/commandes/${orderId}`);
  return { ok: { pay: "Paiement confirmé.", assign: "Livreur attribué.", expediee: "Commande en route.", livree: "Commande livrée.", annulee: "Commande annulée, stock rendu." }[op] };
}
