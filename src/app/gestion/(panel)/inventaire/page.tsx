import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import CountList from "./CountList";

export const metadata: Metadata = { title: "Inventaire" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ rayon?: string }> }) {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  const { data: cats } = await supabase.from("categories").select("id, slug, name").order("position");
  const { rayon } = await searchParams;
  const cat = (cats ?? []).find((c) => c.slug === rayon) ?? cats?.[0];
  const { data: products } = cat
    ? await supabase.from("products").select("id, name, unit, stock").eq("category_id", cat.id).eq("is_active", true).order("name")
    : { data: [] };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Inventaire</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Comptez les produits rayon par rayon et saisissez la quantité réelle. L&apos;écart avec le stock enregistré est noté dans le journal, à votre nom.
        </p>
      </header>
      <nav aria-label="Rayons" className="flex flex-wrap gap-2">
        {(cats ?? []).map((c) => (
          <Link key={c.slug} href={`/gestion/inventaire?rayon=${c.slug}`} aria-current={c.id === cat?.id ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${c.id === cat?.id ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink/30"}`}>
            {c.name}
          </Link>
        ))}
      </nav>
      <CountList key={cat?.id} products={(products ?? []).map((p) => ({ ...p, stock: Number(p.stock) }))} />
    </div>
  );
}
