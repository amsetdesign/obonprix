"use client";

import { useTransition } from "react";
import { setProductSupplier } from "./actions";

/** Choisir le fournisseur d'un produit directement dans la liste */
export default function SupplierSelect({ productId, options }: { productId: string; options: { id: number; name: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue=""
      disabled={pending}
      onChange={(e) => { const v = e.target.value; start(() => setProductSupplier(productId, v ? Number(v) : null)); }}
      className="field w-auto py-1.5 text-sm"
      aria-label="Fournisseur"
    >
      <option value="">Fournisseur…</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}
