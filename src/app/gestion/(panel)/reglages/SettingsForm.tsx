"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "./actions";

const DAYS: [string, string][] = [["lun", "Lundi"], ["mar", "Mardi"], ["mer", "Mercredi"], ["jeu", "Jeudi"], ["ven", "Vendredi"], ["sam", "Samedi"], ["dim", "Dimanche"]];

type Settings = {
  accepting_orders: boolean; phone: string; wave_number: string; om_number: string; base_address: string;
  hours: Record<string, [string, string] | null>;
  unpaid_cancel_hours?: number; legal_name?: string; ninea?: string; rccm?: string; email?: string;
};

export default function SettingsForm({ s }: { s: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  return (
    <form action={action} className="card space-y-6 p-5">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="accepting_orders" defaultChecked={s.accepting_orders} className="mt-0.5 size-5 accent-[var(--color-red)]" />
        <span><span className="block font-semibold">Commandes en ligne ouvertes</span><span className="text-sm text-mute">Décochez pour suspendre les commandes (rupture générale, jour férié…).</span></span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label htmlFor="phone" className="label">Téléphone et WhatsApp</label><input id="phone" name="phone" defaultValue={s.phone} className="field" /></div>
        <div><label htmlFor="wave_number" className="label">Numéro Wave</label><input id="wave_number" name="wave_number" defaultValue={s.wave_number} className="field" /></div>
        <div><label htmlFor="om_number" className="label">Numéro Orange Money</label><input id="om_number" name="om_number" defaultValue={s.om_number} className="field" /></div>
      </div>
      <div><label htmlFor="base_address" className="label">Point de départ des livraisons</label><input id="base_address" name="base_address" defaultValue={s.base_address} className="field" /></div>
      <div>
        <label htmlFor="unpaid_cancel_hours" className="label">Annuler les commandes non payées après</label>
        <div className="flex items-center gap-2">
          <input id="unpaid_cancel_hours" name="unpaid_cancel_hours" type="number" min={0} max={72} defaultValue={s.unpaid_cancel_hours ?? 3} className="field w-24 tabular" />
          <span className="text-sm text-mute">heures (0 = jamais). Le stock réservé est rendu automatiquement.</span>
        </div>
      </div>
      <fieldset className="space-y-3 rounded-xl border border-line p-4">
        <legend className="label px-1">Informations légales (affichées dans les mentions légales du site)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="legal_name" className="label">Raison sociale</label><input id="legal_name" name="legal_name" defaultValue={s.legal_name ?? ""} className="field" /></div>
          <div><label htmlFor="email" className="label">E-mail de contact</label><input id="email" name="email" type="email" defaultValue={s.email ?? ""} className="field" /></div>
          <div><label htmlFor="ninea" className="label">NINEA</label><input id="ninea" name="ninea" defaultValue={s.ninea ?? ""} className="field" /></div>
          <div><label htmlFor="rccm" className="label">RCCM</label><input id="rccm" name="rccm" defaultValue={s.rccm ?? ""} className="field" /></div>
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Horaires</legend>
        <div className="divide-y divide-line rounded-xl border border-line">
          {DAYS.map(([k, label]) => {
            const h = s.hours?.[k];
            return (
              <div key={k} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="w-24 text-sm font-medium">{label}</span>
                <input type="time" name={`${k}_open`} defaultValue={h?.[0] ?? "08:00"} className="field w-auto py-1.5" aria-label={`${label} ouverture`} />
                <span className="text-mute">à</span>
                <input type="time" name={`${k}_close`} defaultValue={h?.[1] ?? "23:00"} className="field w-auto py-1.5" aria-label={`${label} fermeture`} />
                <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" name={`${k}_closed`} defaultChecked={!h} className="size-4" /> Fermé</label>
              </div>
            );
          })}
        </div>
      </fieldset>
      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-xl bg-leaf-50 px-4 py-3 text-sm text-leaf">Réglages enregistrés.</p>}
      </div>
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
