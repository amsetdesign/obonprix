"use client";

import { useCart, stepOf, type CartLine } from "@/lib/cart";
import { IconMinus, IconPlus } from "@/components/icons";

const fmtQty = (q: number, unit: string) => (unit === "kg" ? `${String(q).replace(".", ",")} kg` : String(q));

/** Bouton « Ajouter », puis − quantité + une fois le produit dans le panier */
export default function AddToCart({ product, large }: { product: Omit<CartLine, "qty">; large?: boolean }) {
  const { lines, add, setQty, ready } = useCart();
  const line = lines.find((l) => l.id === product.id);
  const h = large ? "min-h-12 text-base" : "min-h-10 text-sm";

  if (!ready || !line) {
    return (
      <button type="button" onClick={() => add(product)} disabled={!ready} className={`btn-primary w-full rounded-xl px-3 ${h}`} aria-label={`Ajouter ${product.name} au panier`}>
        <IconPlus className="size-4" /> Ajouter
      </button>
    );
  }
  const step = stepOf(product.unit);
  return (
    <div className={`flex w-full items-center justify-between rounded-xl bg-red text-white ${h}`}>
      <button type="button" onClick={() => setQty(product.id, line.qty - step)} className="flex h-full min-h-10 w-11 items-center justify-center rounded-l-xl hover:bg-red-700" aria-label={`Retirer ${product.unit === "kg" ? "un demi-kilo" : "un"}`}>
        <IconMinus className="size-4" />
      </button>
      <span className="font-semibold tabular" aria-live="polite">{fmtQty(line.qty, product.unit)}</span>
      <button type="button" onClick={() => setQty(product.id, line.qty + step)} className="flex h-full min-h-10 w-11 items-center justify-center rounded-r-xl hover:bg-red-700" aria-label={`Ajouter ${product.unit === "kg" ? "un demi-kilo" : "un"}`}>
        <IconPlus className="size-4" />
      </button>
    </div>
  );
}
