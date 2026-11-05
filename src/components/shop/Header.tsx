import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/shop";
import { IconSearch } from "@/components/icons";
import CartButton from "./CartButton";

export default function Header({ categories }: { categories: Category[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6">
        <Link href="/" aria-label="Ô Bon Prix, accueil" className="shrink-0">
          <Image src="/brand/logo.png" alt="Ô Bon Prix Superette" width={112} height={52} priority className="h-11 w-auto sm:h-12" />
        </Link>
        <form action="/recherche" role="search" className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-mute" />
          <input type="search" name="q" placeholder="Rechercher…" aria-label="Rechercher un produit" className="field rounded-xl bg-cream pl-10" />
        </form>
        <CartButton />
      </div>
      <nav aria-label="Rayons" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
        <ul className="flex gap-1 pb-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/rayons/${c.slug}`} className="block whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-ink hover:bg-cream hover:text-red">{c.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
