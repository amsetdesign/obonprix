import type { Metadata } from "next";
import CartView from "./CartView";

export const metadata: Metadata = { title: "Mon panier", robots: { index: false } };

export default function CartPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-black">Mon panier</h1>
      <CartView />
    </main>
  );
}
