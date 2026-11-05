"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { confirmPending } from "@/lib/customer";

/** La commande est enregistrée : elle rejoint l'historique du téléphone et le panier est vidé */
export default function ClearCart({ number, total }: { number: string; total: number }) {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    confirmPending(number, total);
    clear();
  }, [ready, clear, number, total]);
  return null;
}
