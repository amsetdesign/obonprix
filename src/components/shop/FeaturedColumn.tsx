import Link from "next/link";
import { fcfa } from "@/lib/format";
import type { ShopProduct } from "@/lib/shop";
import AddToCart from "./AddToCart";
import ProductThumb from "./ProductThumb";

/** Bloc de gauche de l'accueil : produits prioritaires (volaille, charcuterie…) */
export default function FeaturedColumn({ products, rayonOf }: { products: ShopProduct[]; rayonOf: (p: ShopProduct) => string | undefined }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="prioritaires" className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      <h2 id="prioritaires" className="bg-red px-4 py-3 font-display text-base font-extrabold text-white">Volaille et charcuterie</h2>
      <ul className="flex gap-3 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:gap-0 lg:divide-y lg:divide-line lg:overflow-y-auto lg:p-0">
        {products.map((p) => {
          const price = p.promo_price ?? p.price;
          return (
            <li key={p.id} className="flex w-64 shrink-0 items-center gap-3 rounded-xl border border-line p-2.5 lg:w-auto lg:rounded-none lg:border-0 lg:px-3.5 lg:py-2.5">
              <Link href={`/produits/${p.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
                <ProductThumb name="" image={p.image_url} rayon={rayonOf(p)} sizes="56px" className="size-14 rounded-lg" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/produits/${p.slug}`} className="line-clamp-2 text-sm leading-snug font-medium hover:text-red">{p.name}</Link>
                <p className="text-sm tabular">
                  <strong className={p.promo_price != null ? "text-red" : ""}>{fcfa(price)}</strong>
                  {p.unit === "kg" && <span className="text-xs text-mute"> /kg</span>}
                </p>
              </div>
              <div className="flex shrink-0 justify-end">
                {p.in_stock ? (
                  <AddToCart variant="round" product={{ id: p.id, slug: p.slug, name: p.name, unit: p.unit, price, image_url: p.image_url }} />
                ) : (
                  <span className="block text-center text-xs text-mute">Épuisé</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
