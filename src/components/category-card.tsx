import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categorie/${category.slug}`}
      className={`group flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-gradient-to-b ${category.gradient} px-4 py-5 text-center transition hover:-translate-y-1 hover:shadow-md`}
    >
      <span className="text-4xl transition-transform group-hover:scale-110">{category.emoji}</span>
      <span className="text-xs font-semibold text-stone-700 sm:text-sm">{category.name}</span>
    </Link>
  );
}
