"use client";

import { useState, useTransition } from "react";
import { countStock } from "../stock/actions";

type P = { id: string; name: string; unit: string; stock: number };
type RowState = { value: string; status?: "ok" | "error"; message?: string; stock: number };

const fmt = (n: number, unit: string) => `${String(Math.round(n * 1000) / 1000).replace(".", ",")}${unit === "kg" ? " kg" : ""}`;

/** Une ligne par produit : quantité comptée -> Valider. Pensé pour le tactile (gros champs, gros boutons). */
export default function CountList({ products }: { products: P[] }) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => Object.fromEntries(products.map((p) => [p.id, { value: "", stock: p.stock }])));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const done = Object.values(rows).filter((r) => r.status === "ok").length;

  const save = (p: P) => {
    const raw = rows[p.id].value.trim().replace(",", ".");
    const counted = Number(raw);
    if (raw === "" || !Number.isFinite(counted) || counted < 0 || (p.unit === "piece" && !Number.isInteger(counted))) {
      setRows((r) => ({ ...r, [p.id]: { ...r[p.id], status: "error", message: p.unit === "piece" ? "Nombre entier" : "Quantité invalide" } }));
      return;
    }
    setPendingId(p.id);
    startTransition(async () => {
      const res = await countStock(p.id, counted);
      setPendingId(null);
      setRows((r) => ({
        ...r,
        [p.id]: res.ok
          ? { value: "", stock: counted, status: "ok", message: res.diff ? `Écart ${res.diff > 0 ? "+" : ""}${fmt(res.diff, p.unit)}` : "Conforme" }
          : { ...r[p.id], status: "error", message: res.error },
      }));
    });
  };

  if (!products.length) return <p className="card p-6 text-center text-mute">Aucun produit actif dans ce rayon.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">{done} / {products.length} produit{products.length > 1 ? "s" : ""} compté{done > 1 ? "s" : ""} dans ce rayon</p>
      <ul className="card divide-y divide-line">
        {products.map((p) => {
          const r = rows[p.id];
          return (
            <li key={p.id} className={`grid items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_auto] ${r.status === "ok" ? "bg-leaf-50/60" : ""}`}>
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-mute">Enregistré : <span className="tabular">{fmt(r.stock, p.unit)}</span>
                  {r.message && <span className={`ml-2 font-semibold ${r.status === "ok" ? "text-leaf" : "text-red"}`}>{r.message}</span>}
                </p>
              </div>
              <label className="flex items-center gap-2">
                <span className="sr-only">Quantité comptée pour {p.name}</span>
                <input
                  inputMode="decimal"
                  value={r.value}
                  onChange={(e) => setRows((s) => ({ ...s, [p.id]: { ...s[p.id], value: e.target.value, status: undefined, message: undefined } }))}
                  onKeyDown={(e) => { if (e.key === "Enter") save(p); }}
                  placeholder="Compté"
                  className="field w-28 text-right tabular"
                />
                {p.unit === "kg" && <span className="text-sm text-mute">kg</span>}
              </label>
              <button type="button" onClick={() => save(p)} disabled={pendingId === p.id || !r.value.trim()} className="btn-ghost min-h-11">
                {pendingId === p.id ? "…" : "Valider"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
