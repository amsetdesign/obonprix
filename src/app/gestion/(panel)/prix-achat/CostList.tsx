"use client";

import { useState, useTransition } from "react";
import { fcfa } from "@/lib/format";
import { saveCost } from "./actions";

type Row = { id: string; name: string; unit: string; price: number | null; promo_price: number | null; cost_price: number | null };
type State = { value: string; saved: number | null; status?: "ok" | "error"; message?: string };

/** Une ligne par produit : prix de vente, prix d'achat (modifiable), bénéfice calculé en direct */
export default function CostList({ rows }: { rows: Row[] }) {
  const [st, setSt] = useState<Record<string, State>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, { value: r.cost_price != null ? String(r.cost_price) : "", saved: r.cost_price }])),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const save = (r: Row) => {
    const raw = st[r.id].value.trim().replace(/\s/g, "");
    const cost = raw === "" ? null : Number(raw);
    if (cost != null && (!Number.isInteger(cost) || cost < 0)) {
      setSt((s) => ({ ...s, [r.id]: { ...s[r.id], status: "error", message: "Nombre entier en F" } }));
      return;
    }
    if (cost === st[r.id].saved) return;
    setPendingId(r.id);
    start(async () => {
      const res = await saveCost(r.id, cost);
      setPendingId(null);
      setSt((s) => ({ ...s, [r.id]: res.ok ? { ...s[r.id], saved: cost, status: "ok", message: "Enregistré" } : { ...s[r.id], status: "error", message: res.error } }));
    });
  };

  if (!rows.length) return <p className="card p-6 text-center text-mute">Aucun produit actif dans ce rayon.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line text-left text-xs tracking-wide text-mute uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Produit</th>
            <th className="px-4 py-3 text-right font-semibold">Prix de vente</th>
            <th className="px-4 py-3 text-right font-semibold">Prix d&apos;achat</th>
            <th className="px-4 py-3 text-right font-semibold">Bénéfice</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const s = st[r.id];
            const sell = r.promo_price ?? r.price;
            const v = s.value.trim() === "" ? null : Number(s.value.replace(/\s/g, ""));
            const margin = sell != null && v != null && Number.isFinite(v) ? sell - v : null;
            return (
              <tr key={r.id} className={s.status === "ok" ? "bg-leaf-50/50" : ""}>
                <td className="px-4 py-2.5 font-medium">{r.name}{r.unit === "kg" && <span className="text-mute"> (le kg)</span>}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap tabular">{fcfa(sell)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      inputMode="numeric"
                      value={s.value}
                      onChange={(e) => setSt((x) => ({ ...x, [r.id]: { ...x[r.id], value: e.target.value, status: undefined, message: undefined } }))}
                      onBlur={() => save(r)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      placeholder="—"
                      aria-label={`Prix d'achat de ${r.name}`}
                      className="field w-28 py-2 text-right tabular"
                    />
                    <span className={`w-20 text-xs ${s.status === "error" ? "text-red" : "text-leaf"}`} aria-live="polite">{pendingId === r.id ? "…" : s.message}</span>
                  </div>
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap tabular ${margin == null ? "text-mute" : margin < 0 ? "text-red" : "text-leaf"}`}>
                  {margin == null ? "—" : <>{fcfa(margin)}{sell ? <span className="ml-1 text-xs font-normal text-mute">{Math.round((margin / sell) * 100)} %</span> : null}</>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-3 text-xs text-mute">Le prix d&apos;achat s&apos;enregistre dès que vous quittez la case (ou touchez Entrée). Videz la case pour l&apos;effacer.</p>
    </div>
  );
}
