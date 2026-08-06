import Link from "next/link";
import { ArrowRight, Percent, Sparkles } from "lucide-react";
import { getCategories, getProducts } from "@/lib/store";
import { Hero } from "@/components/hero";
import { CategoryCard } from "@/components/category-card";
import { ProductCard } from "@/components/product-card";

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const featured = products.filter((p) => p.featured);
  const promos = products.filter((p) => p.oldPrice);

  return (
    <div>
      <Hero />

      <div className="overflow-hidden border-y border-brand-gold-400/40 bg-brand-gold-400 py-2 text-brand-red-900">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm font-bold">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10">
              {[
                "🚚 Livraison rapide à Dakar",
                "💬 Commande simple sur WhatsApp",
                "🔥 Nouvelles promos chaque semaine",
                "✅ Produits garantis frais",
              ].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-stone-900 sm:text-3xl">
            Nos catégories
          </h2>
          <Link
            href="/catalogue"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-red-600 hover:underline sm:flex"
          >
            Tout voir <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {promos.length > 0 && (
        <section className="bg-brand-red-50/60 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center gap-2">
              <Percent size={22} className="text-brand-red-600" />
              <h2 className="font-display text-2xl font-extrabold text-stone-900 sm:text-3xl">
                Promotions du moment
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {promos.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles size={22} className="text-brand-gold-500" />
          <h2 className="font-display text-2xl font-extrabold text-stone-900 sm:text-3xl">
            Sélection du moment
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Commandez en ligne", desc: "Parcourez le catalogue et ajoutez vos produits au panier.", emoji: "🛒" },
            { title: "Envoyez sur WhatsApp", desc: "Validez votre commande, elle part directement sur WhatsApp.", emoji: "💬" },
            { title: "Récupérez ou livrez", desc: "On confirme le prix, le délai, et vous êtes servis.", emoji: "🚀" },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border-subtle bg-surface p-6 text-center"
            >
              <span className="text-4xl">{step.emoji}</span>
              <h3 className="mt-3 font-display text-lg font-bold text-stone-900">{step.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
