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
  image_url: string;
};

type Props = {
  action: (prev: ProductState, fd: FormData) => Promise<ProductState>;
  categories: { id: number; name: string }[];
  initial?: ProductValues;
  isNew?: boolean;
};

const EMPTY: ProductValues = {
  name: "", category_id: null, unit: "piece", price: null, promo_price: null, stock_alert: 0,
  barcode: "", description: "", is_active: true, is_online: true, image_url: "",
};

export default function ProductForm({ action, categories, initial = EMPTY, isNew }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [unit, setUnit] = useState(initial.unit);
  const [preview, setPreview] = useState<string | null>(null);
  const per = unit === "kg" ? " le kg" : "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="card space-y-5 p-5">
          <div>
            <label htmlFor="name" className="label">Nom du produit</label>
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
            <fieldset>
              <legend className="label">Vendu</legend>
              <div className="grid grid-cols-2 gap-2">
                {[["piece", "À la pièce"], ["kg", "Au kilo"]].map(([v, l]) => (
                  <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium ${unit === v ? "border-red bg-red-50 text-red" : "border-line bg-white"}`}>
                    <input type="radio" name="unit" value={v} checked={unit === v} onChange={() => setUnit(v)} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="price" className="label">Prix{per} (F)</label>
              <input id="price" name="price" inputMode="numeric" defaultValue={initial.price ?? ""} className="field tabular" placeholder="1500" />
            </div>
            <div>
              <label htmlFor="promo_price" className="label">Prix promo{per} (F)</label>
              <input id="promo_price" name="promo_price" inputMode="numeric" defaultValue={initial.promo_price ?? ""} className="field tabular" placeholder="Facultatif" />
            </div>
            <div>
              <label htmlFor="stock_alert" className="label">Alerte stock bas</label>
              <input id="stock_alert" name="stock_alert" inputMode="decimal" defaultValue={initial.stock_alert || ""} className="field tabular" placeholder="Ex. 5" />
            </div>
          </div>
          {isNew && (
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
