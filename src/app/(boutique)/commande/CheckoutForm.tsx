"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useCart, lineTotal } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import type { Zone } from "@/lib/shop";
import { IconPin } from "@/components/icons";
import { placeOrder, type CheckoutState } from "./actions";

export default function CheckoutForm({ zones }: { zones: Zone[] }) {
  const { lines, subtotal, ready } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const f = state.fields ?? {};
  const [delivery, setDelivery] = useState(f.delivery ?? "");
  const [payment, setPayment] = useState(f.payment ?? "wave");
  const [geo, setGeo] = useState<{ lat: string; lng: string; status: "idle" | "wait" | "ok" | "error" }>({ lat: f.lat ?? "", lng: f.lng ?? "", status: f.lat ? "ok" : "idle" });

  const zone = delivery.startsWith("z:") ? zones.find((z) => z.id === Number(delivery.split(":")[1])) : undefined;
  const fee = zone?.price ?? 0;

  const locate = () => {
    if (!navigator.geolocation) return setGeo((g) => ({ ...g, status: "error" }));
    setGeo((g) => ({ ...g, status: "wait" }));
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6), status: "ok" }),
      () => setGeo((g) => ({ ...g, status: "error" })),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  if (!ready) return <p className="mt-6 text-mute">Chargement du panier…</p>;
  if (!lines.length) {
    return <p className="mt-6">Votre panier est vide. <Link href="/" className="font-semibold text-red underline">Faire mes courses</Link></p>;
  }

  return (
    <form action={action} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ product_id: l.id, qty: l.qty })))} />
      <input type="hidden" name="lat" value={geo.lat} />
      <input type="hidden" name="lng" value={geo.lng} />
      <div className="sr-only" aria-hidden><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="space-y-6">
        <fieldset className="card space-y-4 p-5">
          <legend className="float-left mb-1 font-display text-lg font-extrabold">Vos coordonnées</legend>
          <div className="clear-both grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Nom et prénom</label>
              <input id="name" name="name" required maxLength={120} defaultValue={f.name} autoComplete="name" className="field" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Téléphone</label>
              <input id="phone" name="phone" type="tel" required defaultValue={f.phone} autoComplete="tel" placeholder="77 123 45 67" className="field" />
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="float-left mb-1 font-display text-lg font-extrabold">Livraison</legend>
          <div className="clear-both">
            <label htmlFor="delivery" className="label">Votre quartier</label>
            <select id="delivery" name="delivery" required value={delivery} onChange={(e) => setDelivery(e.target.value)} className="field">
              <option value="" disabled>Choisir…</option>
              {zones.map((z) => (
                <optgroup key={z.id} label={`${z.name} : ${fcfa(z.price)}`}>
                  {z.areas.map((a) => <option key={a} value={`z:${z.id}:${a}`}>{a}</option>)}
                </optgroup>
              ))}
              <optgroup label="Autre quartier">
                <option value="yango">Mon quartier n&apos;est pas dans la liste (livraison Yango)</option>
              </optgroup>
            </select>
            {delivery === "yango" && (
              <div className="mt-3 space-y-3">
                <p className="rounded-xl bg-sun-100 px-4 py-3 text-sm">Nous vous envoyons un livreur Yango : la course est payée directement au livreur, selon la distance.</p>
                <div>
                  <label htmlFor="area_other" className="label">Quartier</label>
                  <input id="area_other" name="area_other" required maxLength={80} defaultValue={f.area_other} className="field" placeholder="Ex. Rufisque" />
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="address" className="label">Adresse</label>
            <input id="address" name="address" required maxLength={300} defaultValue={f.address} autoComplete="street-address" className="field" placeholder="Rue, numéro de villa ou d'immeuble" />
          </div>
          <div>
            <label htmlFor="landmark" className="label">Point de repère <span className="font-normal text-mute">(facultatif)</span></label>
            <input id="landmark" name="landmark" maxLength={200} defaultValue={f.landmark} className="field" placeholder="Ex. en face de la pharmacie" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={locate} className="btn-ghost">
              <IconPin className="size-4.5 text-red" /> {geo.status === "ok" ? "Position partagée" : "Partager ma position"}
            </button>
            <span className="text-sm text-mute" aria-live="polite">
              {geo.status === "wait" && "Recherche de votre position…"}
              {geo.status === "ok" && "Le livreur arrivera directement à votre porte."}
              {geo.status === "error" && "Position indisponible : l'adresse suffit."}
              {geo.status === "idle" && "Facultatif, mais très utile au livreur."}
            </span>
          </div>
        </fieldset>

        <fieldset className="card space-y-3 p-5">
          <legend className="float-left mb-1 font-display text-lg font-extrabold">Paiement avant livraison</legend>
          <div className="clear-both grid gap-3 sm:grid-cols-2">
            {[["wave", "Wave"], ["om", "Orange Money"]].map(([v, l]) => (
              <label key={v} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 ${payment === v ? "border-red bg-red-50" : "border-line bg-white"}`}>
                <input type="radio" name="payment" value={v} checked={payment === v} onChange={() => setPayment(v)} className="size-4.5 accent-[var(--color-red)]" />
                <span className="font-semibold">{l}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-mute">Après validation, nous vous indiquons le montant exact et le numéro à payer. Votre commande part dès réception du paiement.</p>
        </fieldset>

        <div className="card p-5">
          <label htmlFor="note" className="label">Un message pour nous ? <span className="font-normal text-mute">(facultatif)</span></label>
          <textarea id="note" name="note" rows={2} maxLength={500} defaultValue={f.note} className="field" placeholder="Ex. livrer après 18 h" />
        </div>
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-32">
        <h2 className="font-display text-lg font-extrabold">Récapitulatif</h2>
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3">
              <span className="min-w-0">{l.name} <span className="text-mute">× {l.unit === "kg" ? `${String(l.qty).replace(".", ",")} kg` : l.qty}</span></span>
              <span className="shrink-0 tabular">{fcfa(lineTotal(l))}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><span className="tabular">{fcfa(subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Livraison</span>
            <span className="tabular">{delivery === "yango" ? "Payée au livreur Yango" : zone ? fcfa(fee) : "Selon le quartier"}</span>
          </div>
          <div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span className="tabular">{fcfa(subtotal + fee)}</span></div>
        </div>
        <div aria-live="polite">{state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}</div>
        <button type="submit" disabled={pending} className="btn-primary min-h-12 w-full text-base">{pending ? "Envoi…" : "Valider ma commande"}</button>
        <p className="text-xs text-mute">Les prix sont confirmés à la validation. Les produits au kilo sont pesés à la préparation.</p>
      </aside>
    </form>
  );
}
