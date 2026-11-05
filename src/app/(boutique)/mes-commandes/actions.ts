"use server";

import { publicClient } from "@/lib/supabase/public";
import { trackOrder } from "../commande/actions";

/** Statut à jour des commandes gardées sur le téléphone (numéro + téléphone, comme le suivi) */
export async function orderStatuses(list: { number: string; phone: string }[]) {
  const out: Record<string, { status: string; payment_status: string; total: number } | null> = {};
  await Promise.all(
    list.slice(0, 20).map(async ({ number, phone }) => {
      const o = await trackOrder(String(number), String(phone));
      out[number] = o ? { status: o.status, payment_status: o.payment_status, total: o.total } : null;
    }),
  );
  return out;
}

/** Prix et disponibilité du jour, pour « Commander à nouveau » */
export async function currentProducts(ids: string[]) {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/.test(id)).slice(0, 80);
  if (!clean.length) return [];
  const { data } = await publicClient()
    .from("products")
    .select("id, slug, name, unit, price, promo_price, stock, image_url")
    .in("id", clean)
    .eq("is_active", true)
    .eq("is_online", true)
    .not("price", "is", null);
  return (data ?? []).map((p) => ({
    id: p.id as string, slug: p.slug as string, name: p.name as string, unit: p.unit as "piece" | "kg",
    price: (p.promo_price ?? p.price) as number, image_url: p.image_url as string, in_stock: Number(p.stock) > 0,
  }));
}
