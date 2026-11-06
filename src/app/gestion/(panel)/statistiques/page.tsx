import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { fcfa, qty } from "@/lib/format";
import BarChart, { type Bar } from "./BarChart";
import { PRESETS, dayInput, daysOf, resolvePeriod } from "./periods";

export const metadata: Metadata = { title: "Statistiques" };

type Stats = {
  revenue: number; cost: number; revenue_with_cost: number; lines_without_cost: number; tickets: number; delivery_fees: number;
  by_channel: Record<string, { revenue: number; tickets: number }>;
  by_method: Record<string, number>;
  by_day: { day: string; revenue: number; margin: number | null; tickets: number }[];
  by_hour: { hour: number; revenue: number }[];
  top_products: { product_id: string | null; name: string; unit: string; qty: number; revenue: number; margin: number | null }[];
  by_category: { name: string; revenue: number; margin: number | null }[];
};

const METHOD: Record<string, string> = { especes: "Espèces", wave: "Wave", om: "Orange Money" };
const CHANNEL: Record<string, string> = { caisse: "Caisse", en_ligne: "En ligne" };
const DAY_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** Évolution par rapport à la période précédente */
function Trend({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="text-xs text-mute">Pas de comparaison</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const tone = pct > 0 ? "text-leaf" : pct < 0 ? "text-red" : "text-mute";
  return <span className={`text-xs font-semibold ${tone}`}>{pct > 0 ? "+" : ""}{pct} % <span className="font-normal text-mute">vs période précédente</span></span>;
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ p?: string; du?: string; au?: string }> }) {
  const { supabase } = await requireStaff(["gerant"]);
  const sp = await searchParams;
  const period = resolvePeriod(sp.p, sp.du, sp.au);
  const [{ data: cur, error }, { data: prev }] = await Promise.all([
    supabase.rpc("sales_stats", { p_from: period.from.toISOString(), p_to: period.to.toISOString() }),
    supabase.rpc("sales_stats", { p_from: period.prevFrom.toISOString(), p_to: period.prevTo.toISOString() }),
  ]);
  const s = cur as Stats | null;
  const b = prev as Stats | null;

  if (error || !s) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Statistiques</h1>
        <p className="rounded-xl bg-sun-100 p-4 text-sm">Les statistiques ne sont pas encore activées : lancez le fichier « OBP - 5 prix d&apos;achat et statistiques » dans Supabase.</p>
      </div>
    );
  }

  const margin = s.revenue_with_cost - s.cost;
  const marginPct = s.revenue_with_cost ? Math.round((margin / s.revenue_with_cost) * 100) : null;
  const prevMargin = b ? b.revenue_with_cost - b.cost : 0;
  const basket = s.tickets ? Math.round(s.revenue / s.tickets) : 0;

  // un seul jour : ventes heure par heure ; sinon jour par jour (jours sans vente compris)
  let bars: Bar[];
  if (period.days <= 1) {
    const byHour = new Map(s.by_hour.map((h) => [h.hour, h.revenue]));
    bars = Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: `${h} h - ${h + 1} h`, short: `${h}h`, revenue: Number(byHour.get(h) ?? 0), margin: null }));
  } else {
    const byDay = new Map(s.by_day.map((d) => [d.day, d]));
    bars = daysOf(period.from, period.to).map((day) => {
      const d = byDay.get(day);
      const date = new Date(`${day}T00:00:00Z`);
      return { key: day, label: DAY_FMT.format(date), short: String(date.getUTCDate()), revenue: Number(d?.revenue ?? 0), margin: d?.margin ?? null, tickets: d?.tickets ?? 0 };
    });
  }

  const tiles = [
    { label: "Chiffre d'affaires", value: fcfa(s.revenue), trend: <Trend now={s.revenue} before={b?.revenue ?? 0} /> },
    { label: "Bénéfice brut", value: fcfa(margin), sub: marginPct != null ? `Marge ${marginPct} %` : "Prix d'achat manquants", trend: <Trend now={margin} before={prevMargin} />, tone: margin < 0 ? "text-red" : "text-leaf" },
    { label: "Ventes", value: String(s.tickets), trend: <Trend now={s.tickets} before={b?.tickets ?? 0} /> },
    { label: "Panier moyen", value: fcfa(basket), sub: `Livraisons encaissées : ${fcfa(s.delivery_fees)}` },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Statistiques</h1>
          <p className="text-sm text-mute">{period.label} · caisse et commandes en ligne payées</p>
        </div>
        <form className="flex flex-wrap items-end gap-2" aria-label="Choisir des dates">
          <label className="text-xs text-mute">Du<input type="date" name="du" defaultValue={dayInput(period.from)} className="field mt-1 py-2" /></label>
          <label className="text-xs text-mute">Au<input type="date" name="au" defaultValue={dayInput(new Date(period.to.getTime() - 86_400_000))} className="field mt-1 py-2" /></label>
          <button type="submit" className="btn-ghost min-h-10">Voir</button>
          <a href={`/gestion/export/ventes?du=${dayInput(period.from)}&au=${dayInput(new Date(period.to.getTime() - 86_400_000))}`} download className="btn-primary min-h-10">Exporter les ventes (Excel)</a>
          <a href={"/gestion/export/stock"} download className="btn-ghost min-h-10">Exporter le stock</a>
        </form>
      </header>

      <nav aria-label="Périodes" className="flex flex-wrap gap-2">
        {PRESETS.map((x) => (
          <Link key={x.key} href={`/gestion/statistiques?p=${x.key}`} aria-current={period.key === x.key ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${period.key === x.key ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink/30"}`}>
            {x.label}
          </Link>
        ))}
      </nav>

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card space-y-1 p-4">
            <p className="text-sm text-mute">{t.label}</p>
            <p className={`font-display text-2xl font-extrabold tabular sm:text-3xl ${t.tone ?? ""}`}>{t.value}</p>
            {t.sub && <p className="text-xs text-mute">{t.sub}</p>}
            {t.trend}
          </div>
        ))}
      </section>

      {s.lines_without_cost > 0 && (
        <p className="rounded-xl bg-sun-100 px-4 py-3 text-sm">
          {s.lines_without_cost} ligne{s.lines_without_cost > 1 ? "s" : ""} de vente sans prix d&apos;achat : le bénéfice est calculé sur {fcfa(s.revenue_with_cost)} de ventes sur {fcfa(s.revenue)}.{" "}
          <Link href="/gestion/prix-achat" className="font-semibold underline underline-offset-4">Compléter les prix d&apos;achat</Link>
        </p>
      )}

      <BarChart bars={bars} title={period.days <= 1 ? "Ventes heure par heure" : "Ventes jour par jour"} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-lg font-extrabold">Produits les plus vendus</h2>
          {s.top_products.length ? (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-mute"><tr><th className="py-1.5 font-medium">Produit</th><th className="py-1.5 text-right font-medium">Qté</th><th className="py-1.5 text-right font-medium">Ventes</th><th className="py-1.5 text-right font-medium">Bénéfice</th></tr></thead>
              <tbody className="divide-y divide-line">
                {s.top_products.map((p, i) => (
                  <tr key={p.product_id ?? i}>
                    <td className="py-2 pr-2">{p.name}</td>
                    <td className="py-2 text-right whitespace-nowrap tabular">{qty(p.qty, p.unit)}</td>
                    <td className="py-2 text-right whitespace-nowrap tabular">{fcfa(p.revenue)}</td>
                    <td className={`py-2 text-right whitespace-nowrap tabular ${p.margin == null ? "text-mute" : p.margin < 0 ? "text-red" : "text-leaf"}`}>{p.margin == null ? "—" : fcfa(p.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="mt-2 text-sm text-mute">Aucune vente sur cette période.</p>}
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="font-display text-lg font-extrabold">Par rayon</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {s.by_category.map((c) => (
                <li key={c.name}>
                  <div className="flex justify-between gap-3">
                    <span>{c.name}</span>
                    <span className="tabular">{fcfa(c.revenue)}{c.margin != null && <span className="ml-2 text-leaf">+{fcfa(c.margin)}</span>}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-red" style={{ width: `${s.revenue ? (c.revenue / s.revenue) * 100 : 0}%` }} /></div>
                </li>
              ))}
              {!s.by_category.length && <li className="text-mute">Aucune vente sur cette période.</li>}
            </ul>
          </section>
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-base font-extrabold">Canal</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(s.by_channel).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{CHANNEL[k] ?? k} <span className="text-mute">({v.tickets})</span></span><span className="tabular">{fcfa(v.revenue)}</span></li>)}
                {!Object.keys(s.by_channel).length && <li className="text-mute">—</li>}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold">Paiement</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(s.by_method).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{METHOD[k] ?? k}</span><span className="tabular">{fcfa(v)}</span></li>)}
                {!Object.keys(s.by_method).length && <li className="text-mute">—</li>}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {period.days > 1 && (
        <details className="card p-5">
          <summary className="cursor-pointer font-display text-base font-extrabold">Détail jour par jour</summary>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-mute"><tr><th className="py-1.5 font-medium">Jour</th><th className="py-1.5 text-right font-medium">Ventes</th><th className="py-1.5 text-right font-medium">Nombre</th><th className="py-1.5 text-right font-medium">Bénéfice</th></tr></thead>
            <tbody className="divide-y divide-line">
              {bars.filter((x) => x.revenue > 0).map((x) => (
                <tr key={x.key}><td className="py-1.5">{x.label}</td><td className="py-1.5 text-right tabular">{fcfa(x.revenue)}</td><td className="py-1.5 text-right tabular">{x.tickets}</td><td className="py-1.5 text-right tabular">{x.margin == null ? "—" : fcfa(x.margin)}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
