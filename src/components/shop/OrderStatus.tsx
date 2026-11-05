import { fcfa, qty } from "@/lib/format";
import type { TrackedOrder } from "@/app/(boutique)/commande/actions";
import { IconCheck } from "@/components/icons";

const STEPS = [
  { key: "recue", label: "Commande reçue" },
  { key: "payee", label: "Paiement reçu" },
  { key: "preparation", label: "En préparation" },
  { key: "expediee", label: "En route" },
  { key: "livree", label: "Livrée" },
];

function reached(o: TrackedOrder) {
  if (o.status === "livree") return 5;
  if (o.status === "expediee") return 4;
  if (o.payment_status === "paye") return 3;
  return 1;
}

export const PAY_LABEL: Record<string, string> = { wave: "Wave", om: "Orange Money" };

export default function OrderStatus({ o }: { o: TrackedOrder }) {
  const n = reached(o);
  return (
    <div className="space-y-6">
      {o.status === "annulee" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700">Cette commande a été annulée.</p>
      ) : (
        <ol className="grid gap-2 sm:grid-cols-5">
          {STEPS.map((s, i) => {
            const done = i < n;
            return (
              <li key={s.key} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium sm:flex-col sm:text-center ${done ? "bg-leaf-50 text-leaf" : "bg-cream text-mute"}`}>
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-leaf text-white" : "bg-white ring-1 ring-line"}`}>
                  {done ? <IconCheck className="size-4" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
      )}
      <div className="card p-5">
        <ul className="space-y-2 text-sm">
          {o.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{it.name} <span className="text-mute">× {qty(it.qty, it.unit)}</span></span>
              <span className="tabular">{fcfa(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><span className="tabular">{fcfa(o.subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Livraison{o.area ? ` (${o.area})` : ""}</span>
            <span className="tabular">{o.delivery_mode === "yango" ? "Yango, payée au livreur" : fcfa(o.delivery_fee)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span className="tabular">{fcfa(o.total)}</span></div>
        </div>
      </div>
    </div>
  );
}
