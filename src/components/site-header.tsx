"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/lib/products-context";
import { CartDrawer } from "./cart-drawer";

export function SiteHeader() {
  const { totalItems } = useCart();
  const { categories } = useProducts();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/catalogue?q=${encodeURIComponent(query.trim())}` : "/catalogue");
    setMenuOpen(false);
  };

  return (
    <>
      <div className="hidden bg-brand-red-700 text-white sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <p>Livraison rapide à Dakar &amp; environs • Commande confirmée sur WhatsApp</p>
          <a href="tel:+221787378290" className="flex items-center gap-1.5 font-medium hover:text-brand-gold-300">
            <Phone size={12} /> +221 78 737 82 90
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            className="rounded-lg p-2 text-stone-600 hover:bg-surface-muted lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Ô Bon Prix"
              width={140}
              height={70}
              className="h-10 w-auto object-contain sm:h-12"
              priority
            />
          </Link>

          <form onSubmit={handleSearch} className="relative mx-2 hidden flex-1 md:block">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit (riz, huile, lait...)"
              className="w-full rounded-full border border-border-subtle bg-surface-muted px-5 py-2.5 pr-11 text-sm outline-none transition focus:border-brand-red-400 focus:ring-2 focus:ring-brand-red-100"
            />
            <button
              type="submit"
              aria-label="Rechercher"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-red-500 p-2 text-white hover:bg-brand-red-600"
            >
              <Search size={16} />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/catalogue"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-surface-muted md:block"
            >
              Catalogue
            </Link>
            <a
              href="https://wa.me/221787378290"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-brand-green-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-95 sm:flex"
            >
              WhatsApp
            </a>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2.5 text-stone-700 hover:bg-surface-muted"
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold-400 px-1 text-[11px] font-bold text-brand-red-900">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="px-4 pb-3 md:hidden">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full rounded-full border border-border-subtle bg-surface-muted px-4 py-2.5 pr-11 text-sm outline-none focus:border-brand-red-400"
            />
            <button
              type="submit"
              aria-label="Rechercher"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-red-500 p-2 text-white"
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        <nav className="scrollbar-none hidden overflow-x-auto border-t border-border-subtle bg-surface-muted/60 lg:block">
          <div className="mx-auto flex max-w-7xl gap-1 px-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorie/${cat.slug}`}
                className="flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-stone-600 hover:text-brand-red-600"
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-border-subtle bg-surface px-4 py-3 lg:hidden">
            <ul className="flex flex-col gap-1">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categorie/${cat.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-surface-muted"
                  >
                    <span>{cat.emoji}</span> {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/catalogue"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-red-600 hover:bg-surface-muted"
                >
                  Voir tout le catalogue
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
