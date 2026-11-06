"use client";

import { useState, useTransition } from "react";
import { fcfa, qty as fmtQty } from "@/lib/format";
import { removePackItem, setPackItem } from "./pack-actions";

type Item = { product_id: string; name: string; unit: string; qty: number; stock: number; price: number | null };
type Option = { id: string; name: string; unit: string };

/** Composition d'un pack : chaque composant, sa quantité, et combien de packs le stock permet de faire */
export default function PackEditor({ packId, items, options, packPrice }: { packId: string; items: Item[]; options: Option[]; packPrice: number | null }) {
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const chosen = options.find((o) => o.id === productId);
  const value = items.length && items.every((i) => i.price != null) ? Math.round(items.reduce((n, i) => n + (i.price as number) * i.qty, 0)) : null;
  const possible = items.length ? Math.min(...items.map((i) => Math.floor(Math.max(i.stock, 0) / i.qty))) : 0;
  const limiting = items.filter((i) => Math.floor(Math.max(i.stock, 0) / i.qty) === possible);

  const add = () => {
    const q = Number(qty.replace(",", "."));
    if (!productId || !Number.isFinite(q) || q <= 0) { setError("Choisissez un produit et une quantité."); return; }
    setError("");
    start(async () => {
      const res = await setPackItem(packId, productId, q);
      if (res.error) setError(res.error); else { setProductId(""); setQty(""); }
    });
  };

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold">Composition du pack</h2>
          <p className="text-sm text-mute">Vendre un pack retire ces quantités du stock de chaque produit.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mute">Packs réalisables</p>
          <p className={`font-display text-2xl font-extrabold tabular ${possible ? "" : "text-red"}`}>{possible}</p>
        </div>
      </div>
      {items.length > 0 && possible < 5 && (
        <p className="rounded-xl bg-sun-100 px-4 py-2.5 text-sm">
          Bloqué par : {limiting.map((i) => `${i.name} (reste ${fmtQty(i.stock, i.unit)})`).join(", ")}. Saisissez un arrivage pour relancer les ventes.
        </p>
      )}
      <ul className="divide-y divide-line rounded-xl border border-line">
        {items.map((i) => (
          <li key={i.product_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span><strong className="tabular">{fmtQty(i.qty, i.unit)}</strong> {i.name} <span className="text-mute">· stock {fmtQty(i.stock, i.unit)}</span></span>
            <button type="button" disabled={pending} onClick={() => start(async () => { const r = await removePackItem(packId, i.product_id); if (r.error) setError(r.error); })} className="text-mute underline-offset-4 hover:text-red hover:underline">
              Retirer
            </button>
          </li>
        ))}
        {!items.length && <li className="px-4 py-4 text-sm text-mute">Aucun produit dans ce pack pour l&apos;instant.</li>}
      </ul>
      {value != null && packPrice != null && (
        <p className="text-sm">Valeur au détail : <strong className="tabular">{fcfa(value)}</strong>{value > packPrice ? <> · le client économise <strong className="text-red tabular">{fcfa(value - packPrice)}</strong></> : null}</p>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="field" aria-label="Produit à ajouter">
          <option value="">Ajouter un produit…</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder={chosen?.unit === "kg" ? "kg (ex. 0,5)" : "Quantité"} className="field tabular" aria-label="Quantité" />
        <button type="button" onClick={add} disabled={pending} className="btn-ghost">{pending ? "…" : "Ajouter"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red">{error}</p>}
    </section>
  );
}
