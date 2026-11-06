import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconCart, IconCheck, IconLeaf, IconTruck, IconWallet } from "@/components/icons";

export const metadata: Metadata = {
  title: "À propos",
  description: "Ô Bon Prix, supérette en ligne à Dakar depuis le 2 novembre 2025 : notre histoire, notre vision et nos valeurs.",
};

const VALUES = [
  { Icon: IconWallet, title: "Le bon prix", text: "Des prix justes et des promotions régulières sur les produits du quotidien." },
  { Icon: IconLeaf, title: "La fraîcheur", text: "Des produits frais et surgelés conservés avec soin, pesés à la commande." },
  { Icon: IconTruck, title: "Le service", text: "Une équipe joignable sur WhatsApp et une livraison partout à Dakar." },
  { Icon: IconCart, title: "La simplicité", text: "Commander en quelques gestes, payer par Wave ou Orange Money, suivre sa commande." },
];

const FACTS = [
  "Créée le 2 novembre 2025 à Dakar",
  "6 rayons : frais, épicerie salée et sucrée, surgelés, boissons, hygiène",
  "Livraison dans tout Dakar dès 1 000 F, ou par Yango",
  "Ouvert 7 jours sur 7, de 8 h à 23 h (dimanche dès 12 h)",
];

export default function AboutPage() {
  return (
    <main className="space-y-14 pb-6">
      <section className="overflow-hidden bg-[#f6f4fc]">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 sm:px-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 py-10">
            <p className="text-xs font-bold tracking-[0.14em] text-red uppercase">À propos</p>
            <h1 className="font-display text-4xl leading-[1.05] font-black sm:text-5xl">La supérette de quartier, <span className="text-red">à portée de téléphone</span>.</h1>
            <p className="max-w-lg text-lg text-ink/75">Ô Bon Prix livre les courses du quotidien partout à Dakar, au bon prix, avec le service d&apos;une boutique de quartier.</p>
          </div>
          <div className="relative h-80 self-end md:h-[26rem]">
            <div className="absolute -bottom-[25%] left-1/2 aspect-square w-[85%] -translate-x-1/2 rounded-full bg-sun" aria-hidden />
            <Image src="/egeries/detoure/panier.webp" alt="Une cliente Ô Bon Prix avec un panier de courses" fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-contain object-bottom" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] text-red uppercase">Notre histoire</p>
          <h2 className="font-display text-3xl font-black">Un an au service de Dakar</h2>
          <p className="text-ink/80">Ô Bon Prix est née le 2 novembre 2025 avec une idée simple : proposer les produits de tous les jours à des prix justes, avec l&apos;attention d&apos;une supérette de quartier.</p>
          <p className="text-ink/80">Aujourd&apos;hui, nous servons nos clients en ligne depuis HLM Patte d&apos;Oie : commande sur le site, l&apos;application ou WhatsApp, paiement par Wave ou Orange Money, et livraison jusqu&apos;à la porte. Nous préparons l&apos;ouverture de notre nouveau magasin.</p>
          <p className="text-ink/80">Pour fêter notre premier anniversaire, nous avons lancé le Pack Anniversaire : merci à tous nos clients pour leur confiance.</p>
        </div>
        <div className="space-y-3 rounded-[24px] bg-red p-7 text-white">
          <p className="text-xs font-bold tracking-[0.14em] text-sun uppercase">Notre vision</p>
          <h2 className="font-display text-3xl font-black">Des courses simples, justes et proches pour chaque foyer</h2>
          <p className="text-white/85">Nous voulons que chaque famille de Dakar puisse faire ses courses sans perdre de temps ni d&apos;argent : des prix honnêtes, des produits de qualité, un paiement mobile simple et une livraison fiable.</p>
          <p className="text-white/85">Demain, cela passera par de nouveaux points de vente, plus de quartiers livrés et toujours la même exigence de service.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-red uppercase">Nos valeurs</p>
          <h2 className="font-display text-3xl font-black">Ce qui nous guide</h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ Icon, title, text }) => (
            <li key={title} className="card space-y-3 p-5">
              <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red"><Icon className="size-6" /></span>
              <p className="font-display text-lg font-extrabold">{title}</p>
              <p className="text-sm text-ink/75">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 rounded-[28px] bg-ink p-7 text-white sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-black sm:text-3xl">Ô Bon Prix en bref</h2>
            <ul className="space-y-2">
              {FACTS.map((f) => <li key={f} className="flex items-start gap-2.5 text-white/85"><IconCheck className="mt-0.5 size-5 shrink-0 text-sun" />{f}</li>)}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-primary min-h-12 px-6">Faire mes courses</Link>
            <Link href="/recrutement" className="btn min-h-12 bg-white/10 px-6 text-white hover:bg-white/20">Rejoindre l&apos;équipe</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
