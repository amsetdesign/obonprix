"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export function ProductDetailActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex w-fit items-center gap-3 rounded-full border border-border-subtle px-3 py-2">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="text-stone-500 hover:text-brand-red-600"
          aria-label="Diminuer la quantité"
        >
          <Minus size={16} />
        </button>
        <span className="w-6 text-center font-semibold">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="text-stone-500 hover:text-brand-red-600"
          aria-label="Augmenter la quantité"
        >
          <Plus size={16} />
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={!product.inStock}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-red-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-red-500/30 transition hover:bg-brand-red-600 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        <ShoppingCart size={18} />
        {!product.inStock ? "Rupture de stock" : added ? "Ajouté au panier !" : "Ajouter au panier"}
      </button>
    </div>
  );
}
