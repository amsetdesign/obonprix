import type { Metadata } from "next";
import { getCategories, getPromotions } from "@/lib/shop";
import ProductCard from "@/components/shop/ProductCard";

export const metadata: Metadata = { title: "Promotions", description: "Les promotions du moment chez Ô Bon Prix, livrées partout à Dakar." };
export const revalidate = 60;

export default async function PromotionsPage() {
  const [products, categories] = await Promise.all([getPromotions(), getCategories()]);
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]));
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="rounded-[var(--radius-card)] bg-sun px-5 py-6">
        <h1 className="font-display text-3xl font-black">Promotions</h1>
        <p className="text-sm text-ink/75">Prix barrés, dans la limite des stocks.</p>
      </header>
      {products.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => <ProductCard key={p.id} p={p} rayon={catSlug.get(p.category_id ?? 0)} />)}
        </div>
      ) : (
        <p className="mt-10 text-center text-mute">Pas de promotion en ce moment. Suivez notre chaîne WhatsApp pour être prévenu des prochaines.</p>
      )}
    </main>
  );
}
