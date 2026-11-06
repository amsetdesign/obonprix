"use client";

import { useActionState } from "react";
import { saveOffer, type OfferState } from "./actions";

export default function OfferForm() {
  const [state, action, pending] = useActionState<OfferState, FormData>(saveOffer, {});
  return (
    <form action={action} key={state.at ?? "form"} className="card space-y-4 p-5">
      <h3 className="font-display text-lg font-extrabold">Publier une offre</h3>
      <div className="grid gap-4 sm:grid-cols-[1fr_170px_170px]">
        <label className="block"><span className="label">Poste</span><input name="title" required maxLength={120} className="field" placeholder="Ex. Livreur à moto" /></label>
        <label className="block"><span className="label">Contrat</span>
          <select name="contract" defaultValue="CDD" className="field">{["CDI", "CDD", "Stage", "Temps partiel", "Prestation"].map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="block"><span className="label">Lieu</span><input name="location" defaultValue="Dakar" maxLength={80} className="field" /></label>
      </div>
      <label className="block"><span className="label">Missions</span><textarea name="description" rows={4} maxLength={4000} className="field" /></label>
      <label className="block"><span className="label">Profil recherché</span><textarea name="requirements" rows={3} maxLength={3000} className="field" /></label>
      <label className="block sm:w-1/3"><span className="label">Date limite <span className="font-normal text-mute">(facultatif)</span></span><input name="closes_on" type="date" className="field" /></label>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded-xl bg-leaf-50 px-4 py-3 text-sm text-leaf">Offre publiée sur le site.</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Publication…" : "Publier l'offre"}</button>
    </form>
  );
}
