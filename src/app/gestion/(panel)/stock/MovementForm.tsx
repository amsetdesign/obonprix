"use client";

import { useActionState, useMemo, useState } from "react";
import { recordMovement, type StockState } from "./actions";

type P = { id: string; name: string; unit: string; stock: number; rayon: string };

const KINDS = [
  { v: "achat", l: "Arrivage", hint: "Marchandise reçue" },
  { v: "perte", l: "Perte", hint: "Casse, périmé, volé" },
  { v: "ajustement_plus", l: "Correction +", hint: "Erreur de saisie" },
  { v: "ajustement_moins", l: "Correction −", hint: "Erreur de saisie" },
];

export default function MovementForm({ products, initialProduct = "" }: { products: P[]; initialProduct?: string }) {
  const [state, action, pending] = useActionState<StockState, FormData>(recordMovement, {});
  const [productId, setProductId] = useState(initialProduct);
  const [kind, setKind] = useState("achat");
  const [search, setSearch] = useState("");
  const current = products.find((p) => p.id === productId);
  const shown = useMemo(() => {
    const n = search.trim().toLowerCase();
    return n ? products.filter((p) => p.name.toLowerCase().includes(n)) : products;
  }, [products, search]);

  return (
    <form action={action} className="card space-y-5 p-5" key={state.ok ? state.message : "form"}>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <label htmlFor="search" className="label">Chercher</label>
          <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="field" placeholder="Ex. Kirène" />
        </div>
        <div>
          <label htmlFor="product_id" className="label">Produit</label>
          <select id="product_id" name="product_id" required value={productId} onChange={(e) => setProductId(e.target.value)} className="field">
            <option value="" disabled>Choisir un produit ({shown.length})</option>
            {shown.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      {current && (
        <p className="text-sm text-mute">Stock actuel : <strong className="text-ink tabular">{String(current.stock).replace(".", ",")}{current.unit === "kg" ? " kg" : ""}</strong> · {current.rayon}</p>
      )}

      <fieldset>
        <legend className="label">Type de mouvement</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KINDS.map((k) => (
            <label key={k.v} className={`cursor-pointer rounded-xl border px-3 py-2.5 ${kind === k.v ? "border-red bg-red-50" : "border-line bg-white"}`}>
              <input type="radio" name="kind" value={k.v} checked={kind === k.v} onChange={() => setKind(k.v)} className="sr-only" />
              <span className={`block text-sm font-semibold ${kind === k.v ? "text-red" : ""}`}>{k.l}</span>
              <span className="block text-xs text-mute">{k.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <div>
          <label htmlFor="qty" className="label">Quantité{current?.unit === "kg" ? " (kg)" : ""}</label>
          <input id="qty" name="qty" required inputMode="decimal" className="field tabular" placeholder={current?.unit === "kg" ? "Ex. 12,5" : "Ex. 24"} />
        </div>
        <div>
          <label htmlFor="note" className="label">Note {kind === "perte" ? "(obligatoire)" : <span className="font-normal text-mute">(fournisseur, n° de facture…)</span>}</label>
          <input id="note" name="note" maxLength={300} required={kind === "perte"} className="field" />
        </div>
      </div>

      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-xl bg-leaf-50 px-4 py-3 text-sm text-leaf">{state.message}</p>}
      </div>
      <button type="submit" disabled={pending} className="btn-primary px-8">{pending ? "Enregistrement…" : "Enregistrer le mouvement"}</button>
    </form>
  );
}
