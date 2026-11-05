"use client";

import { useActionState, useState } from "react";
import type { StaffRole } from "@/lib/roles";
import { orderAction, type OrderActionState } from "../actions";

type Props = {
  orderId: string; status: string; paid: boolean; role: StaffRole; total: string;
  assignedTo: string | null; livreurs: { id: string; full_name: string }[];
};

export default function OrderActions({ orderId, status, paid, role, total, assignedTo, livreurs }: Props) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(orderAction.bind(null, orderId), {});
  const [cancelling, setCancelling] = useState(false);
  const closed = status === "livree" || status === "annulee";
  const team = role === "gerant" || role === "vendeur";

  return (
    <div className="space-y-4">
      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-xl bg-leaf-50 px-3.5 py-2.5 text-sm text-leaf">{state.ok}</p>}
      </div>

      {team && !paid && !closed && (
        <form action={action} className="space-y-2 rounded-xl bg-sun-100 p-3.5">
          <input type="hidden" name="op" value="pay" />
          <p className="text-sm">Vérifiez sur le téléphone marchand la réception de <strong>{total}</strong>.</p>
          <label className="block">
            <span className="label">Référence de la transaction <span className="font-normal text-mute">(facultatif)</span></span>
            <input name="ref" maxLength={80} className="field" />
          </label>
          <button type="submit" disabled={pending} className="btn-primary w-full">Paiement reçu</button>
        </form>
      )}

      {team && paid && status === "preparation" && livreurs.length > 0 && (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="op" value="assign" />
          <select name="livreur" defaultValue={assignedTo ?? ""} className="field py-2" aria-label="Livreur">
            <option value="">Sans livreur (Yango)</option>
            {livreurs.map((l) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
          </select>
          <button type="submit" disabled={pending} className="btn-ghost">OK</button>
        </form>
      )}

      {team && paid && status === "preparation" && (
        <form action={action}>
          <input type="hidden" name="op" value="expediee" />
          <button type="submit" disabled={pending} className="btn-primary w-full">Commande prête : partie en livraison</button>
        </form>
      )}

      {paid && status === "expediee" && (
        <form action={action}>
          <input type="hidden" name="op" value="livree" />
          <button type="submit" disabled={pending} className="btn w-full bg-leaf text-white hover:bg-[#17603c]">Livrée au client</button>
        </form>
      )}

      {team && !closed && (
        cancelling ? (
          <form action={action} className="space-y-2 rounded-xl border border-line p-3.5">
            <input type="hidden" name="op" value="annulee" />
            <label className="block">
              <span className="label">Raison de l&apos;annulation</span>
              <input name="reason" required maxLength={500} className="field" placeholder="Ex. client injoignable" />
            </label>
            {paid && <p className="text-xs text-[#a06d00]">Le client a déjà payé : pensez à le rembourser.</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="btn flex-1 bg-ink text-white">Confirmer l&apos;annulation</button>
              <button type="button" onClick={() => setCancelling(false)} className="btn-ghost">Retour</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setCancelling(true)} className="w-full text-center text-sm text-mute underline-offset-4 hover:text-red hover:underline">Annuler la commande</button>
        )
      )}
    </div>
  );
}
