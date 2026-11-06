import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { canEditCatalog } from "@/lib/roles";
import { fcfa, qty } from "@/lib/format";

export default async function Dashboard() {
  const { supabase, name, role } = await requireStaff();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, stock, stock_alert, price, is_active, is_online, kind")
    .order("name");
  const list = products ?? [];
  // chiffres du jour (gérant) et valeur du stock au prix d'achat (gérant, stock)
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const [{ data: day }, { data: stockVal }] = await Promise.all([
    role === "gerant" ? supabase.rpc("sales_stats", { p_from: today.toISOString(), p_to: new Date(today.getTime() + 86_400_000).toISOString() }) : Promise.resolve({ data: null }),
    canEditCatalog(role) ? supabase.rpc("stock_value") : Promise.resolve({ data: null }),
  ]);
  const d = day as { revenue: number; cost: number; revenue_with_cost: number; tickets: number } | null;
  const sv = stockVal as { value: number; products_without_cost: number } | null;
  const active = list.filter((p) => p.is_active);
  const out = active.filter((p) => Number(p.stock) <= 0);
  const low = active.filter((p) => p.kind === "simple" && Number(p.stock) > 0 && Number(p.stock) < Number(p.stock_alert));
  const noPrice = active.filter((p) => p.price == null);

  const tiles = [
    { label: "Produits actifs", value: active.length, href: "/gestion/produits" },
    { label: "En rupture", value: out.length, href: "/gestion/produits?filtre=rupture", tone: out.length ? "text-red" : "" },
    { label: "À réapprovisionner", value: low.length + out.filter((p) => p.kind === "simple").length, href: "/gestion/reappro", tone: low.length ? "text-[#a06d00]" : "" },
    { label: "Sans prix", value: noPrice.length, href: "/gestion/produits?filtre=sans-prix", tone: noPrice.length ? "text-[#a06d00]" : "" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-mute">Bonjour{name ? ` ${name.split(" ")[0]}` : ""},</p>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Tableau de bord</h1>
      </header>

      {(d || sv) && (
        <section aria-label="Chiffres du jour" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {d && (
            <>
              <Link href="/gestion/statistiques" className="card bg-ink p-4 text-white hover:bg-ink/90">
                <p className="text-sm text-white/70">Ventes du jour</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular">{fcfa(d.revenue)}</p>
                <p className="text-xs text-white/60">{d.tickets} vente{d.tickets > 1 ? "s" : ""}</p>
              </Link>
              <Link href="/gestion/statistiques" className="card p-4 hover:border-ink/25">
                <p className="text-sm text-mute">Bénéfice du jour</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-leaf tabular">{fcfa(d.revenue_with_cost - d.cost)}</p>
                <p className="text-xs text-mute">sur les produits avec prix d&apos;achat</p>
              </Link>
            </>
          )}
          {sv && (
            <Link href="/gestion/prix-achat" className="card p-4 hover:border-ink/25">
              <p className="text-sm text-mute">Valeur du stock</p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular">{fcfa(sv.value)}</p>
              <p className="text-xs text-mute">{sv.products_without_cost ? `${sv.products_without_cost} produit${sv.products_without_cost > 1 ? "s" : ""} sans prix d'achat` : "au prix d'achat"}</p>
            </Link>
          )}
        </section>
      )}

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
