"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/lib/products-context";
import { buildWhatsAppLink, buildWhatsAppOrderMessage, formatFcfa } from "@/lib/whatsapp";
import type { CartLine, Product } from "@/lib/types";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, isReady } = useCart();
  const { products } = useProducts();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const items = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? { line, product } : null;
    })
    .filter((v): v is { line: CartLine; product: Product } => v !== null);

  const total = items.reduce((sum, { line, product }) => sum + line.quantity * product.price, 0);

  const handleOrder = () => {
    const nameAndAddress = [name, address].filter(Boolean).join(" — ");
    const message = buildWhatsAppOrderMessage(lines, products, nameAndAddress || undefined);
    window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");
  };

  if (!isReady) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 flex items-center gap-2 font-display text-3xl font-extrabold text-stone-900">
        <ShoppingBag /> Mon panier
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border-subtle py-20 text-center">
          <span className="text-5xl">🛒</span>
          <p className="text-stone-500">Votre panier est vide pour le moment.</p>
          <Link
            href="/catalogue"
            className="rounded-full bg-brand-red-500 px-6 py-3 font-semibold text-white hover:bg-brand-red-600"
          >
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="flex flex-col gap-4">
              {items.map(({ line, product }) => (
                <li
                  key={product.id}
                  className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-4"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-3xl">
                    {product.emoji}
                  </div>
                  <div className="flex-1">
                    <Link href={`/produit/${product.slug}`} className="font-semibold hover:text-brand-red-600">
                      {product.name}
                    </Link>
                    <p className="text-xs text-stone-400">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border-subtle px-2 py-1">
                    <button
                      onClick={() => updateQuantity(product.id, line.quantity - 1)}
                      className="text-stone-500 hover:text-brand-red-600"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, line.quantity + 1)}
                      className="text-stone-500 hover:text-brand-red-600"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="w-24 shrink-0 text-right font-bold text-brand-red-600">
                    {formatFcfa(product.price * line.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label="Retirer l'article"
                    className="text-stone-400 hover:text-brand-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-fit rounded-2xl border border-border-subtle bg-surface p-6">
            <h2 className="font-display text-lg font-bold">Récapitulatif</h2>
            <div className="mt-4 flex justify-between text-sm text-stone-500">
              <span>Sous-total</span>
              <span>{formatFcfa(total)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-stone-500">
              <span>Livraison</span>
              <span>À confirmer</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-border-subtle pt-3 font-display text-xl font-bold text-brand-red-600">
              <span>Total</span>
              <span>{formatFcfa(total)}</span>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom (optionnel)"
                className="rounded-full border border-border-subtle px-4 py-2.5 text-sm outline-none focus:border-brand-red-400"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse de livraison (optionnel)"
                className="rounded-full border border-border-subtle px-4 py-2.5 text-sm outline-none focus:border-brand-red-400"
              />
            </div>

            <button
              onClick={handleOrder}
              className="mt-5 w-full rounded-full bg-brand-green-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-green-500/25 transition hover:brightness-95"
            >
              Commander via WhatsApp
            </button>
            <p className="mt-3 text-center text-xs text-stone-400">
              Vous serez redirigé vers WhatsApp avec votre commande pré-remplie. Le prix final
              et le délai de livraison seront confirmés par notre équipe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
