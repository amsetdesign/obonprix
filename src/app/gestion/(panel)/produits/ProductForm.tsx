"use client";

import { useActionState, useState } from "react";
import type { ProductState } from "./actions";

export type ProductValues = {
  name: string;
  category_id: number | null;
  unit: string;
  price: number | null;
  promo_price: number | null;
  stock_alert: number;
  barcode: string | null;
  description: string;
  is_active: boolean;
  is_online: boolean;
  featured?: boolean;
  cost_price?: number | null;
  image_url: string;
  kind?: string;
  supplier_id?: number | null;
  sale_ends_at?: string | null;
};

type Props = {
  action: (prev: ProductState, fd: FormData) => Promise<ProductState>;
  categories: { id: number; name: string }[];
  suppliers?: { id: number; name: string }[];
  initial?: ProductValues;
  isNew?: boolean;
};

const EMPTY: ProductValues = {
  name: "", category_id: null, unit: "piece", price: null, promo_price: null, stock_alert: 5,
  barcode: "", description: "", is_active: true, is_online: true, image_url: "",
};

/** Fin exclusive (minuit du lendemain) -> dernier jour de l'offre pour le champ date */
const lastDay = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - 1).toISOString().slice(0, 10) : "");

export default function ProductForm({ action, categories, suppliers = [], initial = EMPTY, isNew }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [kind, setKind] = useState(initial.kind ?? "simple");
  const isPack = kind === "pack";
  const [unit, setUnit] = useState(initial.unit);
  const [price, setPrice] = useState(initial.price != null ? String(initial.price) : "");
  const [promo, setPromo] = useState(initial.promo_price != null ? String(initial.promo_price) : "");
  const [cost, setCost] = useState(initial.cost_price != null ? String(initial.cost_price) : "");
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\s/g, "").replace(",", ".")));
  const sell = num(promo) ?? num(price);
  const buy = num(cost);
  const margin = sell != null && buy != null && Number.isFinite(sell) && Number.isFinite(buy) ? sell - buy : null;
  const [preview, setPreview] = useState<string | null>(null);
  const per = unit === "kg" ? " le kg" : "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="card space-y-5 p-5">
          {isNew && (
            <fieldset>
              <legend className="label">Type</legend>
              <div className="grid grid-cols-2 gap-2 sm:w-2/3">
                {[["simple", "Produit", "Un article du rayon"], ["pack", "Pack", "Plusieurs produits vendus ensemble"]].map(([v, l, h]) => (
                  <label key={v} className={`cursor-pointer rounded-xl border px-3 py-2.5 ${kind === v ? "border-red bg-red-50" : "border-line bg-white"}`}>
                    <input type="radio" name="kind" value={v} checked={kind === v} onChange={() => { setKind(v); if (v === "pack") setUnit("piece"); }} className="sr-only" />
                    <span className={`block text-sm font-semibold ${kind === v ? "text-red" : ""}`}>{l}</span>
                    <span className="block text-xs text-mute">{h}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div>
            <label htmlFor="name" className="label">Nom {isPack ? "du pack" : "du produit"}</label>
            <input id="name" name="name" required maxLength={120} defaultValue={initial.name} className="field" placeholder="Ex. Huile Zita 1 L" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category_id" className="label">Rayon</label>
              <select id="category_id" name="category_id" required defaultValue={initial.category_id ?? ""} className="field">
                <option value="" disabled>Choisir…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {isPack ? <input type="hidden" name="unit" value="piece" /> : <fieldset>
              <legend className="label">Vendu</legend>
              <div className="grid grid-cols-2 gap-2">
                {[["piece", "À la pièce"], ["kg", "Au kilo"]].map(([v, l]) => (
                  <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium ${unit === v ? "border-red bg-red-50 text-red" : "border-line bg-white"}`}>
                    <input type="radio" name="unit" value={v} checked={unit === v} onChange={() => setUnit(v)} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="price" className="label">Prix{per} (F)</label>
              <input id="price" name="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="field tabular" placeholder="1500" />
            </div>
            <div>
              <label htmlFor="promo_price" className="label">Prix promo{per} (F)</label>
              <input id="promo_price" name="promo_price" inputMode="numeric" value={promo} onChange={(e) => setPromo(e.target.value)} className="field tabular" placeholder="Facultatif" />
            </div>
            {isPack ? <input type="hidden" name="stock_alert" value="0" /> : (
              <div>
                <label htmlFor="stock_alert" className="label">Alerte sous{unit === "kg" ? " (kg)" : ""}</label>
                <input id="stock_alert" name="stock_alert" inputMode="decimal" defaultValue={initial.stock_alert ?? 5} className="field tabular" placeholder="5" />
              </div>
            )}
          </div>
          {isPack ? (
            <p className="rounded-xl bg-cream p-4 text-sm text-mute">Le prix d&apos;achat d&apos;un pack est la somme de ses composants : le bénéfice est calculé automatiquement à chaque vente. La composition se règle sous ce formulaire, une fois le pack créé.</p>
          ) : <div className="grid gap-5 rounded-xl bg-cream p-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cost_price" className="label">Prix d&apos;achat{per} (F)</label>
              <input id="cost_price" name="cost_price" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} className="field tabular" placeholder="Ex. 1600" />
            </div>
            <div className="sm:col-span-2">
              <p className="label">Bénéfice par {unit === "kg" ? "kilo" : "unité"}</p>
              {margin != null ? (
                <p className={`font-display text-2xl font-extrabold tabular ${margin < 0 ? "text-red" : "text-leaf"}`}>
                  {margin.toLocaleString("fr-FR")} F
                  {sell ? <span className="ml-2 text-sm font-semibold text-mute">soit {Math.round((margin / sell) * 100)} % du prix de vente</span> : null}
                </p>
              ) : (
                <p className="text-sm text-mute">Saisissez le prix de vente et le prix d&apos;achat. Visible uniquement par le gérant et la gestion du stock.</p>
              )}
            </div>
          </div>}
          <div className="grid gap-5 sm:grid-cols-2">
            {!isPack && (
              <div>
                <label htmlFor="supplier_id" className="label">Fournisseur</label>
                <select id="supplier_id" name="supplier_id" defaultValue={initial.supplier_id ?? ""} className="field">
                  <option value="">Non renseigné</option>
                  {suppliers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="sale_ends_on" className="label">Fin de l&apos;offre <span className="font-normal text-mute">(facultatif)</span></label>
              <input id="sale_ends_on" name="sale_ends_on" type="date" defaultValue={lastDay(initial.sale_ends_at)} className="field" />
              <p className="mt-1 text-xs text-mute">Dernier jour de vente : le produit disparaît de la boutique le lendemain.</p>
            </div>
          </div>
          {isNew && !isPack && (
            <div className="sm:w-1/3">
              <label htmlFor="initial_stock" className="label">Stock de départ{unit === "kg" ? " (kg)" : ""}</label>
              <input id="initial_stock" name="initial_stock" inputMode="decimal" className="field tabular" placeholder="0" />
            </div>
          )}
          <div>
            <label htmlFor="barcode" className="label">Code-barres <span className="font-normal text-mute">(facultatif)</span></label>
            <input id="barcode" name="barcode" maxLength={32} defaultValue={initial.barcode ?? ""} className="field tabular" />
          </div>
          <div>
            <label htmlFor="description" className="label">Description <span className="font-normal text-mute">(affichée sur le site)</span></label>
            <textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={initial.description} className="field" />
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" name="is_active" defaultChecked={initial.is_active} className="size-5 accent-[var(--color-red)]" />
              Produit actif
            </label>
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" name="is_online" defaultChecked={initial.is_online} className="size-5 accent-[var(--color-red)]" />
              Vendu en ligne (site et application)
            </label>
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" name="featured" defaultChecked={initial.featured ?? false} className="size-5 accent-[var(--color-red)]" />
              Mis en avant à l&apos;accueil
            </label>
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <p className="label mb-0">Photo</p>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-cream">
            {preview || initial.image_url ? (
              // aperçu local ou photo déjà en ligne
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview ?? initial.image_url} alt="" className="size-full object-contain" />
            ) : (
              <span className="px-4 text-center text-sm text-mute">Pas encore de photo</span>
            )}
          </div>
          <input
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <p className="text-xs text-mute">JPG, PNG ou WEBP, 3 Mo maximum. Fond clair conseillé.</p>
          {initial.image_url && !isNew && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="remove_photo" className="size-4" /> Retirer la photo</label>
          )}
        </div>
      </div>

      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-xl bg-leaf-50 px-4 py-3 text-sm text-leaf">{state.message}</p>}
      </div>
      <button type="submit" disabled={pending} className="btn-primary px-8">{pending ? "Enregistrement…" : isNew ? "Créer le produit" : "Enregistrer"}</button>
    </form>
  );
}
