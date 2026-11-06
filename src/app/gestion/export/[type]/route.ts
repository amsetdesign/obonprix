import { getStaff } from "@/lib/staff";
import { serviceClient } from "@/lib/supabase/service";

/*
  Exports pour Excel (CSV « ; » avec BOM UTF-8 : s'ouvre directement dans Excel en français).
  - /gestion/export/ventes?du=AAAA-MM-JJ&au=AAAA-MM-JJ : une ligne par article vendu (caisse + en ligne payées)
  - /gestion/export/stock : état du stock, prix et valeur au prix d'achat
  Réservé au gérant (les prix d'achat y figurent).
*/

const DAY = 86_400_000;
const cell = (v: unknown) => {
  const s = v == null ? "" : typeof v === "number" ? String(v).replace(".", ",") : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
const dakar = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(iso));
const file = (body: string, name: string) =>
  new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" } });

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const staff = await getStaff();
  if (!staff || staff.role !== "gerant") return new Response("Accès réservé au gérant.", { status: 403 });
  const db = serviceClient();
  if (!db) return new Response("Export indisponible.", { status: 503 });
  const { type } = await params;
  const url = new URL(req.url);

  if (type === "stock") {
    const [{ data: products }, { data: costs }, { data: cats }, { data: sups }] = await Promise.all([
      db.from("products").select("id, name, unit, kind, price, promo_price, stock, stock_alert, category_id, supplier_id, is_active, is_online").order("name"),
      db.from("product_costs").select("product_id, cost_price"),
      db.from("categories").select("id, name"),
      db.from("suppliers").select("id, name"),
    ]);
    const cost = new Map((costs ?? []).map((c) => [c.product_id, c.cost_price]));
    const cat = new Map((cats ?? []).map((c) => [c.id, c.name]));
    const sup = new Map((sups ?? []).map((s) => [s.id, s.name]));
    const rows: unknown[][] = [["Produit", "Rayon", "Type", "Unité", "Stock", "Seuil d'alerte", "Prix de vente", "Prix promo", "Prix d'achat", "Valeur du stock (achat)", "Fournisseur", "Actif", "En ligne"]];
    for (const p of products ?? []) {
      const c = cost.get(p.id);
      rows.push([p.name, cat.get(p.category_id) ?? "", p.kind === "pack" ? "Pack" : "Produit", p.unit === "kg" ? "kg" : "pièce", Number(p.stock), Number(p.stock_alert),
        p.price, p.promo_price, c ?? "", c != null && p.kind === "simple" ? Math.round(Math.max(0, Number(p.stock)) * c) : "", sup.get(p.supplier_id) ?? "", p.is_active ? "oui" : "non", p.is_online ? "oui" : "non"]);
    }
    return file(csv(rows), `obonprix-stock-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (type === "ventes") {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const day = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null);
    const from = day(url.searchParams.get("du")) ?? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const to = new Date((day(url.searchParams.get("au")) ?? today).getTime() + DAY);
    if (to <= from || to.getTime() - from.getTime() > 400 * DAY) return new Response("Période invalide.", { status: 400 });

    const [{ data: sales }, { data: orders }] = await Promise.all([
      db.from("sales").select("number, payment_method, created_at, profiles(full_name), sale_items(name, unit, qty, unit_price, unit_cost, line_total)")
        .is("cancelled_at", null).gte("created_at", from.toISOString()).lt("created_at", to.toISOString()).order("created_at"),
      db.from("orders").select("number, channel, payment_method, customer_name, area, delivery_fee, created_at, order_items(name, unit, qty, unit_price, unit_cost, line_total)")
        .eq("payment_status", "paye").neq("status", "annulee").gte("created_at", from.toISOString()).lt("created_at", to.toISOString()).order("created_at"),
    ]);
    const PAY: Record<string, string> = { especes: "Espèces", wave: "Wave", om: "Orange Money" };
    const CH: Record<string, string> = { site: "Site", app: "Application", whatsapp: "WhatsApp" };
    type Item = { name: string; unit: string; qty: number; unit_price: number; unit_cost: number | null; line_total: number };
    const rows: unknown[][] = [["Date", "N°", "Canal", "Paiement", "Client / caissier", "Produit", "Quantité", "Unité", "Prix unitaire", "Total", "Coût d'achat", "Bénéfice"]];
    const push = (at: string, num: string, canal: string, pay: string, who: string, i: Item) => {
      const costTotal = i.unit_cost != null ? Math.round(i.unit_cost * Number(i.qty)) : null;
      rows.push([dakar(at), num, canal, PAY[pay] ?? pay, who, i.name, Number(i.qty), i.unit === "kg" ? "kg" : "pièce", i.unit_price, i.line_total, costTotal ?? "", costTotal != null ? i.line_total - costTotal : ""]);
    };
    for (const s of sales ?? []) for (const i of (s.sale_items ?? []) as Item[]) push(s.created_at, s.number, "Caisse", s.payment_method, (s.profiles as unknown as { full_name: string } | null)?.full_name ?? "", i);
    for (const o of orders ?? []) {
      for (const i of (o.order_items ?? []) as Item[]) push(o.created_at, o.number, CH[o.channel] ?? o.channel, o.payment_method, `${o.customer_name}${o.area ? ` (${o.area})` : ""}`, i);
      if (o.delivery_fee) rows.push([dakar(o.created_at), o.number, CH[o.channel] ?? o.channel, PAY[o.payment_method] ?? o.payment_method, o.customer_name, "Frais de livraison", 1, "", o.delivery_fee, o.delivery_fee, "", ""]);
    }
    const name = `obonprix-ventes-${from.toISOString().slice(0, 10)}-au-${new Date(to.getTime() - DAY).toISOString().slice(0, 10)}.csv`;
    return file(csv(rows), name);
  }

  return new Response("Export inconnu.", { status: 404 });
}
