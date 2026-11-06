import type { Metadata } from "next";
import { requireStaff } from "@/lib/staff";
import { fcfa } from "@/lib/format";

export const metadata: Metadata = { title: "Clôtures de caisse" };

const dt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(iso));

export default async function ClosuresPage() {
  const { supabase } = await requireStaff(["gerant"]);
  const { data: rows } = await supabase
    .from("cash_closures")
    .select("id, period_start, period_end, opening_float, cash_sales, wave_sales, om_sales, tickets, cancelled, expected_cash, counted_cash, difference, note, profiles(full_name)")
    .order("period_end", { ascending: false })
    .limit(90);
  const list = rows ?? [];
  const totalDiff = list.slice(0, 30).reduce((n, r) => n + r.difference, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Clôtures de caisse</h1>
        <p className="mt-1 text-sm text-mute">Chaque soir, le vendeur compte les espèces du tiroir depuis la caisse (bouton « Clôturer »). L&apos;écart avec le montant attendu est enregistré ici.</p>
      </header>
      {list.length > 0 && (
        <p className={`rounded-xl px-4 py-3 text-sm ${totalDiff < 0 ? "bg-red-50 text-red-700" : "bg-leaf-50 text-leaf"}`}>
          Cumul des écarts sur les 30 dernières clôtures : <strong className="tabular">{fcfa(totalDiff)}</strong>
        </p>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs tracking-wide text-mute uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Période</th>
              <th className="px-4 py-3 font-semibold">Par</th>
              <th className="px-4 py-3 text-right font-semibold">Tickets</th>
              <th className="px-4 py-3 text-right font-semibold">Espèces</th>
              <th className="px-4 py-3 text-right font-semibold">Wave</th>
              <th className="px-4 py-3 text-right font-semibold">Orange Money</th>
              <th className="px-4 py-3 text-right font-semibold">Attendu / compté</th>
              <th className="px-4 py-3 text-right font-semibold">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 whitespace-nowrap">{dt(r.period_start)} → {dt(r.period_end)}{r.note && <span className="block text-xs text-mute">{r.note}</span>}</td>
                <td className="px-4 py-2.5">{(r.profiles as unknown as { full_name: string } | null)?.full_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular">{r.tickets}{r.cancelled ? <span className="text-xs text-mute"> (+{r.cancelled} ann.)</span> : null}</td>
                <td className="px-4 py-2.5 text-right tabular">{fcfa(r.cash_sales)}</td>
                <td className="px-4 py-2.5 text-right tabular">{fcfa(r.wave_sales)}</td>
                <td className="px-4 py-2.5 text-right tabular">{fcfa(r.om_sales)}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap tabular">{fcfa(r.expected_cash)} / {fcfa(r.counted_cash)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap tabular ${r.difference === 0 ? "text-leaf" : r.difference > 0 ? "text-[#a06d00]" : "text-red"}`}>
                  {r.difference === 0 ? "Juste" : `${r.difference > 0 ? "+" : ""}${fcfa(r.difference)}`}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-mute">Aucune clôture pour l&apos;instant.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
