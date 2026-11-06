const fcfaFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const qtyFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });
const NBSP = String.fromCharCode(0xa0);
const NARROW_NBSP = new RegExp(String.fromCharCode(0x202f), "g");
const ANY_NBSP = new RegExp(`[${String.fromCharCode(0x202f)}${NBSP}]`, "g");

/** 12500 -> « 12 500 F » (espaces insécables : un prix ne se coupe jamais en fin de ligne) */
export const fcfa = (n: number | null | undefined) => (n == null ? "—" : `${fcfaFmt.format(n).replace(NARROW_NBSP, NBSP)}${NBSP}F`);

/** Quantité avec son unité : « 3 » ou « 2,5 kg » */
export const qty = (n: number | string, unit: string) => {
  const v = qtyFmt.format(Number(n)).replace(ANY_NBSP, " ");
  return unit === "kg" ? `${v} kg` : v;
};

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dakar" }).format(new Date(iso));

/** Nombre saisi à la française (« 2,5 ») -> 2.5, ou null */
export function parseNum(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const MOVEMENT_LABEL: Record<string, string> = {
  import: "Import inventaire",
  achat: "Arrivage",
  inventaire: "Inventaire",
  ajustement: "Ajustement",
  perte: "Perte / casse",
  vente_caisse: "Vente caisse",
  vente_en_ligne: "Commande en ligne",
  annulation: "Annulation",
};

/** Fin d'offre (date exclusive, minuit UTC = minuit à Dakar) -> « Offre valable jusqu'au 30 novembre » */
export function offerEnds(iso: string | null) {
  if (!iso) return null;
  const last = new Date(new Date(iso).getTime() - 1);
  return `Offre valable jusqu'au ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Africa/Dakar" }).format(last)}`;
}
