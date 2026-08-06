"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useProducts } from "@/lib/products-context";
import { ProductCard } from "@/components/product-card";

export function CatalogueBrowser({ lockedCategory }: { lockedCategory?: string }) {
  const { products, categories } = useProducts();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | "all">(lockedCategory ?? "all");
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc">("default");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products;

    if (lockedCategory) {
      list = list.filter((p) => p.category === lockedCategory);
    } else if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, lockedCategory, activeCategory, query, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-red-400 focus:ring-2 focus:ring-brand-red-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-red-400"
          >
            <option value="default">Trier : pertinence</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
          {!lockedCategory && (
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-medium sm:hidden"
            >
              <SlidersHorizontal size={16} /> Filtres
            </button>
          )}
        </div>
      </div>

      {!lockedCategory && (
        <div
          className={`mb-6 flex-wrap gap-2 sm:flex ${filtersOpen ? "flex" : "hidden"}`}
        >
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeCategory === "all"
                ? "border-brand-red-500 bg-brand-red-500 text-white"
                : "border-border-subtle bg-surface text-stone-600 hover:border-brand-red-300"
            }`}
          >
            Toutes catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeCategory === cat.slug
                  ? "border-brand-red-500 bg-brand-red-500 text-white"
                  : "border-border-subtle bg-surface text-stone-600 hover:border-brand-red-300"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}

      {query && (
        <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
          <span>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} pour « {query} »
          </span>
          <button
            onClick={() => setQuery("")}
            className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs hover:bg-border-subtle"
          >
            <X size={12} /> effacer
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-subtle py-16 text-center text-stone-500">
          <span className="text-4xl">🔍</span>
          <p>Aucun produit trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
