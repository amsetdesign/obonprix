"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../auth-actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}
