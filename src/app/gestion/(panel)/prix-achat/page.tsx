import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import CostList from "./CostList";

export const metadata: Metadata = { title: "Prix d'achat" };

export default async function CostsPage({ searchParams }: { searchParams: Promise<{ rayon?: string }> }) {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  const { data: cats } = await supabase.from("categories").select("id, slug, name").order("position");
  const { rayon } = await searchParams;
  const cat = (cats ?? []).find((c) => c.slug === rayon) ?? cats?.[0];
  const [{ data: products }, { data: costs }] = await Promise.all([
    cat ? supabase.from("products").select("id, name, unit, price, promo_price").eq("category_id", cat.id).eq("is_active", true).eq("kind", "simple").order("name") : Promise.resolve({ data: [] }),
    supabase.from("product_costs").select("product_id, cost_price"),
  ]);
  const costBy = new Map((costs ?? []).map((c) => [c.product_id, c.cost_price as number]));
  const rows = (products ?? []).map((p) => ({ ...p, cost_price: costBy.get(p.id) ?? null }));
  const missing = rows.filter((r) => r.cost_price == null).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Prix d&apos;achat</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Saisissez ce que vous payez chaque produit au fournisseur. Le bénéfice de chaque vente est calculé avec le prix d&apos;achat du jour de la vente.
          Ces prix ne sont visibles que par le gérant et la gestion du stock.
        </p>
      </header>
      <nav aria-label="Rayons" className="flex flex-wrap gap-2">
        {(cats ?? []).map((c) => (
          <Link key={c.slug} href={`/gestion/prix-achat?rayon=${c.slug}`} aria-current={c.id === cat?.id ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${c.id === cat?.id ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink/30"}`}>
            {c.name}
          </Link>
        ))}
      </nav>
      {missing > 0 && <p className="rounded-xl bg-sun-100 px-4 py-2.5 text-sm">{missing} produit{missing > 1 ? "s" : ""} sans prix d&apos;achat dans ce rayon : leur bénéfice ne peut pas être calculé.</p>}
      <CostList key={cat?.id} rows={rows} />
    </div>
  );
}
