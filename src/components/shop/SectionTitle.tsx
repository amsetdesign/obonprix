import Link from "next/link";
import { IconArrow } from "@/components/icons";

/** Titre de section : petite étiquette, titre, lien « Voir tout » facultatif */
export default function SectionTitle({ eyebrow, title, href, linkLabel = "Voir tout", id }: { eyebrow?: string; title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.14em] text-red uppercase">{eyebrow}</p>}
        <h2 id={id} className="font-display text-2xl font-extrabold sm:text-[28px]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink hover:text-red">
          {linkLabel} <IconArrow className="size-4" />
        </Link>
      )}
    </div>
  );
}
