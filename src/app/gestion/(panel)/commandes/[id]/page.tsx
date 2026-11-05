import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import { dateTime, fcfa, qty } from "@/lib/format";
import { PAY_LABEL, STATUS_LABEL, STATUS_TONE } from "../labels";
import OrderActions from "./OrderActions";

export const metadata: Metadata = { title: "Commande" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, role } = await requireStaff(["gerant", "vendeur", "livreur"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [{ data: o }, { data: items }, { data: zones }, { data: livreurs }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("id, name, unit, unit_price, qty, line_total").eq("order_id", id).order("id"),
    supabase.from("delivery_zones").select("id, name"),
    supabase.from("profiles").select("id, full_name").eq("role", "livreur").eq("active", true),
  ]);
  if (!o) notFound();
  const phoneDigits = o.customer_phone.replace(/\D/g, "");
  const wa = phoneDigits.length === 9 ? `221${phoneDigits}` : phoneDigits;
  const zone = zones?.find((z) => z.id === o.zone_id);

  return (
    <div className="space-y-6">
      <Link href="/gestion/commandes" className="text-sm text-mute hover:text-red">← Commandes</Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Commande <span className="tabular">{o.number}</span></h1>
          <p className="text-sm text-mute">{dateTime(o.created_at)} · {o.channel === "app" ? "Application" : o.channel === "whatsapp" ? "WhatsApp" : "Site"}</p>
        </div>
        <span className={`pill px-3 py-1 text-sm ${STATUS_TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="font-display text-lg font-extrabold">Articles à préparer</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {(items ?? []).map((it) => (
                <li key={it.id} className="flex justify-between gap-3 py-2.5">
                  <span><strong className="tabular">{qty(it.qty, it.unit)}</strong> {it.unit === "kg" ? "" : "×"} {it.name}</span>
                  <span className="shrink-0 tabular">{fcfa(it.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><span className="tabular">{fcfa(o.subtotal)}</span></div>
              <div className="flex justify-between"><span>Livraison</span><span className="tabular">{o.delivery_mode === "yango" ? "Yango (payée au livreur)" : fcfa(o.delivery_fee)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total à encaisser</span><span className="tabular">{fcfa(o.total)}</span></div>
            </div>
          </section>

          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-mute">Client</h2>
              <p className="mt-1 font-semibold">{o.customer_name}</p>
              <p className="tabular">{o.customer_phone}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={`tel:${o.customer_phone.replace(/\s/g, "")}`} className="btn-ghost min-h-9 px-3">Appeler</a>
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${o.customer_name}, ici Ô Bon Prix au sujet de votre commande ${o.number}.`)}`} className="btn-ghost min-h-9 px-3">WhatsApp</a>
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-mute">Livraison</h2>
              <p className="mt-1 font-semibold">{o.area}{o.delivery_mode === "yango" ? " · Yango" : zone ? ` · ${zone.name}` : ""}</p>
              <p>{o.address}</p>
              {o.landmark && <p className="text-mute">Repère : {o.landmark}</p>}
              {o.lat != null && o.lng != null && (
                <a href={`https://www.google.com/maps?q=${o.lat},${o.lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-red underline-offset-4 hover:underline">Ouvrir la position GPS</a>
              )}
            </div>
            {(o.note || o.staff_note) && (
              <div className="sm:col-span-2">
                {o.note && <p className="rounded-xl bg-sun-100 px-4 py-2.5 text-sm"><strong>Message du client :</strong> {o.note}</p>}
                {o.staff_note && <p className="mt-2 text-sm text-mute">Note de l&apos;équipe : {o.staff_note}</p>}
              </div>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-mute">Paiement</h2>
            <p className="mt-1 font-semibold">{PAY_LABEL[o.payment_method]} · {o.payment_status === "paye" ? <span className="text-leaf">reçu</span> : o.payment_status === "rembourse" ? "remboursé" : <span className="text-[#a06d00]">en attente</span>}</p>
            {o.payment_ref && <p className="text-sm text-mute">Réf. {o.payment_ref}</p>}
          </div>
          <OrderActions
            orderId={o.id}
            status={o.status}
            paid={o.payment_status === "paye"}
            role={role}
            total={fcfa(o.total)}
            assignedTo={o.assigned_to}
            livreurs={livreurs ?? []}
          />
        </aside>
      </div>
    </div>
  );
}
