import { timingSafeEqual } from "node:crypto";
import { notifyNewOrder } from "@/lib/push";

/** Appelé par la base de données à chaque nouvelle commande (secret partagé) */
export async function POST(req: Request) {
  const secret = process.env.NOTIFY_SECRET ?? "";
  const given = req.headers.get("x-notify-secret") ?? "";
  const ok = secret.length > 0 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return Response.json({ error: "non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const orderId = String(body?.order_id ?? "");
  if (!/^[0-9a-f-]{36}$/.test(orderId)) return Response.json({ error: "commande invalide" }, { status: 400 });

  const result = await notifyNewOrder(orderId);
  return Response.json(result);
}
