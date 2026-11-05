import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { canEditCatalog } from "@/lib/roles";
import { qty } from "@/lib/format";

export default async function Dashboard() {
  const { supabase, name, role } = await requireStaff();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, stock, stock_alert, price, is_active, is_online")
    .order("name");
  const list = products ?? [];
  const active = list.filter((p) => p.is_active);
  const out = active.filter((p) => Number(p.stock) <= 0);
  const low = active.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.stock_alert));
  const noPrice = active.filter((p) => p.price == null);

  const tiles = [
    { label: "Produits actifs", value: active.length, href: "/gestion/produits" },
    { label: "En rupture", value: out.length, href: "/gestion/produits?filtre=rupture", tone: out.length ? "text-red" : "" },
    { label: "Stock bas", value: low.length, href: "/gestion/produits?filtre=bas", tone: low.length ? "text-[#a06d00]" : "" },
    { label: "Sans prix", value: noPrice.length, href: "/gestion/produits?filtre=sans-prix", tone: noPrice.length ? "text-[#a06d00]" : "" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-mute">Bonjour{name ? ` ${name.split(" ")[0]}` : ""},</p>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Tableau de bord</h1>
      </header>

      <section aria-label="Chiffres du stock" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-4 transition-colors hover:border-ink/25">
            <p className="text-sm text-mute">{t.label}</p>
            <p className={`mt-1 font-display text-3xl font-extrabold tabular ${t.tone ?? ""}`}>{t.value}</p>
          </Link>
        ))}
      </section>

      {canEditCatalog(role) && (
        <div className="flex flex-wrap gap-3">
          <Link href="/gestion/stock" className="btn-primary">Saisir un arrivage</Link>
          <Link href="/gestion/inventaire" className="btn-ghost">Faire l&apos;inventaire</Link>
          <Link href="/gestion/produits/nouveau" className="btn-ghost">Ajouter un produit</Link>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-extrabold">En rupture</h2>
          {out.length ? (
            <ul className="mt-3 divide-y divide-line">
              {out.slice(0, 12).map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2 text-sm">
                  <Link href={`/gestion/produits/${p.id}`} className="min-w-0 truncate hover:text-red">{p.name}</Link>
                  <span className="shrink-0 font-semibold text-red tabular">{qty(p.stock, p.unit)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-mute">Aucun produit en rupture.</p>}
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-extrabold">Stock bas</h2>
          {low.length ? (
            <ul className="mt-3 divide-y divide-line">
              {low.slice(0, 12).map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2 text-sm">
                  <Link href={`/gestion/produits/${p.id}`} className="min-w-0 truncate hover:text-red">{p.name}</Link>
                  <span className="shrink-0 tabular">{qty(p.stock, p.unit)} <span className="text-mute">/ seuil {qty(p.stock_alert, p.unit)}</span></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-mute">Rien à signaler. Fixez un seuil d&apos;alerte sur chaque produit pour être prévenu avant la rupture.</p>
          )}
        </div>
      </section>
    </div>
  );
}
