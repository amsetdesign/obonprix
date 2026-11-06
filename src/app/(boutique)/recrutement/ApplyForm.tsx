"use client";

import { useActionState } from "react";
import { applyJob, type ApplyState } from "./actions";

export default function ApplyForm({ offers }: { offers: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyJob, {});
  if (state.ok) {
    return <p className="card bg-leaf-50 p-6 text-leaf">Merci, votre candidature est bien reçue. Nous vous contacterons par téléphone si votre profil correspond.</p>;
  }
  return (
    <form action={action} className="card space-y-4 p-5" encType="multipart/form-data">
      <div className="sr-only" aria-hidden><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div>
        <label htmlFor="offer_id" className="label">Poste</label>
        <select id="offer_id" name="offer_id" defaultValue={offers[0]?.id ?? ""} className="field">
          {offers.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          <option value="">Candidature spontanée</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="full_name" className="label">Nom et prénom</label><input id="full_name" name="full_name" required maxLength={120} autoComplete="name" className="field" /></div>
        <div><label htmlFor="phone" className="label">Téléphone</label><input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="77 123 45 67" className="field" /></div>
      </div>
      <div><label htmlFor="email" className="label">E-mail <span className="font-normal text-mute">(facultatif)</span></label><input id="email" name="email" type="email" autoComplete="email" className="field" /></div>
      <div><label htmlFor="message" className="label">Présentez-vous en quelques lignes</label><textarea id="message" name="message" rows={4} maxLength={3000} className="field" placeholder="Expériences, disponibilités, quartier…" /></div>
      <div>
        <label htmlFor="cv" className="label">CV <span className="font-normal text-mute">(facultatif : PDF, JPG ou PNG, 3 Mo maximum)</span></label>
        <input id="cv" name="cv" type="file" accept="application/pdf,image/jpeg,image/png" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      </div>
      <p className="text-xs text-mute">Vos informations servent uniquement à étudier votre candidature et ne sont jamais partagées.</p>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Envoi…" : "Envoyer ma candidature"}</button>
    </form>
  );
}
