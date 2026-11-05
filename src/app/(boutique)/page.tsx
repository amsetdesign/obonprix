import Image from "next/image";
import Link from "next/link";
import { getCategories, getFeatured, getHighlights, getPromoCount, getZones } from "@/lib/shop";
import { fcfa } from "@/lib/format";
import FeaturedColumn from "@/components/shop/FeaturedColumn";
import HeroSlider from "@/components/shop/HeroSlider";
import ProductCard from "@/components/shop/ProductCard";
import { RAYON_STYLE } from "@/components/shop/ProductThumb";
import { IconArrow, IconPhone, IconTruck, IconWallet } from "@/components/icons";

export const revalidate = 60;

const STEPS = [
  { Icon: IconPhone, title: "Remplissez votre panier", text: "Choisissez vos produits sur le site, à la pièce ou au kilo." },
  { Icon: IconWallet, title: "Payez par Wave ou Orange Money", text: "Vous recevez le montant exact et le numéro marchand Ô Bon Prix." },
  { Icon: IconTruck, title: "On vous livre", text: "Partout à Dakar, par notre livreur ou par Yango." },
];

export default async function Home() {
  const [categories, highlights, zones, featured, promoCount] = await Promise.all([getCategories(), getHighlights(10), getZones(), getFeatured(8), getPromoCount()]);
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]));
  const minFee = zones.length ? Math.min(...zones.map((z) => z.price)) : 1000;

  return (
    <main>
      {/* Haut de page : produits prioritaires (bloc 1), diaporama (bloc 2), rayons (bloc 3) */}
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-4 sm:px-6">
        <div className={`grid gap-4 lg:h-[360px] ${featured.length ? "lg:grid-cols-[300px_1fr]" : ""}`}>
          {featured.length > 0 && (
            <div className="order-2 min-h-0 lg:order-1">
              <FeaturedColumn products={featured} rayonOf={(p) => catSlug.get(p.category_id ?? 0)} />
            </div>
          )}
          <div className="order-1 aspect-[2/1] lg:order-2 lg:aspect-auto lg:h-full">
            <HeroSlider minFee={fcfa(minFee)} promoCount={promoCount} />
          </div>
        </div>

        <h1 className="sr-only">Ô Bon Prix, supérette en ligne à Dakar : vos courses livrées chez vous</h1>
        <nav id="rayons" aria-label="Nos rayons" className="scroll-mt-32">
          <ul className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible">
            {categories.map((c) => {
              const s = RAYON_STYLE[c.slug];
              return (
                <li key={c.slug} className="w-36 shrink-0 lg:w-auto">
                  <Link href={`/rayons/${c.slug}`} className="group flex h-full flex-col justify-between gap-5 rounded-[var(--radius-card)] p-4 transition-transform hover:-translate-y-0.5" style={{ background: s?.tint, color: s?.ink }}>
                    <span className="flex items-start justify-between">
                      {s && <s.Icon className="size-8" />}
                      <IconArrow className="size-4 opacity-50 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="font-display text-[15px] leading-tight font-extrabold">{c.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Sélection du moment */}
      {highlights.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">En ce moment</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {highlights.map((p) => <ProductCard key={p.id} p={p} rayon={catSlug.get(p.category_id ?? 0)} />)}
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center overflow-hidden rounded-[28px] bg-red text-white md:grid-cols-[1fr_0.8fr]">
          <div className="space-y-6 p-7 sm:p-10">
            <h2 className="font-display text-3xl font-black sm:text-4xl">Commander, c&apos;est simple</h2>
            <ol className="space-y-5">
              {STEPS.map(({ Icon, title, text }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sun text-ink"><Icon className="size-5" /></span>
                  <span>
                    <span className="block font-display text-lg font-extrabold">{i + 1}. {title}</span>
                    <span className="text-white/85">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="self-stretch bg-white">
            <Image src="/egeries/telephone.webp" alt="Une cliente commande sur son téléphone" width={1100} height={828} sizes="(min-width: 768px) 40vw, 100vw" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Livraison */}
      <section id="livraison" className="mx-auto max-w-6xl scroll-mt-32 px-4 pt-14 sm:px-6">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Livraison partout à Dakar</h2>
        <p className="mt-1 text-mute">Depuis HLM Patte d&apos;Oie. Le prix dépend de votre quartier.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z) => (
            <li key={z.id} className="card p-5">
              <p className="font-display text-2xl font-black text-red tabular">{fcfa(z.price)}</p>
              <p className="mt-1 text-sm font-semibold">{z.name}</p>
              <p className="mt-2 text-sm text-mute">{z.areas.join(", ")}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-sun-100 px-4 py-3 text-sm">Ailleurs, ou si vous préférez : livraison <strong>Yango</strong>, la course est payée directement au livreur.</p>
      </section>
    </main>
  );
}
