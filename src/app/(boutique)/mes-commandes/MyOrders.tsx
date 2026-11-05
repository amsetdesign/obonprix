"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useCart } from "@/lib/cart";
import { forgetCustomer, loadOrders, type SavedOrder } from "@/lib/customer";
import { dateTime, fcfa, qty } from "@/lib/format";
import { IconArrow } from "@/components/icons";
import { currentProducts, orderStatuses } from "./actions";

const STATUS: Record<string, { label: string; tone: string }> = {
  nouvelle: { label: "En attente de paiement", tone: "bg-sun-100 text-[#7a5300]" },
  preparation: { label: "En préparation", tone: "bg-red-50 text-red" },
  expediee: { label: "En route", tone: "bg-[#e8f1fb] text-[#1d5fa0]" },
  livree: { label: "Livrée", tone: "bg-leaf-50 text-leaf" },
  annulee: { label: "Annulée", tone: "bg-cream text-mute" },
};

export default function MyOrders() {
  const { add } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [statuses, setStatuses] = useState<Awaited<ReturnType<typeof orderStatuses>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [, start] = useTransition();

  useEffect(() => {
    const list = loadOrders();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local après hydratation
    setOrders(list);
    if (list.length) orderStatuses(list.map(({ number, phone }) => ({ number, phone }))).then(setStatuses).catch(() => {});
  }, []);

  /** Remet les produits de la commande dans le panier, aux prix du jour, et ouvre le panier */
  const reorder = (o: SavedOrder) => {
    setBusy(o.number);
    start(async () => {
      const fresh = await currentProducts(o.lines.map((l) => l.id));
      const byId = new Map(fresh.map((p) => [p.id, p]));
      let missing = 0;
      for (const l of o.lines) {
        const p = byId.get(l.id);
        if (!p || !p.in_stock) { missing++; continue; }
        add({ id: p.id, slug: p.slug, name: p.name, unit: p.unit, price: p.price, image_url: p.image_url }, l.qty);
      }
      setBusy(null);
      if (missing === o.lines.length) { setNotice("Ces produits ne sont plus disponibles pour le moment."); return; }
      if (missing) sessionStorage.setItem("obp-avis-panier", `${missing} produit${missing > 1 ? "s" : ""} de cette commande ${missing > 1 ? "ne sont" : "n'est"} plus disponible${missing > 1 ? "s" : ""}.`);
      router.push("/panier");
    });
  };

  if (orders === null) return <p className="mt-6 text-mute">Chargement…</p>;
  if (!orders.length) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <p className="font-display text-xl font-extrabold">Pas encore de commande sur ce téléphone</p>
        <p className="mt-2 text-mute">Vos commandes apparaîtront ici automatiquement. Une commande passée ailleurs se suit avec son numéro.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">Faire mes courses</Link>
          <Link href="/suivi" className="btn-ghost">Suivre avec un numéro</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {notice && <p role="status" className="rounded-xl bg-sun-100 px-4 py-3 text-sm">{notice}</p>}
      <ul className="space-y-3">
        {orders.map((o) => {
          const st = statuses[o.number];
          const s = st ? STATUS[st.status] : undefined;
          return (
            <li key={o.number} className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-extrabold">Commande <span className="tabular">{o.number}</span></p>
                  <p className="text-sm text-mute">{dateTime(o.date)} · {o.lines.length} produit{o.lines.length > 1 ? "s" : ""}{st || o.total ? ` · ${fcfa(st?.total ?? o.total)}` : ""}</p>
                </div>
                {s ? <span className={`pill px-3 py-1 text-sm ${s.tone}`}>{s.label}</span>
                  : o.number in statuses ? <span className="pill bg-cream px-3 py-1 text-sm text-mute">Introuvable</span>
                  : <span className="pill bg-cream px-3 py-1 text-sm text-mute">Mise à jour…</span>}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink/75">
                {o.lines.map((l) => `${l.name} × ${qty(l.qty, l.unit)}`).join(" · ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => reorder(o)} disabled={busy === o.number} className="btn-primary min-h-10">
                  {busy === o.number ? "Ajout au panier…" : "Commander à nouveau"} <IconArrow className="size-4" />
                </button>
                <Link href={`/suivi?n=${encodeURIComponent(o.number)}`} className="btn-ghost min-h-10">{st?.status === "nouvelle" ? "Voir comment payer" : "Suivre"}</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => { forgetCustomer(); setOrders([]); }}
        className="text-sm text-mute underline underline-offset-4 hover:text-red"
      >
        Effacer mes informations de ce téléphone
      </button>
    </div>
  );
}
