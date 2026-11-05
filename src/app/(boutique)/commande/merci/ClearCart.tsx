"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** La commande est enregistrée : le panier est vidé */
export default function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => { if (ready) clear(); }, [ready, clear]);
  return null;
}
