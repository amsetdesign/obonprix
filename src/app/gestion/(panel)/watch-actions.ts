"use server";

import { requireStaff } from "@/lib/staff";

export type OrderPulse = { count: number; latest: { id: string; number: string; total: number; customer_name: string; channel: string; created_at: string } | null };

/** Commandes à traiter (en attente de paiement) et dernière commande reçue : pour la pastille et l'alerte */
export async function orderPulse(): Promise<OrderPulse | null> {
  const { supabase, role } = await requireStaff();
  if (role !== "gerant" && role !== "vendeur") return null;
  const [{ count }, { data }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "nouvelle"),
    supabase.from("orders").select("id, number, total, customer_name, channel, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return { count: count ?? 0, latest: data ?? null };
}
