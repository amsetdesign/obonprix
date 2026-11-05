import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/shop";
import { IconArrow } from "@/components/icons";

// Visuels des rayons : produits découpés de l'affiche officielle Ô Bon Prix (fond rouge de la marque)
const VISUALS = new Set(["produits-frais", "epicerie-salee", "epicerie-sucree", "surgeles", "boissons", "hygiene-entretien"]);
export const rayonImage = (slug: string) => (VISUALS.has(slug) ? `/rayons/${slug}.webp` : null);

export default function RayonCard({ c }: { c: Category }) {
  const img = rayonImage(c.slug);
  return (
    <Link href={`/rayons/${c.slug}`} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(27,23,22,0.35)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-red">
        {img && <Image src={img} alt="" fill sizes="(min-width: 1024px) 190px, 40vw" className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105 [mask-image:radial-gradient(ellipse_at_center,black_58%,transparent_78%)]" />}
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <span className="line-clamp-2 min-h-[2.5em] font-display text-[14px] leading-tight font-extrabold">{c.name}</span>
        <IconArrow className="size-4 shrink-0 text-red transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
