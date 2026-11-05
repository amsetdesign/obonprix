"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicClient } from "@/lib/supabase/public";

export type CheckoutState = { error?: string; fields?: Record<string, string> };

const LAST_ORDER_COOKIE = "obp_commande";

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,20}$/, "Numéro de téléphone invalide (ex. 77 123 45 67)."),
  delivery: z.string().min(1, "Choisissez votre quartier."),
  area_other: z.string().trim().max(80),
  address: z.string().trim().min(4, "Indiquez votre adresse.").max(300),
  landmark: z.string().trim().max(200),
  lat: z.string().max(30),
  lng: z.string().max(30),
  payment: z.enum(["wave", "om"], { error: "Choisissez Wave ou Orange Money." }),
  note: z.string().trim().max(500),
  items: z.string().max(20000),
});

const items = z.array(z.object({ product_id: z.uuid(), qty: z.number().positive().max(500) })).min(1, "Votre panier est vide.").max(80);

/** Erreurs de la base -> messages pour le client */
function explain(msg: string) {
  if (msg.startsWith("out_of_stock:")) return `Il ne reste plus assez de « ${msg.slice(13)} ». Réduisez la quantité ou retirez-le du panier.`;
  if (msg.includes("product_unavailable")) return "Un produit de votre panier n'est plus disponible. Retirez-le puis réessayez.";
  if (msg.includes("orders_closed")) return "Les commandes en ligne sont suspendues pour le moment. Écrivez-nous sur WhatsApp.";
  if (msg.includes("min_order")) return "Le montant minimum de commande n'est pas atteint.";
  if (msg.includes("bad_qty")) return "Une quantité du panier est invalide.";
  if (msg.includes("bad_zone")) return "Ce quartier n'est plus desservi. Choisissez la livraison Yango.";
  return "La commande n'a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp.";
}

export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const raw = Object.fromEntries(["name", "phone", "delivery", "area_other", "address", "landmark", "lat", "lng", "payment", "note", "items"].map((k) => [k, String(fd.get(k) ?? "")]));
  const fields = { ...raw, items: "" };
  // pot de miel : champ invisible rempli = robot
  if (String(fd.get("website") ?? "")) return { error: "Envoi refusé.", fields };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  const v = parsed.data;

  let lines;
  try {
    lines = items.parse(JSON.parse(v.items));
  } catch {
    return { error: "Votre panier est vide ou invalide.", fields };
  }

  // « z:<id>:<quartier> » pour une zone, « yango » sinon
  let delivery: Record<string, unknown>;
  if (v.delivery === "yango") {
    if (!v.area_other) return { error: "Indiquez votre quartier pour la livraison Yango.", fields };
    delivery = { mode: "yango", area: v.area_other };
  } else {
    const m = /^z:(\d+):(.{1,80})$/.exec(v.delivery);
    if (!m) return { error: "Choisissez votre quartier.", fields };
    delivery = { mode: "zone", zone_id: Number(m[1]), area: m[2] };
  }
  const lat = Number(v.lat), lng = Number(v.lng);
  Object.assign(delivery, { address: v.address, landmark: v.landmark }, v.lat && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {});

  const { data, error } = await publicClient().rpc("place_order", {
    p_customer: { name: v.name, phone: v.phone },
    p_items: lines,
    p_delivery: delivery,
    p_payment: v.payment,
    p_note: v.note,
    p_channel: "site",
  });
  const order = Array.isArray(data) ? data[0] : null;
  if (error || !order) return { error: explain(error?.message ?? ""), fields };

  // la page de confirmation retrouve la commande avec son numéro et le téléphone (cookie privé au navigateur)
  (await cookies()).set(LAST_ORDER_COOKIE, JSON.stringify({ n: order.order_number, t: v.phone }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  redirect("/commande/merci");
}

export type TrackState = { error?: string; order?: TrackedOrder; phone?: string };
export type TrackedOrder = {
  number: string; status: string; payment_status: string; payment_method: string; delivery_mode: string; area: string;
  subtotal: number; delivery_fee: number; total: number; created_at: string;
  items: { name: string; unit: string; qty: number; unit_price: number; line_total: number }[];
};

export async function trackOrder(number: string, phone: string): Promise<TrackedOrder | null> {
  if (!/^[A-Za-z]?\d{1,10}$/.test(number.trim()) || phone.replace(/\D/g, "").length < 9) return null;
  const { data } = await publicClient().rpc("track_order", { p_number: number.trim(), p_phone: phone });
  return (data as TrackedOrder | null) ?? null;
}

export async function trackAction(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const number = String(fd.get("number") ?? "");
  const phone = String(fd.get("phone") ?? "");
  const order = await trackOrder(number, phone);
  return order ? { order, phone } : { error: "Aucune commande ne correspond à ce numéro et ce téléphone." };
}

export async function lastOrder() {
  try {
    const c = (await cookies()).get(LAST_ORDER_COOKIE)?.value;
    if (!c) return null;
    const { n, t } = JSON.parse(c) as { n: string; t: string };
    const order = await trackOrder(n, t);
    return order ? { order, phone: t } : null;
  } catch {
    return null;
  }
}
