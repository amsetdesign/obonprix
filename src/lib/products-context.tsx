"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Category, Product } from "./types";

type ProductsContextValue = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({
  initialProducts,
  initialCategories,
  children,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
  children: React.ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  return (
    <ProductsContext.Provider value={{ products, categories, loading, refresh }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
