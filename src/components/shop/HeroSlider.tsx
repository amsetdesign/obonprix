"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrow } from "@/components/icons";

type Props = { minFee: string; promoCount: number };

/** Diaporama de l'accueil : l'affiche Ô Bon Prix puis les messages clés avec les égéries */
export default function HeroSlider({ minFee, promoCount }: Props) {
  const slides = [
    // l'affiche (format très large) est posée sur une version floutée d'elle-même : rien n'est rogné
    <Link key="affiche" href="#rayons" className="relative block size-full overflow-hidden bg-red" aria-label="Ô Bon Prix Superette : découvrir nos rayons">
      <Image src="/brand/affiche.webp" alt="" fill sizes="10vw" className="scale-110 object-cover opacity-60 blur-xl" aria-hidden />
      <Image src="/brand/affiche.webp" alt="Ô Bon Prix Superette : produits frais, épicerie salée, épicerie sucrée, surgelés, boissons, hygiène et entretien" fill priority sizes="(min-width: 1024px) 900px, 100vw" className="object-contain" />
    </Link>,
    <div key="livraison" className="relative flex size-full items-center overflow-hidden bg-[#eceef8]">
      <div className="relative z-10 max-w-[58%] space-y-2 p-5 sm:space-y-4 sm:p-10">
        <p className="font-display text-xl leading-tight font-black text-ink sm:text-4xl">Livré <span className="text-red">partout à Dakar</span></p>
        <p className="text-sm text-ink/75 sm:text-lg">Dès {minFee} selon votre quartier, ou par Yango.</p>
        <Link href="#livraison" className="btn-primary min-h-9 px-4 text-xs sm:min-h-11 sm:text-sm">Voir les zones <IconArrow className="size-4" /></Link>
      </div>
      <div className="absolute right-0 bottom-0 h-full w-[46%] overflow-hidden rounded-tl-[40px] bg-white">
        <Image src="/egeries/montre.webp" alt="" fill sizes="(min-width: 1024px) 420px, 46vw" className="object-cover object-[30%_top]" />
      </div>
    </div>,
    <div key="paiement" className="relative flex size-full items-center overflow-hidden bg-sun">
      <div className="relative z-10 max-w-[58%] space-y-2 p-5 sm:space-y-4 sm:p-10">
        <p className="font-display text-xl leading-tight font-black text-ink sm:text-4xl">Payez par <span className="text-red">Wave</span> ou <span className="text-red">Orange Money</span></p>
        <p className="text-sm text-ink/80 sm:text-lg">{promoCount > 0 ? `${promoCount} produit${promoCount > 1 ? "s" : ""} en promotion en ce moment.` : "Simple, rapide, sans espèces."}</p>
        <Link href={promoCount > 0 ? "/promotions" : "#rayons"} className="btn min-h-9 bg-ink px-4 text-xs text-white hover:bg-red sm:min-h-11 sm:text-sm">
          {promoCount > 0 ? "Voir les promos" : "Faire mes courses"} <IconArrow className="size-4" />
        </Link>
      </div>
      <div className="absolute right-0 bottom-0 h-full w-[46%] overflow-hidden rounded-tl-[40px] bg-white">
        <Image src="/egeries/pouces.webp" alt="" fill sizes="(min-width: 1024px) 420px, 46vw" className="object-cover object-top" />
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
      className="relative h-full overflow-hidden rounded-[var(--radius-card)]"
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
      <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, n) => (
          <div key={n} className="h-full w-full shrink-0" role="group" aria-roledescription="diapositive" aria-label={`${n + 1} sur ${slides.length}`} aria-hidden={n !== i} inert={n !== i}>
            {s}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => go(i - 1)} className="absolute top-1/2 left-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white sm:flex" aria-label="Diapositive précédente">
        <IconArrow className="size-4 rotate-180" />
      </button>
      <button type="button" onClick={() => go(i + 1)} className="absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white sm:flex" aria-label="Diapositive suivante">
        <IconArrow className="size-4" />
      </button>
      <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-ink/45 px-2.5 py-1.5">
        {slides.map((_, n) => (
          <button key={n} type="button" onClick={() => go(n)} aria-label={`Aller à la diapositive ${n + 1}`} aria-current={n === i}
            className={`h-2 rounded-full transition-all ${n === i ? "w-5 bg-white" : "w-2 bg-white/60"}`} />
        ))}
      </div>
    </section>
  );
}
