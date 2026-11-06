"use client";

import { useMemo, useState, useTransition } from "react";
import { fcfa, qty as fmtQty } from "@/lib/format";
import { IconMinus, IconPlus, IconSearch, IconTrash } from "@/components/icons";
import { createWhatsappOrder } from "./actions";

type P = { id: string; name: string; unit: string; price: number; stock: number };
type Zone = { id: number; name: string; price: number; areas: string[] };
const plain = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function WhatsappOrderForm({ products, zones }: { products: P[]; zones: Zone[] }) {
  const [lines, setLines] = useState<(P & { qty: number })[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ name: "", phone: "", delivery: "", area_other: "", address: "", landmark: "", payment: "wave" as "wave" | "om", paid: false, ref: "", note: "" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  const found = useMemo(() => (q.trim().length < 2 ? [] : products.filter((p) => plain(p.name).includes(plain(q.trim()))).slice(0, 8)), [q, products]);
  const step = (u: string) => (u === "kg" ? 0.5 : 1);
  const add = (p: P) => { setLines((ls) => ls.some((l) => l.id === p.id) ? ls.map((l) => (l.id === p.id ? { ...l, qty: l.qty + step(p.unit) } : l)) : [...ls, { ...p, qty: step(p.unit) }]); setQ(""); };
  const setQty = (id: string, v: number) => setLines((ls) => ls.flatMap((l) => (l.id !== id ? [l] : v > 0 ? [{ ...l, qty: v }] : [])));
  const zone = f.delivery.startsWith("z:") ? zones.find((z) => z.id === Number(f.delivery.split(":")[1])) : undefined;
  const subtotal = lines.reduce((n, l) => n + Math.round(l.price * l.qty), 0);

  const submit = () => {
    setError("");
    start(async () => {
      const r = await createWhatsappOrder({ ...f, items: lines.map((l) => ({ product_id: l.id, qty: l.qty })) });
      if (r?.error) setError(r.error);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold">Client</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Nom</span><input value={f.name} onChange={(e) => set("name")(e.target.value)} className="field" /></label>
            <label className="block"><span className="label">Téléphone</span><input value={f.phone} onChange={(e) => set("phone")(e.target.value)} type="tel" className="field" placeholder="77 123 45 67" /></label>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold">Produits</h2>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un produit à ajouter" className="field pl-10" aria-label="Chercher un produit" />
            {found.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-white shadow-lg">
                {found.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => add(p)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-cream">
                      <span>{p.name} <span className="text-xs text-mute">· stock {fmtQty(p.stock, p.unit)}</span></span>
                      <span className="tabular">{fcfa(p.price)}{p.unit === "kg" ? "/kg" : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 font-medium">{l.name}</span>
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => setQty(l.id, l.qty - step(l.unit))} className="flex size-9 items-center justify-center rounded-lg bg-cream" aria-label="Moins"><IconMinus className="size-4" /></button>
                  <span className="w-16 text-center font-semibold tabular">{fmtQty(l.qty, l.unit)}</span>
                  <button type="button" onClick={() => setQty(l.id, l.qty + step(l.unit))} className="flex size-9 items-center justify-center rounded-lg bg-cream" aria-label="Plus"><IconPlus className="size-4" /></button>
                </span>
                <span className="w-24 text-right font-semibold tabular">{fcfa(Math.round(l.price * l.qty))}</span>
                <button type="button" onClick={() => setQty(l.id, 0)} className="text-mute hover:text-red" aria-label={`Retirer ${l.name}`}><IconTrash className="size-4" /></button>
              </li>
            ))}
            {!lines.length && <li className="px-4 py-6 text-center text-sm text-mute">Aucun produit pour l&apos;instant.</li>}
          </ul>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold">Livraison</h2>
          <label className="block"><span className="label">Quartier</span>
            <select value={f.delivery} onChange={(e) => set("delivery")(e.target.value)} className="field">
              <option value="" disabled>Choisir…</option>
              {zones.map((z) => (
                <optgroup key={z.id} label={`${z.name} : ${fcfa(z.price)}`}>
                  {z.areas.map((a) => <option key={a} value={`z:${z.id}:${a}`}>{a}</option>)}
                </optgroup>
              ))}
              <option value="yango">Autre quartier (Yango)</option>
            </select>
          </label>
          {f.delivery === "yango" && <label className="block"><span className="label">Quartier (Yango)</span><input value={f.area_other} onChange={(e) => set("area_other")(e.target.value)} className="field" /></label>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Adresse</span><input value={f.address} onChange={(e) => set("address")(e.target.value)} className="field" /></label>
            <label className="block"><span className="label">Repère</span><input value={f.landmark} onChange={(e) => set("landmark")(e.target.value)} className="field" /></label>
          </div>
          <label className="block"><span className="label">Note</span><input value={f.note} onChange={(e) => set("note")(e.target.value)} className="field" placeholder="Ex. livrer après 18 h" /></label>
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-lg font-extrabold">Paiement</h2>
        <div className="grid grid-cols-2 gap-2">
          {([["wave", "Wave"], ["om", "Orange Money"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => set("payment")(v)} className={`min-h-11 rounded-xl border text-sm font-semibold ${f.payment === v ? "border-red bg-red-50 text-red" : "border-line"}`}>{l}</button>
          ))}
        </div>
        <label className="flex items-center gap-2.5 text-sm font-medium"><input type="checkbox" checked={f.paid} onChange={(e) => set("paid")(e.target.checked)} className="size-5 accent-[var(--color-red)]" /> Le client a déjà payé</label>
        {f.paid && <label className="block"><span className="label">Référence de la transaction</span><input value={f.ref} onChange={(e) => set("ref")(e.target.value)} className="field" /></label>}
        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><span className="tabular">{fcfa(subtotal)}</span></div>
          <div className="flex justify-between"><span>Livraison</span><span className="tabular">{f.delivery === "yango" ? "Yango" : zone ? fcfa(zone.price) : "—"}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular">{fcfa(subtotal + (zone?.price ?? 0))}</span></div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={submit} disabled={pending} className="btn-primary min-h-12 w-full">{pending ? "Enregistrement…" : "Enregistrer la commande"}</button>
      </aside>
    </div>
  );
}
