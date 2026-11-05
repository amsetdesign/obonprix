import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import { canEditCatalog } from "@/lib/roles";
import { MOVEMENT_LABEL, dateTime, fcfa, qty } from "@/lib/format";
import ProductForm from "../ProductForm";
import { saveProduct } from "../actions";

export const metadata: Metadata = { title: "Fiche produit" };

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> }) {
  const { supabase, role } = await requireStaff(["gerant", "stock", "vendeur"]);
  const { id } = await params;
  const { cree } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [{ data: p }, { data: cats }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("position"),
  ]);
  if (!p) notFound();
  const editable = canEditCatalog(role);
  // le journal du stock n'est lisible que par le gérant et la gestionnaire de stock (règle de la base)
  const { data: moves } = editable
    ? await supabase.from("stock_movements").select("id, delta, reason, note, created_at, profiles(full_name)").eq("product_id", id).order("created_at", { ascending: false }).limit(15)
    : { data: [] };

  return (
    <div className="space-y-6">
      <Link href="/gestion/produits" className="text-sm text-mute hover:text-red">← Tous les produits</Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{p.name}</h1>
        <div className="card px-4 py-2.5 text-right">
          <p className="text-xs text-mute">Stock actuel</p>
          <p className={`font-display text-2xl font-extrabold tabular ${Number(p.stock) <= 0 ? "text-red" : ""}`}>{qty(p.stock, p.unit)}</p>
        </div>
      </header>
      {cree && <p className="rounded-xl bg-leaf-50 px-4 py-3 text-sm text-leaf">Produit créé.</p>}

      {editable ? (
        <ProductForm action={saveProduct.bind(null, id)} categories={cats ?? []} initial={p} />
      ) : (
        <div className="card grid gap-4 p-5 sm:grid-cols-3">
          <div><p className="text-xs text-mute">Prix</p><p className="font-semibold tabular">{fcfa(p.promo_price ?? p.price)}{p.unit === "kg" ? " /kg" : ""}</p></div>
          <div><p className="text-xs text-mute">Rayon</p><p className="font-semibold">{cats?.find((c) => c.id === p.category_id)?.name ?? "—"}</p></div>
          <div><p className="text-xs text-mute">Code-barres</p><p className="font-semibold tabular">{p.barcode || "—"}</p></div>
        </div>
      )}

      {editable && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold">Derniers mouvements de stock</h2>
            <Link href={`/gestion/stock?produit=${id}`} className="btn-ghost min-h-10">Arrivage ou perte</Link>
          </div>
          {moves?.length ? (
            <ul className="mt-3 divide-y divide-line text-sm">
              {moves.map((m) => {
                const who = (m.profiles as unknown as { full_name: string } | null)?.full_name;
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <span className="font-medium">{MOVEMENT_LABEL[m.reason] ?? m.reason}</span>
                      {m.note && <span className="text-mute"> · {m.note}</span>}
                      <span className="block text-xs text-mute">{dateTime(m.created_at)}{who ? ` · ${who}` : ""}</span>
                    </span>
                    <span className={`font-semibold tabular ${Number(m.delta) < 0 ? "text-red" : "text-leaf"}`}>
                      {Number(m.delta) > 0 ? "+" : ""}{qty(m.delta, p.unit)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-2 text-sm text-mute">Aucun mouvement.</p>}
        </section>
      )}
    </div>
  );
}
