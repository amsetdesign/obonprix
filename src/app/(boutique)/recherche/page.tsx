import type { Metadata } from "next";
import { getCategories, searchProducts } from "@/lib/shop";
import ProductCard from "@/components/shop/ProductCard";

export const metadata: Metadata = { title: "Recherche", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [results, categories] = await Promise.all([searchProducts(q), getCategories()]);
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]));
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{q.trim() ? `Résultats pour « ${q.trim()} »` : "Rechercher un produit"}</h1>
      {q.trim().length >= 2 && <p className="mt-1 text-sm text-mute">{results.length} produit{results.length > 1 ? "s" : ""}</p>}
      {results.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {results.map((p) => <ProductCard key={p.id} p={p} rayon={catSlug.get(p.category_id ?? 0)} />)}
        </div>
      ) : q.trim().length >= 2 ? (
        <p className="mt-8 text-mute">Aucun produit trouvé. Essayez un autre mot, ou demandez-nous sur WhatsApp : nous l&apos;avons peut-être en réserve.</p>
      ) : (
        <p className="mt-4 text-mute">Tapez au moins deux lettres dans la barre de recherche.</p>
      )}
    </main>
  );
}
