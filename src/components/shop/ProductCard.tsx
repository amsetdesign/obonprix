import Link from "next/link";
import { fcfa } from "@/lib/format";
import type { ShopProduct } from "@/lib/shop";
import AddToCart from "./AddToCart";
import ProductThumb from "./ProductThumb";

export default function ProductCard({ p, rayon }: { p: ShopProduct; rayon?: string }) {
  const price = p.promo_price ?? p.price;
  const off = p.promo_price != null ? Math.round((1 - p.promo_price / p.price) * 100) : 0;
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(27,23,22,0.28)] ${p.in_stock ? "" : "opacity-70"}`}>
      <Link href={`/produits/${p.slug}`} className="relative block" tabIndex={-1} aria-hidden>
        <ProductThumb name="" image={p.image_url} rayon={rayon} sizes="(min-width: 1024px) 220px, 45vw" className="aspect-[5/4] transition-transform duration-300 group-hover:scale-[1.03]" />
        {off > 0 && <span className="absolute top-2.5 left-2.5 rounded-md bg-sun px-2 py-0.5 text-xs font-extrabold text-ink tabular">-{off}%</span>}
        {!p.in_stock && <span className="absolute top-2.5 left-2.5 rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">Épuisé</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5em] text-[14px] leading-tight font-medium">
          <Link href={`/produits/${p.slug}`} className="after:absolute after:inset-0 hover:text-red">{p.name}</Link>
        </h3>
        <div className="relative z-10 mt-auto flex flex-wrap items-end justify-between gap-2">
          <p className="leading-none tabular">
            {p.promo_price != null && <span className="mb-1 block text-xs text-mute line-through">{fcfa(p.price)}</span>}
            <span className={`font-display text-[17px] font-extrabold ${p.promo_price != null ? "text-red" : ""}`}>{fcfa(price)}</span>
            {p.unit === "kg" && <span className="text-xs text-mute"> /kg</span>}
          </p>
          {p.in_stock && <AddToCart variant="round" product={{ id: p.id, slug: p.slug, name: p.name, unit: p.unit, price, image_url: p.image_url }} />}
        </div>
      </div>
    </article>
  );
}
