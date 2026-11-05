"use client";

import { useCart, stepOf, type CartLine } from "@/lib/cart";
import { IconMinus, IconPlus } from "@/components/icons";

const fmtQty = (q: number, unit: string) => (unit === "kg" ? `${String(q).replace(".", ",")} kg` : String(q));

type Props = {
  product: Omit<CartLine, "qty">;
  /** « round » : petit bouton rond + (cartes produits) ; « full » : bouton large (fiche produit, panier) */
  variant?: "round" | "full";
  large?: boolean;
};

/** Ajouter au panier, puis − quantité + une fois le produit dans le panier */
export default function AddToCart({ product, variant = "full", large }: Props) {
  const { lines, add, setQty, ready } = useCart();
  const line = lines.find((l) => l.id === product.id);
  const round = variant === "round";
  const h = large ? "h-12 text-base" : round ? "h-10 text-sm" : "h-11 text-sm";

  if (!ready || !line) {
    return round ? (
      <button type="button" onClick={() => add(product)} disabled={!ready}
        className="flex size-10 items-center justify-center rounded-full bg-red text-white shadow-[0_4px_12px_-4px_rgba(209,20,27,0.6)] transition-transform hover:scale-105 hover:bg-red-700 disabled:opacity-60"
        aria-label={`Ajouter ${product.name} au panier`}>
        <IconPlus className="size-5" />
      </button>
    ) : (
      <button type="button" onClick={() => add(product)} disabled={!ready} className={`btn-primary w-full px-4 ${h}`} aria-label={`Ajouter ${product.name} au panier`}>
        <IconPlus className="size-4" /> Ajouter au panier
      </button>
    );
  }
  const step = stepOf(product.unit);
  const btn = round ? "w-9" : "w-11";
  return (
    <div className={`flex items-center justify-between rounded-full bg-red text-white ${h} ${round ? "w-full min-w-[104px]" : "w-full"}`}>
      <button type="button" onClick={() => setQty(product.id, line.qty - step)} className={`flex h-full ${btn} items-center justify-center rounded-l-full hover:bg-red-700`} aria-label={`Retirer ${product.unit === "kg" ? "un demi-kilo" : "un"}`}>
        <IconMinus className="size-4" />
      </button>
      <span className="font-semibold tabular" aria-live="polite">{fmtQty(line.qty, product.unit)}</span>
      <button type="button" onClick={() => setQty(product.id, line.qty + step)} className={`flex h-full ${btn} items-center justify-center rounded-r-full hover:bg-red-700`} aria-label={`Ajouter ${product.unit === "kg" ? "un demi-kilo" : "un"}`}>
        <IconPlus className="size-4" />
      </button>
    </div>
  );
}
