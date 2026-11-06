"use client";

import { useActionState } from "react";
import { addSupplier, type SupplierState } from "./actions";

export default function SupplierForm() {
  const [state, action, pending] = useActionState<SupplierState, FormData>(addSupplier, {});
  return (
    <form action={action} key={state.at ?? "form"} className="grid gap-3 sm:grid-cols-[1fr_180px_1fr_auto] sm:items-end">
      <label className="block"><span className="label">Nom</span><input name="name" required maxLength={120} className="field" placeholder="Ex. Grossiste Colobane" /></label>
      <label className="block"><span className="label">Téléphone WhatsApp</span><input name="phone" type="tel" className="field" placeholder="77 000 00 00" /></label>
      <label className="block"><span className="label">Note <span className="font-normal text-mute">(facultatif)</span></span><input name="note" maxLength={300} className="field" placeholder="Produits, jours de livraison…" /></label>
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "…" : "Ajouter"}</button>
      {state.error && <p role="alert" className="text-sm text-red sm:col-span-4">{state.error}</p>}
    </form>
  );
}
