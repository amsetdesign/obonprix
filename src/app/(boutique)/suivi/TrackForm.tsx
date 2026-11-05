"use client";

import { useActionState } from "react";
import OrderStatus from "@/components/shop/OrderStatus";
import PayInstructions from "@/components/shop/PayInstructions";
import { trackAction, type TrackState } from "../commande/actions";

export default function TrackForm({ waveNumber, omNumber, whatsapp }: { waveNumber: string; omNumber: string; whatsapp: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackAction, {});
  return (
    <div className="mt-6 space-y-6">
      <form action={action} className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="number" className="label">Numéro de commande</label>
          <input id="number" name="number" required maxLength={12} placeholder="C1001" className="field uppercase" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Téléphone</label>
          <input id="phone" name="phone" type="tel" required placeholder="77 123 45 67" className="field" />
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
