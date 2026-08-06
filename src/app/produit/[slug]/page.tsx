import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { getCategories, getProducts } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { formatFcfa } from "@/lib/whatsapp";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const product = products.find((p) => p.slug === slug);

  if (!product) notFound();

  const category = categories.find((c) => c.slug === product.category);
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 5);

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(100 - (product.price / product.oldPrice) * 100)
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
        <Link href="/" className="hover:text-brand-red-600">
          Accueil
        </Link>
        <ChevronRight size={14} />
        {category && (
          <>
            <Link href={`/categorie/${category.slug}`} className="hover:text-brand-red-600">
              {category.name}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-stone-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center rounded-3xl bg-surface-muted text-[9rem]">
          {discount && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-red-500 px-3 py-1.5 text-sm font-bold text-white">
              -{discount}%
            </span>
          )}
          {product.badge && !discount && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-gold-400 px-3 py-1.5 text-sm font-bold text-brand-red-900">
              {product.badge}
            </span>
          )}
          {product.emoji}
        </div>

        <div className="flex flex-col">
          {category && (
            <Link
              href={`/categorie/${category.slug}`}
              className="w-fit text-sm font-semibold uppercase tracking-wide text-brand-red-500 hover:underline"
            >
              {category.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-3xl font-extrabold text-stone-900">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-stone-400">{product.unit}</p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-brand-red-600">
              {formatFcfa(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-stone-400 line-through">
                {formatFcfa(product.oldPrice)}
              </span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-stone-600">{product.description}</p>

          <div className="mt-8">
            <ProductDetailActions product={product} />
          </div>

          <div className="mt-8 grid gap-3 border-t border-border-subtle pt-6 sm:grid-cols-2">
            <div className="flex items-start gap-2 text-sm text-stone-600">
              <Truck size={18} className="mt-0.5 shrink-0 text-brand-red-500" />
              Livraison rapide à Dakar et environs
            </div>
            <div className="flex items-start gap-2 text-sm text-stone-600">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-red-500" />
              Produit garanti et vérifié en boutique
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 font-display text-2xl font-extrabold text-stone-900">
            Vous pourriez aussi aimer
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
