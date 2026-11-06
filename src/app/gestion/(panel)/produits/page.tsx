import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { canEditCatalog } from "@/lib/roles";
import { fcfa, qty } from "@/lib/format";

export const metadata: Metadata = { title: "Produits" };

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "rupture", label: "En rupture" },
  { key: "bas", label: "Stock bas" },
  { key: "sans-prix", label: "Sans prix" },
  { key: "promo", label: "En promo" },
  { key: "packs", label: "Packs" },
  { key: "hors-ligne", label: "Pas en ligne" },
  { key: "inactifs", label: "Désactivés" },
];

type SP = Promise<{ q?: string; rayon?: string; filtre?: string }>;

const plain = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const { supabase, role } = await requireStaff(["gerant", "stock", "vendeur"]);
  const { q = "", rayon = "", filtre = "" } = await searchParams;
  const [{ data: cats }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, slug, name").order("position"),
    supabase.from("products").select("id, name, unit, price, promo_price, stock, stock_alert, barcode, image_url, is_active, is_online, category_id, kind").order("name"),
  ]);
  const catBy = new Map((cats ?? []).map((c) => [c.id, c]));
  const needle = plain(q.trim());

  const list = (products ?? []).filter((p) => {
    if (rayon && catBy.get(p.category_id)?.slug !== rayon) return false;
    if (needle && !plain(p.name).includes(needle) && p.barcode !== q.trim()) return false;
    const s = Number(p.stock);
    switch (filtre) {
      case "rupture": return p.is_active && s <= 0;
      case "bas": return p.is_active && p.kind === "simple" && s > 0 && s < Number(p.stock_alert);
      case "sans-prix": return p.price == null;
      case "promo": return p.promo_price != null;
      case "packs": return p.kind === "pack";
      case "hors-ligne": return p.is_active && !p.is_online;
      case "inactifs": return !p.is_active;
      default: return true;
    }
  });

  const href = (patch: Record<string, string>) => {
    const sp = new URLSearchParams({ q, rayon, filtre, ...patch });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    const s = sp.toString();
    return `/gestion/produits${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Produits</h1>
          <p className="text-sm text-mute">{list.length} produit{list.length > 1 ? "s" : ""} affiché{list.length > 1 ? "s" : ""}</p>
        </div>
        {canEditCatalog(role) && <Link href="/gestion/produits/nouveau" className="btn-primary">Ajouter un produit</Link>}
      </header>

      <form className="flex flex-wrap gap-3" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Rechercher un produit ou un code-barres" className="field max-w-sm flex-1" aria-label="Rechercher" />
        <select name="rayon" defaultValue={rayon} className="field w-auto" aria-label="Rayon">
          <option value="">Tous les rayons</option>
          {(cats ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        {filtre && <input type="hidden" name="filtre" value={filtre} />}
        <button type="submit" className="btn-ghost">Filtrer</button>
      </form>

      <nav aria-label="Filtres" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={href({ filtre: f.key })} aria-current={filtre === f.key ? "true" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filtre === f.key ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink/30"}`}>
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold">Produit</th>
              <th className="px-4 py-3 font-semibold">Rayon</th>
              <th className="px-4 py-3 text-right font-semibold">Prix</th>
              <th className="px-4 py-3 text-right font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">En ligne</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const s = Number(p.stock);
              const stockTone = s <= 0 ? "text-red font-semibold" : s < Number(p.stock_alert) ? "text-[#a06d00] font-semibold" : "";
              return (
                <tr key={p.id} className={p.is_active ? "" : "opacity-55"}>
                  <td className="px-4 py-2.5">
                    <Link href={`/gestion/produits/${p.id}`} className="flex items-center gap-3 hover:text-red">
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="size-full object-contain" loading="lazy" />
                        ) : <span className="text-xs font-bold text-mute">{p.name.slice(0, 1)}</span>}
                      </span>
                      <span className="font-medium">{p.name}</span>{p.kind === "pack" && <span className="pill bg-red text-white">Pack</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-mute">{catBy.get(p.category_id)?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular whitespace-nowrap">
                    {p.price == null ? <span className="pill bg-sun-100 text-[#7a5300]">Sans prix</span> : p.promo_price != null ? (
                      <><span className="mr-1.5 text-mute line-through">{fcfa(p.price)}</span><span className="font-semibold text-red">{fcfa(p.promo_price)}</span></>
                    ) : fcfa(p.price)}
                    {p.unit === "kg" && p.price != null && <span className="text-mute"> /kg</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular whitespace-nowrap ${stockTone}`}>{qty(p.stock, p.unit)}</td>
                  <td className="px-4 py-2.5">
                    {p.is_active && p.is_online ? <span className="pill bg-leaf-50 text-leaf">Oui</span> : <span className="pill bg-cream text-mute">Non</span>}
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-mute">Aucun produit ne correspond.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
