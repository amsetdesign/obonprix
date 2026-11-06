// Périodes des statistiques. Dakar est à UTC+0 toute l'année : un jour Dakar = un jour UTC.
const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const iso = (d: Date) => d.toISOString().slice(0, 10);

export const PRESETS = [
  { key: "jour", label: "Aujourd'hui" },
  { key: "hier", label: "Hier" },
  { key: "7j", label: "7 derniers jours" },
  { key: "30j", label: "30 derniers jours" },
  { key: "mois", label: "Ce mois" },
  { key: "mois-precedent", label: "Mois dernier" },
  { key: "annee", label: "Cette année" },
] as const;

export type Period = { key: string; label: string; from: Date; to: Date; prevFrom: Date; prevTo: Date; days: number };

/** Période choisie (préréglage ou dates « du / au »), avec la période précédente de même durée pour comparer */
export function resolvePeriod(p?: string, du?: string, au?: string, now = new Date()): Period {
  const today = startOfDay(now);
  let from: Date, to: Date, label: string, key = p ?? "jour";
  const date = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null);
  const d1 = date(du), d2 = date(au);
  if (d1 && d2 && d2 >= d1 && d2.getTime() - d1.getTime() <= 366 * DAY) {
    key = "dates";
    from = d1;
    to = new Date(d2.getTime() + DAY);
    label = `Du ${d1.toLocaleDateString("fr-FR", { timeZone: "UTC" })} au ${d2.toLocaleDateString("fr-FR", { timeZone: "UTC" })}`;
  } else {
    switch (key) {
      case "hier": from = new Date(today.getTime() - DAY); to = today; break;
      case "7j": from = new Date(today.getTime() - 6 * DAY); to = new Date(today.getTime() + DAY); break;
      case "30j": from = new Date(today.getTime() - 29 * DAY); to = new Date(today.getTime() + DAY); break;
      case "mois": from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); to = new Date(today.getTime() + DAY); break;
      case "mois-precedent": from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)); to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); break;
      case "annee": from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1)); to = new Date(today.getTime() + DAY); break;
      default: key = "jour"; from = today; to = new Date(today.getTime() + DAY);
    }
    label = PRESETS.find((x) => x.key === key)!.label;
  }
  const span = to.getTime() - from.getTime();
  return { key, label, from, to, prevFrom: new Date(from.getTime() - span), prevTo: from, days: Math.round(span / DAY) };
}

/** Tous les jours de la période (pour afficher aussi les jours sans vente) */
export function daysOf(from: Date, to: Date) {
  const out: string[] = [];
  for (let t = from.getTime(); t < to.getTime(); t += DAY) out.push(iso(new Date(t)));
  return out;
}

export const dayInput = (d: Date) => iso(d);
