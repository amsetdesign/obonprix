import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { dateTime, fcfa } from "@/lib/format";
import { PAY_LABEL, STATUS_LABEL, STATUS_TONE } from "./labels";

export const metadata: Metadata = { title: "Commandes" };

const TABS = [
  { key: "", label: "À traiter", statuses: ["nouvelle", "preparation", "expediee"] },
  { key: "nouvelle", label: "À payer", statuses: ["nouvelle"] },
  { key: "preparation", label: "À préparer", statuses: ["preparation"] },
  { key: "expediee", label: "En route", statuses: ["expediee"] },
  { key: "terminees", label: "Terminées", statuses: ["livree", "annulee"] },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { supabase, role } = await requireStaff(["gerant", "vendeur", "livreur"]);
  const { vue = "" } = await searchParams;
  const tab = TABS.find((t) => t.key === vue) ?? TABS[0];
  // le livreur ne reçoit que ses commandes (règle de la base)
  const { data: orders } = await supabase
    .from("orders")
    .select("id, number, customer_name, customer_phone, area, delivery_mode, total, payment_method, payment_status, status, created_at, channel")
    .in("status", tab.statuses)
    .order("created_at", { ascending: tab.key !== "terminees" })
    .limit(150);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{role === "livreur" ? "Mes livraisons" : "Commandes en ligne"}</h1>
        <p className="mt-1 text-sm text-mute">Une commande part uniquement quand son paiement Wave ou Orange Money est confirmé. Les commandes non payées sont annulées automatiquement (délai réglable dans Réglages).</p>
        {role !== "livreur" && <Link href="/gestion/commandes/nouvelle" className="btn-primary mt-4">Saisir une commande WhatsApp</Link>}
      </header>
      <nav aria-label="Vues" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key ? `/gestion/commandes?vue=${t.key}` : "/gestion/commandes"} aria-current={t === tab ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${t === tab ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink/30"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <ul className="space-y-2">
        {(orders ?? []).map((o) => (
          <li key={o.id}>
            <Link href={`/gestion/commandes/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:border-ink/25">
              <div className="min-w-0">
                <p className="font-semibold"><span className="tabular">{o.number}</span> · {o.customer_name} <span className={`pill ml-1 align-middle ${o.channel === "app" ? "bg-ink text-white" : "bg-cream text-ink ring-1 ring-line"}`}>{o.channel === "app" ? "Application" : o.channel === "whatsapp" ? "WhatsApp" : "Site"}</span></p>
                <p className="text-sm text-mute">{dateTime(o.created_at)} · {o.area || "—"}{o.delivery_mode === "yango" ? " (Yango)" : ""} · {PAY_LABEL[o.payment_method]}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-extrabold tabular">{fcfa(o.total)}</span>
                <span className={`pill ${STATUS_TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              </div>
            </Link>
          </li>
        ))}
        {!orders?.length && <li className="card p-8 text-center text-mute">Aucune commande dans cette vue.</li>}
      </ul>
    </div>
  );
}
