import Image from "next/image";
import Link from "next/link";
import { getCategories, getHighlights, getSettings, getZones } from "@/lib/shop";
import { fcfa } from "@/lib/format";
import ProductCard from "@/components/shop/ProductCard";
import { RAYON_STYLE } from "@/components/shop/ProductThumb";
import { IconArrow, IconPhone, IconTruck, IconWallet, IconWhatsapp } from "@/components/icons";

export const revalidate = 60;

const STEPS = [
  { Icon: IconPhone, title: "Remplissez votre panier", text: "Choisissez vos produits sur le site, à la pièce ou au kilo." },
  { Icon: IconWallet, title: "Payez par Wave ou Orange Money", text: "Vous recevez le montant exact et le numéro marchand Ô Bon Prix." },
  { Icon: IconTruck, title: "On vous livre", text: "Partout à Dakar, par notre livreur ou par Yango." },
];

export default async function Home() {
  const [categories, highlights, zones, settings] = await Promise.all([getCategories(), getHighlights(10), getZones(), getSettings()]);
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]));
  const minFee = zones.length ? Math.min(...zones.map((z) => z.price)) : 1000;
  const wa = settings?.whatsapp ?? "221787378290";

  return (
    <main>
      {/* Accueil : la promesse et l'égérie au panier */}
      <section className="bg-[#f6f4fc]">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-8 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-4">
          <div className="space-y-5 py-4 md:py-12">
            <p className="pill bg-sun text-ink">Supérette en ligne à Dakar</p>
            <h1 className="font-display text-4xl leading-[1.05] font-black text-ink sm:text-5xl lg:text-6xl">
              Vos courses, <span className="text-red">livrées</span> chez vous.
            </h1>
            <p className="max-w-md text-lg text-ink/75">
              Produits frais, épicerie, boissons et hygiène au bon prix. Payez par Wave ou Orange Money, livraison dès {fcfa(minFee)}.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={categories[0] ? `/rayons/${categories[0].slug}` : "/recherche"} className="btn-primary min-h-12 px-7 text-base">
                Faire mes courses <IconArrow className="size-4" />
              </Link>
              <a href={`https://wa.me/${wa}`} className="btn-ghost min-h-12 px-6 text-base">
                <IconWhatsapp className="size-5 text-[#1f9d55]" /> Commander sur WhatsApp
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <Image src="/egeries/panier.webp" alt="Une cliente Ô Bon Prix tenant un panier de courses" width={1100} height={863} priority sizes="(min-width: 768px) 50vw, 100vw" className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* Rayons */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Nos rayons</h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => {
            const s = RAYON_STYLE[c.slug];
            return (
              <li key={c.slug}>
                <Link href={`/rayons/${c.slug}`} className="flex h-full flex-col justify-between gap-6 rounded-[var(--radius-card)] p-4 transition-transform hover:-translate-y-0.5" style={{ background: s?.tint, color: s?.ink }}>
                  {s && <s.Icon className="size-8" />}
                  <span className="font-display text-base leading-tight font-extrabold">{c.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

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
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
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
