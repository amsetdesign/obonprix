"use client";

import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { formatFcfa } from "@/lib/whatsapp";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(100 - (product.price / product.oldPrice) * 100)
      : null;

  const handleAdd = () => {
    addItem(product.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <Link href={`/produit/${product.slug}`} className="flex flex-col">
        <div className="relative flex aspect-square items-center justify-center bg-surface-muted text-6xl">
          {(product.badge || discount) && (
            <span className="absolute left-2 top-2 rounded-full bg-brand-red-500 px-2.5 py-1 text-[11px] font-bold text-white">
              {discount ? `-${discount}%` : product.badge}
            </span>
          )}
          <span className="transition-transform duration-300 group-hover:scale-110">
            {product.emoji}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-stone-800">
            {product.name}
          </p>
          <p className="text-xs text-stone-400">{product.unit}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-base font-bold text-brand-red-600">
              {formatFcfa(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-stone-400 line-through">
                {formatFcfa(product.oldPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={handleAdd}
        disabled={!product.inStock}
        className="m-3 mt-0 flex items-center justify-center gap-1.5 rounded-full bg-brand-red-500 py-2 text-sm font-semibold text-white transition hover:bg-brand-red-600 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {!product.inStock ? (
          "Rupture de stock"
        ) : justAdded ? (
          <>
            <Check size={16} /> Ajouté
          </>
        ) : (
          <>
            <Plus size={16} /> Ajouter
          </>
        )}
      </button>
    </div>
  );
}
