"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrow } from "@/components/icons";

type Props = { minFee: string; promoCount: number };

// Rayons de l'affiche officielle, recomposée en HTML pour rester lisible sur téléphone
const POSTER_RAYONS = [
  ["produits-frais", "Produits frais"],
  ["epicerie-salee", "Épicerie salée"],
  ["epicerie-sucree", "Épicerie sucrée"],
  ["surgeles", "Surgelés"],
  ["boissons", "Boissons"],
  ["hygiene-entretien", "Hygiène"],
] as const;

const Eyebrow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[10px] font-extrabold tracking-[0.16em] uppercase sm:text-xs ${className}`}>{children}</p>
);

/** Égérie détourée, posée en bas à droite de la bannière */
const Model = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => (
  <div className={`pointer-events-none absolute right-0 bottom-0 h-[96%] ${className}`}>
    <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 420px, 55vw" className="object-contain object-right-bottom" />
  </div>
);

/** Diaporama de l'accueil : bannières aux couleurs de la marque, égéries détourées */
export default function HeroSlider({ minFee, promoCount }: Props) {
  const slides = [
    // 1. Accueil : jaune « Superette », égérie au panier
    <div key="accueil" className="relative size-full overflow-hidden bg-sun">
      <div className="absolute -right-[10%] -bottom-[45%] aspect-square w-[70%] rounded-full bg-white/35" aria-hidden />
      <div className="absolute right-[18%] -bottom-[30%] aspect-square w-[42%] rounded-full bg-[#ffd451]" aria-hidden />
      <Model src="/egeries/detoure/panier.webp" alt="Une cliente Ô Bon Prix tient un panier de courses" className="w-[58%] sm:w-[52%]" />
      <div className="relative z-10 flex h-full max-w-[56%] flex-col justify-center gap-2 p-5 sm:gap-4 sm:p-10">
        <Eyebrow className="text-red">Supérette en ligne · Dakar</Eyebrow>
        <p className="font-display text-[22px] leading-[1.02] font-black text-ink sm:text-[44px]">Vos courses, <span className="text-red">livrées</span> chez vous.</p>
        <p className="hidden max-w-sm text-ink/75 sm:block">Produits frais, épicerie, boissons, hygiène. Livraison dès {minFee}.</p>
        <div><Link href="#rayons" className="btn-primary min-h-9 px-4 text-xs sm:min-h-12 sm:px-6 sm:text-sm">Faire mes courses <IconArrow className="size-4" /></Link></div>
      </div>
    </div>,

    // 2. L'affiche : logo et six rayons
    <div key="affiche" className="relative size-full overflow-hidden bg-[radial-gradient(120%_120%_at_20%_30%,#e8242b_0%,#d1141b_45%,#9f0d12_100%)]">
      <div className="relative flex h-full flex-col justify-center gap-3 p-4 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <div className="shrink-0 sm:w-[34%]">
          <Image src="/brand/logo-blanc.png" alt="Ô Bon Prix Superette" width={720} height={355} className="h-auto w-36 sm:w-full" />
        </div>
        <ul className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
          {POSTER_RAYONS.map(([slug, label]) => (
            <li key={slug}>
              <Link href={`/rayons/${slug}`} className="group flex flex-col items-center gap-1 sm:gap-2">
                <span className="rounded-full border border-white/70 px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase group-hover:bg-white group-hover:text-red sm:px-3 sm:py-1 sm:text-[11px]">{label}</span>
                <span className="relative block aspect-[2.2/1] w-full">
                  <Image src={`/rayons/${slug}.webp`} alt="" fill sizes="(min-width: 1024px) 160px, 30vw" className="object-contain transition-transform group-hover:scale-105 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_75%)]" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>,

    // 3. Volaille et charcuterie : rouge, produits de l'affiche, égérie qui présente
    <div key="volaille" className="relative size-full overflow-hidden bg-red">
      <div className="absolute inset-y-0 right-0 w-[60%] bg-[radial-gradient(closest-side,#e8343a,transparent)]" aria-hidden />
      <div className="absolute right-[38%] bottom-[6%] aspect-[2.3/1] w-[36%] sm:right-[34%] sm:w-[32%]">
        <Image src="/rayons/surgeles.webp" alt="Viandes, volaille et fruits de mer" fill sizes="(min-width: 1024px) 300px, 40vw" className="object-contain [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_75%)]" />
      </div>
      <Model src="/egeries/detoure/montre.webp" alt="" className="w-[48%] sm:w-[40%]" />
      <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-center gap-2 p-5 text-white sm:gap-4 sm:p-10">
        <Eyebrow className="text-sun">Au kilo · pesé pour vous</Eyebrow>
        <p className="font-display text-[22px] leading-[1.02] font-black sm:text-[42px]">Volaille et charcuterie</p>
        <p className="hidden max-w-xs text-white/85 sm:block">Cuisses, ailes, pilons, poulet entier, saucisses.</p>
        <div><Link href="/rayons/surgeles" className="btn-sun min-h-9 px-4 text-xs sm:min-h-12 sm:px-6 sm:text-sm">Voir le rayon <IconArrow className="size-4" /></Link></div>
      </div>
    </div>,

    // 4. Paiement : fond sombre, égérie pouces levés
    <div key="paiement" className="relative size-full overflow-hidden bg-ink">
      <div className="absolute -right-[8%] -bottom-[40%] aspect-square w-[62%] rounded-full bg-sun" aria-hidden />
      <Model src="/egeries/detoure/pouces.webp" alt="" className="w-[42%] sm:w-[36%]" />
      <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-center gap-2 p-5 text-white sm:gap-4 sm:p-10">
        <Eyebrow className="text-sun">Paiement simple</Eyebrow>
        <p className="font-display text-[22px] leading-[1.02] font-black sm:text-[42px]">Payez par <span className="text-sun">Wave</span> ou <span className="text-sun">Orange Money</span></p>
        <p className="hidden max-w-sm text-white/75 sm:block">{promoCount > 0 ? `${promoCount} produit${promoCount > 1 ? "s" : ""} en promotion en ce moment.` : `Livré partout à Dakar dès ${minFee}.`}</p>
        <div>
          <Link href={promoCount > 0 ? "/promotions" : "#livraison"} className="btn min-h-9 bg-white px-4 text-xs text-ink hover:bg-sun sm:min-h-12 sm:px-6 sm:text-sm">
            {promoCount > 0 ? "Voir les promos" : "Zones de livraison"} <IconArrow className="size-4" />
          </Link>
        </div>
      </div>
    </div>,
  ];

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="À la une"
      className="group/slider relative h-full overflow-hidden rounded-[20px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, n) => (
          <div key={n} className="h-full w-full shrink-0" role="group" aria-roledescription="diapositive" aria-label={`${n + 1} sur ${slides.length}`} aria-hidden={n !== i} inert={n !== i}>
            {s}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => go(i - 1)} className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-lg transition-opacity group-hover/slider:opacity-100 focus-visible:opacity-100 sm:flex" aria-label="Diapositive précédente">
        <IconArrow className="size-4 rotate-180" />
      </button>
      <button type="button" onClick={() => go(i + 1)} className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-lg transition-opacity group-hover/slider:opacity-100 focus-visible:opacity-100 sm:flex" aria-label="Diapositive suivante">
        <IconArrow className="size-4" />
      </button>
      <div className="absolute bottom-3 left-5 flex gap-1.5 sm:left-10">
        {slides.map((_, n) => (
          <button key={n} type="button" onClick={() => go(n)} aria-label={`Aller à la diapositive ${n + 1}`} aria-current={n === i}
            className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-7 bg-white shadow" : "w-3 bg-white/55 hover:bg-white/80"}`} />
        ))}
      </div>
    </section>
  );
}
