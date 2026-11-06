"use server";

import { requireStaff } from "@/lib/staff";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Abonne cet appareil aux notifications de nouvelles commandes */
export async function savePushSubscription(sub: Sub, userAgent: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId, role } = await requireStaff();
  if (role !== "gerant" && role !== "vendeur") return { ok: false, error: "Réservé au gérant et au vendeur." };
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false, error: "Abonnement invalide." };
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: userAgent.slice(0, 300) },
    { onConflict: "endpoint" },
  );
  return error ? { ok: false, error: "Enregistrement impossible." } : { ok: true };
}

export async function removePushSubscription(endpoint: string) {
  const { supabase } = await requireStaff();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
