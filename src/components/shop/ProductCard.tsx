import Link from "next/link";
import { fcfa } from "@/lib/format";
import type { ShopProduct } from "@/lib/shop";
import AddToCart from "./AddToCart";
import ProductThumb from "./ProductThumb";

export default function ProductCard({ p, rayon }: { p: ShopProduct; rayon?: string }) {
  const price = p.promo_price ?? p.price;
  const per = p.unit === "kg" ? " /kg" : "";
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      <Link href={`/produits/${p.slug}`} className="relative block" tabIndex={-1} aria-hidden>
        <ProductThumb name={p.name} image={p.image_url} rayon={rayon} sizes="(min-width: 1024px) 220px, 45vw" className="aspect-square" />
        {p.promo_price != null && <span className="pill absolute top-2 left-2 bg-sun text-ink">Promo</span>}
        {!p.in_stock && <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-xs font-semibold text-white">Épuisé</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-medium leading-snug">
          <Link href={`/produits/${p.slug}`} className="hover:text-red">{p.name}</Link>
        </h3>
        <p className="mt-auto tabular">
          <span className={`font-display text-lg font-extrabold ${p.promo_price != null ? "text-red" : ""}`}>{fcfa(price)}</span>
          <span className="text-xs text-mute">{per}</span>
          {p.promo_price != null && <span className="ml-1.5 text-xs text-mute line-through">{fcfa(p.price)}</span>}
        </p>
        {p.in_stock ? (
          <AddToCart product={{ id: p.id, slug: p.slug, name: p.name, unit: p.unit, price, image_url: p.image_url }} />
        ) : (
          <p className="flex min-h-10 items-center justify-center rounded-xl bg-cream text-sm text-mute">Bientôt de retour</p>
        )}
      </div>
    </article>
  );
}
