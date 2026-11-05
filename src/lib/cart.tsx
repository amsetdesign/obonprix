"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  id: string; slug: string; name: string; unit: "piece" | "kg";
  price: number; image_url: string; qty: number;
};

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (p: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const KEY = "obp-panier-v1";
const Ctx = createContext<CartCtx | null>(null);

/** Pas de vente : 1 pièce ou 0,5 kg */
export const stepOf = (unit: string) => (unit === "kg" ? 0.5 : 1);
const clampQty = (unit: string, q: number) => Math.min(unit === "kg" ? 50 : 99, Math.max(0, Math.round(q / stepOf(unit)) * stepOf(unit)));
export const lineTotal = (l: Pick<CartLine, "price" | "qty">) => Math.round(l.price * l.qty);

function readStored(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((l) => l && typeof l.id === "string" && Number(l.qty) > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // le panier est gardé dans le navigateur : relu une fois au chargement
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local après hydratation
    setLines(readStored());
    setReady(true);
    const sync = (e: StorageEvent) => { if (e.key === KEY) setLines(readStored()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* navigation privée : panier non conservé */ }
  }, [lines, ready]);

  const add = useCallback((p: Omit<CartLine, "qty">, qty?: number) => {
    setLines((ls) => {
      const q = qty ?? stepOf(p.unit);
      const found = ls.find((l) => l.id === p.id);
      if (found) return ls.map((l) => (l.id === p.id ? { ...l, ...p, qty: clampQty(p.unit, l.qty + q) } : l));
      return [...ls, { ...p, qty: clampQty(p.unit, q) }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines((ls) => ls.flatMap((l) => {
      if (l.id !== id) return [l];
      const q = clampQty(l.unit, qty);
      return q > 0 ? [{ ...l, qty: q }] : [];
    }));
  }, []);
  const remove = useCallback((id: string) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => ({
    lines, ready, add, setQty, remove, clear,
    count: lines.reduce((n, l) => n + (l.unit === "kg" ? 1 : l.qty), 0),
    subtotal: lines.reduce((n, l) => n + lineTotal(l), 0),
  }), [lines, ready, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart hors du CartProvider");
  return ctx;
}
