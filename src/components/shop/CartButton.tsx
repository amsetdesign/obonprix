"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import { IconCart } from "@/components/icons";

export default function CartButton() {
  const { count, subtotal, ready } = useCart();
  const n = ready ? count : 0;
  return (
    <Link href="/panier" className="relative flex min-h-11 items-center gap-2 rounded-xl bg-red px-3.5 text-white hover:bg-red-700" aria-label={`Panier : ${n} article${n > 1 ? "s" : ""}`}>
      <IconCart className="size-5" />
      <span className="hidden text-sm font-semibold tabular sm:inline">{n ? fcfa(subtotal) : "Panier"}</span>
      {n > 0 && <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-sun text-[11px] font-bold text-ink tabular">{n > 99 ? "99" : n}</span>}
    </Link>
  );
}
