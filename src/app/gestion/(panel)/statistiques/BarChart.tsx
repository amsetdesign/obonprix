import { fcfa } from "@/lib/format";

export type Bar = { key: string; label: string; short: string; revenue: number; margin: number | null; tickets?: number };

/**
 * Histogramme du chiffre d'affaires (une seule série, rouge de la marque).
 * Survol ou focus d'une barre : chiffre d'affaires, bénéfice et nombre de ventes.
 * Le détail chiffré est aussi disponible en tableau sous le graphique.
 */
export default function BarChart({ bars, title }: { bars: Bar[]; title: string }) {
  const max = Math.max(1, ...bars.map((b) => b.revenue));
  const every = bars.length > 16 ? Math.ceil(bars.length / 10) : 1;
  return (
    <figure className="card p-5">
      <figcaption className="font-display text-lg font-extrabold">{title}</figcaption>
      <div className="relative mt-6 h-56">
        {/* lignes de repère discrètes */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[10px] text-mute tabular">{fcfa(Math.round(max * f))}</span>
          </div>
        ))}
        <ol className="absolute inset-0 flex items-end gap-[2px] pr-16">
          {bars.map((b) => (
            <li key={b.key} className="group relative flex h-full flex-1 items-end justify-center">
              <button
                type="button"
                className="block w-full max-w-9 rounded-t-[4px] bg-red/85 transition-colors outline-none hover:bg-red focus-visible:bg-red"
                style={{ height: `${Math.max(b.revenue ? 2 : 0, (b.revenue / max) * 100)}%` }}
                aria-label={`${b.label} : ${fcfa(b.revenue)}${b.margin != null ? `, bénéfice ${fcfa(b.margin)}` : ""}`}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg group-focus-within:block group-hover:block">
                <span className="block font-semibold">{b.label}</span>
                <span className="block tabular">Ventes : {fcfa(b.revenue)}</span>
                {b.margin != null && <span className="block text-sun tabular">Bénéfice : {fcfa(b.margin)}</span>}
                {b.tickets != null && <span className="block text-white/70 tabular">{b.tickets} vente{b.tickets > 1 ? "s" : ""}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <ol className="mt-2 flex gap-[2px] pr-16 text-[10px] text-mute" aria-hidden>
        {bars.map((b, i) => <li key={b.key} className="flex-1 text-center tabular">{i % every === 0 ? b.short : ""}</li>)}
      </ol>
    </figure>
  );
}
