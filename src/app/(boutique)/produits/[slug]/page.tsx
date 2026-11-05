import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getProduct, getProductsByCategory } from "@/lib/shop";
import { fcfa } from "@/lib/format";
import AddToCart from "@/components/shop/AddToCart";
import ProductCard from "@/components/shop/ProductCard";
import ProductThumb from "@/components/shop/ProductThumb";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: `${p.name} à ${fcfa(p.promo_price ?? p.price)}${p.unit === "kg" ? " le kg" : ""}, livré à Dakar.` } : {};
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const cat = (await getCategories()).find((c) => c.id === p.category_id);
  const others = cat ? (await getProductsByCategory(cat.id)).filter((o) => o.id !== p.id && o.in_stock).slice(0, 5) : [];
  const price = p.promo_price ?? p.price;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Fil d'Ariane" className="text-sm text-mute">
        <Link href="/" className="hover:text-red">Accueil</Link>
        {cat && <> / <Link href={`/rayons/${cat.slug}`} className="hover:text-red">{cat.name}</Link></>}
      </nav>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <ProductThumb name={p.name} image={p.image_url} rayon={cat?.slug} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-square rounded-[var(--radius-card)] border border-line" />
        <div className="space-y-5">
          <h1 className="font-display text-3xl font-black leading-tight">{p.name}</h1>
          <p className="tabular">
            <span className={`font-display text-4xl font-black ${p.promo_price != null ? "text-red" : ""}`}>{fcfa(price)}</span>
            {p.unit === "kg" && <span className="text-mute"> le kilo</span>}
            {p.promo_price != null && <span className="ml-3 text-lg text-mute line-through">{fcfa(p.price)}</span>}
          </p>
          {p.unit === "kg" && <p className="text-sm text-mute">Vendu par demi-kilo. Le poids exact est pesé à la préparation.</p>}
          {p.description && <p className="whitespace-pre-line text-ink/80">{p.description}</p>}
          <div className="max-w-xs">
            {p.in_stock ? (
              <AddToCart large product={{ id: p.id, slug: p.slug, name: p.name, unit: p.unit, price, image_url: p.image_url }} />
            ) : (
              <p className="rounded-xl bg-cream px-4 py-3 text-mute">Épuisé pour le moment. Bientôt de retour.</p>
            )}
          </div>
          <Link href="/panier" className="inline-block text-sm font-semibold text-red underline-offset-4 hover:underline">Voir mon panier</Link>
        </div>
      </div>
      {others.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-extrabold">Dans le même rayon</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {others.map((o) => <ProductCard key={o.id} p={o} rayon={cat?.slug} />)}
          </div>
        </section>
      )}
    </main>
  );
}
