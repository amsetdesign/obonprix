"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/lib/products-context";
import { formatFcfa } from "@/lib/whatsapp";
import type { CartLine, Product } from "@/lib/types";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lines, updateQuantity, removeItem } = useCart();
  const { products } = useProducts();

  const items = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? { line, product } : null;
    })
    .filter((v): v is { line: CartLine; product: Product } => v !== null);

  const total = items.reduce((sum, { line, product }) => sum + line.quantity * product.price, 0);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-brand-red-600">
            <ShoppingBag size={20} /> Mon panier
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer le panier"
            className="rounded-full p-2 text-stone-500 hover:bg-surface-muted"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-stone-500">
              <ShoppingBag size={40} className="text-stone-300" />
              <p>Votre panier est vide.</p>
              <button
                onClick={onClose}
                className="rounded-full bg-brand-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-red-600"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map(({ line, product }) => (
                <li key={product.id} className="flex gap-3 border-b border-border-subtle pb-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-2xl">
                    {product.emoji}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-semibold leading-snug">{product.name}</p>
                    <p className="text-xs text-stone-500">{product.unit}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-border-subtle px-2 py-1">
                        <button
                          onClick={() => updateQuantity(product.id, line.quantity - 1)}
                          className="text-stone-500 hover:text-brand-red-600"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, line.quantity + 1)}
                          className="text-stone-500 hover:text-brand-red-600"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-brand-red-600">
                        {formatFcfa(product.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label="Retirer l'article"
                    className="h-fit text-stone-400 hover:text-brand-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border-subtle px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600">Total</span>
              <span className="font-display text-xl font-bold text-brand-red-600">
                {formatFcfa(total)}
              </span>
            </div>
            <Link
              href="/panier"
              onClick={onClose}
              className="block w-full rounded-full bg-brand-red-500 py-3 text-center font-semibold text-white shadow-lg shadow-brand-red-500/30 transition hover:bg-brand-red-600"
            >
              Voir le panier & commander
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
