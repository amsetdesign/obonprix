import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { MOVEMENT_LABEL, dateTime, qty } from "@/lib/format";
import MovementForm from "./MovementForm";

export const metadata: Metadata = { title: "Arrivages et pertes" };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  const { produit = "" } = await searchParams;
  const [{ data: products }, { data: cats }, { data: moves }] = await Promise.all([
    supabase.from("products").select("id, name, unit, stock, category_id").eq("is_active", true).eq("kind", "simple").order("name"),
    supabase.from("categories").select("id, name"),
    supabase
      .from("stock_movements")
      .select("id, delta, reason, note, created_at, products(id, name, unit), profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const list = (products ?? []).map((p) => ({ id: p.id, name: p.name, unit: p.unit, stock: Number(p.stock), rayon: catName.get(p.category_id) ?? "" }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Arrivages et pertes</h1>
        <p className="mt-1 text-sm text-mute">Chaque entrée ou sortie de marchandise est enregistrée avec votre nom. Les ventes se retirent toutes seules.</p>
      </header>
      <MovementForm products={list} initialProduct={list.some((p) => p.id === produit) ? produit : ""} />

      <section className="card p-5">
        <h2 className="font-display text-lg font-extrabold">Journal du stock</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {(moves ?? []).map((m) => {
            const p = m.products as unknown as { id: string; name: string; unit: string } | null;
            const who = (m.profiles as unknown as { full_name: string } | null)?.full_name;
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0">
                  {p ? <Link href={`/gestion/produits/${p.id}`} className="font-medium hover:text-red">{p.name}</Link> : "Produit supprimé"}
                  <span className="text-mute"> · {MOVEMENT_LABEL[m.reason] ?? m.reason}{m.note ? ` · ${m.note}` : ""}</span>
                  <span className="block text-xs text-mute">{dateTime(m.created_at)}{who ? ` · ${who}` : ""}</span>
                </span>
                <span className={`font-semibold tabular ${Number(m.delta) < 0 ? "text-red" : "text-leaf"}`}>
                  {Number(m.delta) > 0 ? "+" : ""}{qty(m.delta, p?.unit ?? "piece")}
                </span>
              </li>
            );
          })}
          {!moves?.length && <li className="py-6 text-center text-mute">Aucun mouvement pour l&apos;instant.</li>}
        </ul>
      </section>
    </div>
  );
}
