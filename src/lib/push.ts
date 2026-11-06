import "server-only";
import webpush from "web-push";
import { serviceClient } from "@/lib/supabase/service";
import { fcfa } from "@/lib/format";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
export const pushReady = Boolean(PUBLIC && PRIVATE);

if (pushReady) webpush.setVapidDetails("mailto:contact.obonprixsn@gmail.com", PUBLIC, PRIVATE);

/** Envoie « Nouvelle commande » à tous les appareils abonnés du gérant et du vendeur */
export async function notifyNewOrder(orderId: string) {
  const db = serviceClient();
  if (!db || !pushReady) return { sent: 0, reason: "push non configuré" };

  const { data: o } = await db
    .from("orders")
    .select("id, number, customer_name, area, delivery_mode, total, payment_method, channel, order_items(name, qty, unit)")
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return { sent: 0, reason: "commande introuvable" };

  const { data: staff } = await db.from("profiles").select("id").in("role", ["gerant", "vendeur"]).eq("active", true);
  const ids = (staff ?? []).map((s) => s.id);
  if (!ids.length) return { sent: 0, reason: "aucun destinataire" };
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", ids);

  const items = (o.order_items ?? []) as { name: string; qty: number; unit: string }[];
  const first = items.slice(0, 2).map((i) => i.name).join(", ");
  const payload = JSON.stringify({
    title: `Nouvelle commande ${o.number} · ${fcfa(o.total)}`,
    body: `${o.customer_name} · ${o.area || (o.delivery_mode === "yango" ? "Yango" : "")} · ${o.payment_method === "om" ? "Orange Money" : "Wave"}${o.channel === "app" ? " · application" : ""}\n${first}${items.length > 2 ? ` et ${items.length - 2} autre${items.length > 3 ? "s" : ""}` : ""}`,
    url: `/gestion/commandes/${o.id}`,
    tag: `commande-${o.id}`,
  });

  let sent = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 6, urgency: "high" });
      sent++;
    } catch (e) {
      // appareil désinscrit ou périmé : on l'oublie
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
    }
  }));
  return { sent };
}
