import Image from "next/image";
import { getActivePacks, getCategories, getFeatured, getHighlights, getPromoCount, getZones } from "@/lib/shop";
import { fcfa, offerEnds } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import FeaturedColumn from "@/components/shop/FeaturedColumn";
import HeroSlider from "@/components/shop/HeroSlider";
import ProductCard from "@/components/shop/ProductCard";
import Promises from "@/components/shop/Promises";
import RayonCard from "@/components/shop/RayonCard";
import SectionTitle from "@/components/shop/SectionTitle";
import { IconPin, IconWhatsapp } from "@/components/icons";

export const revalidate = 60;

const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBRecV6LwHtEGzSvL02";

const STEPS = [
  { title: "Remplissez votre panier", text: "Vos produits du quotidien, à la pièce ou au kilo." },
  { title: "Payez par Wave ou Orange Money", text: "Le montant exact et le numéro marchand s'affichent à la commande." },
  { title: "Recevez vos courses", text: "Partout à Dakar, par notre livreur ou par Yango." },
];

export default async function Home() {
  const [categories, highlights, zones, featured, promoCount, packs] = await Promise.all([getCategories(), getHighlights(10), getZones(), getFeatured(8), getPromoCount(), getActivePacks()]);
  const pack = packs[0];
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]));
  const minFee = fcfa(zones.length ? Math.min(...zones.map((z) => z.price)) : 1000);

  return (
    <main className="space-y-14 pb-4 sm:space-y-16">
      {/* Haut de page : produits prioritaires (bloc 1), diaporama (bloc 2), rayons (bloc 3) */}
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:px-6">
        <script
          type="application/ld+json"
          // données structurées : aide Google à afficher la boutique (horaires, zone, téléphone)
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "GroceryStore", name: "Ô Bon Prix", url: SITE_URL, logo: `${SITE_URL}/brand/logo.png`, image: `${SITE_URL}/opengraph-image.jpg`,
            telephone: "+221787378290", priceRange: "F CFA",
            address: { "@type": "PostalAddress", streetAddress: "HLM Patte d'Oie", addressLocality: "Dakar", addressCountry: "SN" },
            areaServed: { "@type": "City", name: "Dakar" },
            openingHoursSpecification: [
              { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "23:00" },
              { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "12:00", closes: "23:00" },
            ],
            paymentAccepted: "Wave, Orange Money, espèces",
            sameAs: ["https://www.facebook.com/obonprixsn", "https://www.instagram.com/o_bon_prix_sn", "https://www.tiktok.com/@o.bon.prix.sn"],
          }) }}
        />
        <h1 className="sr-only">Ô Bon Prix, supérette en ligne à Dakar : vos courses livrées chez vous</h1>
        <div className={`grid grid-cols-1 gap-4 lg:h-[380px] ${featured.length ? "lg:grid-cols-[300px_1fr]" : ""}`}>
          {featured.length > 0 && (
            <div className="order-2 min-h-0 min-w-0 lg:order-1">
              <FeaturedColumn products={featured} rayonOf={(p) => catSlug.get(p.category_id ?? 0)} />
            </div>
          )}
          <div className="order-1 aspect-[16/11] min-h-0 min-w-0 overflow-hidden rounded-[20px] sm:aspect-[2.4/1] lg:order-2 lg:aspect-auto lg:h-full">
            <HeroSlider
              minFee={minFee}
              promoCount={promoCount}
              pack={pack ? { id: pack.id, slug: pack.slug, name: pack.name, price: pack.promo_price ?? pack.price, value: pack.value, in_stock: pack.in_stock, image_url: pack.image_url, items: pack.items, endsLabel: offerEnds(pack.sale_ends_at) } : null}
            />
          </div>
        </div>

        <nav id="rayons" aria-label="Nos rayons" className="scroll-mt-32">
          <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-6 lg:overflow-visible">
            {categories.map((c) => (
              <li key={c.slug} className="w-44 shrink-0 snap-start lg:w-auto"><RayonCard c={c} /></li>
            ))}
          </ul>
        </nav>

        <Promises minFee={minFee} />
      </div>

      {/* Sélection du moment */}
      {highlights.length > 0 && (
        <section aria-labelledby="moment" className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle id="moment" eyebrow="Sélection" title="En ce moment" href={promoCount > 0 ? "/promotions" : undefined} linkLabel="Toutes les promos" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {highlights.map((p) => <ProductCard key={p.id} p={p} rayon={catSlug.get(p.category_id ?? 0)} />)}
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section aria-labelledby="comment" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-[28px] bg-[radial-gradient(120%_120%_at_10%_10%,#e8242b_0%,#d1141b_50%,#a80f15_100%)] text-white md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-bold tracking-[0.14em] text-sun uppercase">Comment ça marche</p>
            <h2 id="comment" className="mt-2 font-display text-3xl font-black sm:text-4xl">Vos courses en trois gestes</h2>
            <ol className="mt-8 space-y-6">
              {STEPS.map(({ title, text }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="font-display text-4xl leading-none font-black text-sun tabular">{i + 1}</span>
                  <span>
                    <span className="block font-display text-lg font-extrabold">{title}</span>
                    <span className="text-white/80">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative min-h-80 overflow-hidden">
            <div className="absolute -bottom-[30%] left-1/2 aspect-square w-[90%] -translate-x-1/2 rounded-full bg-sun" aria-hidden />
            <Image src="/egeries/detoure/commande.webp" alt="Une cliente Ô Bon Prix passe commande sur son téléphone" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-contain object-bottom pt-6" />
          </div>
        </div>
      </section>

      {/* Livraison */}
      <section id="livraison" aria-labelledby="livraison-titre" className="mx-auto max-w-6xl scroll-mt-32 px-4 sm:px-6">
        <SectionTitle id="livraison-titre" eyebrow="Livraison" title="Partout à Dakar" />
        <p className="mt-2 flex items-center gap-1.5 text-mute"><IconPin className="size-4 text-red" /> Départ HLM Patte d&apos;Oie. Le prix dépend de votre quartier.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z) => (
            <li key={z.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold">{z.name}</p>
                <p className="font-display text-xl font-black text-red tabular">{fcfa(z.price)}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mute">{z.areas.join(" · ")}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-2xl bg-sun-100 px-5 py-4 text-sm">
          <strong>Hors de ces quartiers ?</strong> Choisissez la livraison Yango à la commande : la course est payée directement au livreur.
        </p>
      </section>

      {/* Chaîne WhatsApp */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center overflow-hidden rounded-[28px] bg-ink text-white md:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4 p-7 sm:p-10">
            <p className="text-xs font-bold tracking-[0.14em] text-sun uppercase">Bons plans</p>
            <h2 className="font-display text-3xl font-black">Ne ratez plus une promo</h2>
            <p className="max-w-md text-white/75">Arrivages, prix cassés, nouveautés : rejoignez la chaîne WhatsApp Ô Bon Prix.</p>
            <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="btn min-h-12 bg-[#1f9d55] px-6 text-base text-white hover:bg-[#17864a]">
              <IconWhatsapp className="size-5" /> Rejoindre la chaîne
            </a>
          </div>
          <div className="relative h-full min-h-72 overflow-hidden">
            <div className="absolute -right-[10%] -bottom-[35%] aspect-square w-[95%] rounded-full bg-red" aria-hidden />
            <Image src="/egeries/detoure/victoire.webp" alt="Une cliente Ô Bon Prix, bras levés, ravie d'une bonne affaire" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-contain object-bottom pt-6" />
          </div>
        </div>
      </section>
    </main>
  );
}
