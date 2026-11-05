"use client";

import { useActionState } from "react";
import { ROLE_HINT, ROLE_LABEL, type StaffRole } from "@/lib/roles";
import { addMember, type TeamState } from "./actions";

export default function AddMemberForm() {
  const [state, action, pending] = useActionState<TeamState, FormData>(addMember, {});
  return (
    <form action={action} className="card space-y-4 p-5" key={state.ok ? state.message : "form"}>
      <h2 className="font-display text-lg font-extrabold">Ajouter un membre</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="label">Nom complet</label>
          <input id="full_name" name="full_name" required maxLength={120} className="field" />
        </div>
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input id="email" name="email" type="email" required className="field" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="role" className="label">Rôle</label>
          <select id="role" name="role" required defaultValue="vendeur" className="field">
            {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]} : {ROLE_HINT[r]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="password" className="label">Mot de passe provisoire</label>
          <input id="password" name="password" type="text" required minLength={8} maxLength={72} className="field" autoComplete="new-password" placeholder="8 caractères minimum" />
        </div>
      </div>
      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-xl bg-leaf-50 px-4 py-3 text-sm text-leaf">{state.message}</p>}
      </div>
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Création…" : "Créer le compte"}</button>
    </form>
  );
}
