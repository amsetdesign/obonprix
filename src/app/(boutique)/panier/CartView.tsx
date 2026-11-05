"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useCart, lineTotal } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import AddToCart from "@/components/shop/AddToCart";
import { IconArrow, IconTrash } from "@/components/icons";

export default function CartView() {
  const { lines, subtotal, remove, ready } = useCart();
  const [notice, setNotice] = useState("");
  // message laissé par « Commander à nouveau » (produits devenus indisponibles)
  useEffect(() => {
    try {
      const n = sessionStorage.getItem("obp-avis-panier");
      if (n) { sessionStorage.removeItem("obp-avis-panier"); setNotice(n); } // eslint-disable-line react-hooks/set-state-in-effect
    } catch { /* sans conséquence */ }
  }, []);
  if (!ready) return <p className="mt-6 text-mute">Chargement du panier…</p>;
  if (!lines.length) {
    return (
      <div className="mt-8 flex flex-col items-center gap-5 rounded-[var(--radius-card)] bg-white p-8 text-center ring-1 ring-line sm:flex-row sm:text-left">
        <Image src="/egeries/detoure/presente.webp" alt="" width={180} height={255} className="h-auto w-36" />
        <div className="space-y-3">
          <p className="font-display text-xl font-extrabold">Votre panier est vide</p>
          <p className="text-mute">Parcourez nos rayons : produits frais, épicerie, boissons, hygiène.</p>
          <Link href="/" className="btn-primary">Commencer mes courses</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
      {notice && <p role="status" className="rounded-xl bg-sun-100 px-4 py-3 text-sm lg:col-span-2">{notice}</p>}
      <ul className="card divide-y divide-line">
        {lines.map((l) => (
          <li key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 p-4 sm:grid-cols-[1fr_150px_100px_auto]">
            <div className="min-w-0">
              <Link href={`/produits/${l.slug}`} className="font-medium hover:text-red">{l.name}</Link>
              <p className="text-sm text-mute tabular">{fcfa(l.price)}{l.unit === "kg" ? " le kg" : " l'unité"}</p>
            </div>
            <p className="text-right font-semibold tabular sm:order-3">{fcfa(lineTotal(l))}</p>
            <div className="sm:order-2"><AddToCart product={l} /></div>
            <button type="button" onClick={() => remove(l.id)} className="justify-self-end rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red sm:order-4" aria-label={`Retirer ${l.name}`}>
              <IconTrash className="size-5" />
            </button>
          </li>
        ))}
      </ul>
      <aside className="card h-fit space-y-4 p-5">
        <div className="flex justify-between text-lg"><span>Sous-total</span><strong className="tabular">{fcfa(subtotal)}</strong></div>
        <p className="text-sm text-mute">Les frais de livraison dépendent de votre quartier (à partir de 1 000 F). Les produits au kilo sont pesés à la préparation.</p>
        <Link href="/commande" className="btn-primary min-h-12 w-full text-base">Commander <IconArrow className="size-4" /></Link>
        <Link href="/" className="block text-center text-sm text-mute hover:text-red">Continuer mes courses</Link>
      </aside>
    </div>
  );
}
