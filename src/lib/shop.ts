import "server-only";
import { cache } from "react";
import { publicClient } from "@/lib/supabase/public";
import { hasSupabase } from "@/lib/supabase/env";

export type Category = { id: number; slug: string; name: string };
export type ShopProduct = {
  id: string; slug: string; name: string; unit: "piece" | "kg";
  price: number; promo_price: number | null; in_stock: boolean;
  image_url: string; description: string; category_id: number | null;
};
export type Zone = { id: number; name: string; price: number; areas: string[] };
export type StoreSettings = {
  name: string; phone: string; whatsapp: string; wave_number: string; om_number: string; base_address: string;
  hours: Record<string, [string, string] | null>; accepting_orders: boolean; min_order: number; free_delivery_from: number | null;
};

const COLS = "id, slug, name, unit, price, promo_price, stock, image_url, description, category_id";

type Row = Omit<ShopProduct, "in_stock"> & { stock: number | string };
// le stock exact reste interne : la boutique affiche seulement « disponible » ou « épuisé »
const toShop = ({ stock, ...p }: Row): ShopProduct => ({ ...p, in_stock: Number(stock) > 0 });

/** Produits vendables en ligne : actifs, en ligne et avec un prix */
const online = () => publicClient().from("products").select(COLS).eq("is_active", true).eq("is_online", true).not("price", "is", null);

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!hasSupabase) return [];
  const { data } = await publicClient().from("categories").select("id, slug, name").order("position");
  return data ?? [];
});

export const getSettings = cache(async (): Promise<StoreSettings | null> => {
  if (!hasSupabase) return null;
  const { data } = await publicClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
  return data;
});

export const getZones = cache(async (): Promise<Zone[]> => {
  if (!hasSupabase) return [];
  const { data } = await publicClient().from("delivery_zones").select("id, name, price, areas").eq("active", true).order("position");
  return data ?? [];
});

/** Disponibles d'abord, puis par nom */
const sortProducts = (list: ShopProduct[]) => list.sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || a.name.localeCompare(b.name, "fr"));

export async function getProductsByCategory(categoryId: number) {
  if (!hasSupabase) return [];
  const { data } = await online().eq("category_id", categoryId);
  return sortProducts((data ?? []).map(toShop));
}

export async function getProduct(slug: string) {
  if (!hasSupabase) return null;
  const { data } = await online().eq("slug", slug).maybeSingle();
  return data ? toShop(data) : null;
}

/** Sélection de l'accueil : promotions d'abord, puis un produit de chaque rayon à tour de rôle (photos en premier) */
export async function getHighlights(limit = 10) {
  if (!hasSupabase) return [];
  const { data } = await online().gt("stock", 0).limit(300);
  const list = (data ?? []).map(toShop).sort((a, b) => Number(Boolean(b.image_url)) - Number(Boolean(a.image_url)));
  const picked = list.filter((p) => p.promo_price != null).slice(0, limit);
  const byCat = new Map<number, ShopProduct[]>();
  for (const p of list) if (p.promo_price == null) byCat.set(p.category_id ?? 0, [...(byCat.get(p.category_id ?? 0) ?? []), p]);
  const queues = [...byCat.values()];
  for (let i = 0; picked.length < limit && queues.some((q) => q.length); i++) {
    const next = queues[i % queues.length].shift();
    if (next) picked.push(next);
  }
  return picked;
}

export async function searchProducts(q: string) {
  if (!hasSupabase || q.trim().length < 2) return [];
  const { data } = await online().limit(400);
  const plain = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const words = plain(q).split(/\s+/).filter(Boolean);
  return sortProducts((data ?? []).map(toShop).filter((p) => words.every((w) => plain(p.name).includes(w))));
}

const DAY_KEYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

/** Ouvert en ce moment ? (Dakar est à UTC+0 toute l'année) */
export function openNow(hours: StoreSettings["hours"], now = new Date()) {
  const h = hours[DAY_KEYS[now.getUTCDay()]];
  if (!h) return false;
  const t = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  return t >= h[0] && t < h[1];
}

const DAY_NAMES: [string, string][] = [["lun", "Lundi"], ["mar", "Mardi"], ["mer", "Mercredi"], ["jeu", "Jeudi"], ["ven", "Vendredi"], ["sam", "Samedi"], ["dim", "Dimanche"]];
const hh = (t: string) => t.replace(/^0/, "").replace(":00", " h").replace(":", " h ");

/** Horaires regroupés : « Lundi au samedi 8 h - 23 h », « Dimanche 12 h - 23 h » */
export function hoursLines(hours: StoreSettings["hours"]) {
  const lines: { days: string; time: string }[] = [];
  let i = 0;
  while (i < DAY_NAMES.length) {
    const cur = hours[DAY_NAMES[i][0]];
    let j = i;
    while (j + 1 < DAY_NAMES.length && JSON.stringify(hours[DAY_NAMES[j + 1][0]]) === JSON.stringify(cur)) j++;
    const days = i === j ? DAY_NAMES[i][1] : `${DAY_NAMES[i][1]} au ${DAY_NAMES[j][1].toLowerCase()}`;
    lines.push({ days, time: cur ? `${hh(cur[0])} - ${hh(cur[1])}` : "Fermé" });
    i = j + 1;
  }
  return lines;
}
