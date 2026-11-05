"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loadCustomer } from "@/lib/customer";
import OrderStatus from "@/components/shop/OrderStatus";
import PayInstructions from "@/components/shop/PayInstructions";
import { trackAction, type TrackState } from "../commande/actions";

export default function TrackForm({ waveNumber, omNumber, whatsapp }: { waveNumber: string; omNumber: string; whatsapp: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackAction, {});
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [auto, setAuto] = useState(false);
  // depuis « Mes commandes » : numéro dans l'adresse, téléphone gardé sur ce téléphone
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("n") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pré-remplissage unique après hydratation
    setNumber(n.slice(0, 12));
    const p = loadCustomer()?.phone ?? "";
    setPhone(p);
    // tout est connu : on affiche directement le suivi, une fois les champs remplis
    setAuto(Boolean(n && p));
  }, []);
  useEffect(() => {
    if (!auto || !number || !phone) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- envoi automatique unique
    setAuto(false);
    formRef.current?.requestSubmit();
  }, [auto, number, phone]);
  return (
    <div className="mt-6 space-y-6">
      <form ref={formRef} action={action} className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="number" className="label">Numéro de commande</label>
          <input id="number" name="number" required maxLength={12} placeholder="C1001" value={number} onChange={(e) => setNumber(e.target.value)} className="field uppercase" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Téléphone</label>
          <input id="phone" name="phone" type="tel" required placeholder="77 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
        </div>
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Recherche…" : "Voir"}</button>
      </form>
      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      </div>
      {state.order && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-extrabold">Commande {state.order.number}</h2>
          <PayInstructions o={state.order} payNumber={state.order.payment_method === "om" ? omNumber : waveNumber} whatsapp={whatsapp} />
          <OrderStatus o={state.order} />
        </div>
      )}
    </div>
  );
}
