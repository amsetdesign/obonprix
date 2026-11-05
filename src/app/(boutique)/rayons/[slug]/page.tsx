import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProductsByCategory } from "@/lib/shop";
import ProductCard from "@/components/shop/ProductCard";
import { RAYON_STYLE } from "@/components/shop/ProductThumb";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return cat ? { title: cat.name, description: `${cat.name} livrés partout à Dakar. Paiement Wave ou Orange Money.` } : {};
}

export default async function RayonPage({ params }: { params: Params }) {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  const products = await getProductsByCategory(cat.id);
  const s = RAYON_STYLE[cat.slug];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex items-center gap-4 rounded-[var(--radius-card)] px-5 py-6" style={{ background: s?.tint, color: s?.ink }}>
        {s && <s.Icon className="size-10" />}
        <div>
          <h1 className="font-display text-3xl font-black">{cat.name}</h1>
          <p className="text-sm opacity-80">{products.length} produit{products.length > 1 ? "s" : ""}</p>
        </div>
      </header>
      {products.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => <ProductCard key={p.id} p={p} rayon={cat.slug} />)}
        </div>
      ) : (
        <p className="mt-10 text-center text-mute">Ce rayon se remplit bientôt.</p>
      )}
    </main>
  );
}
