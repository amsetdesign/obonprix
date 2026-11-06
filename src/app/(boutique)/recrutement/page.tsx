import type { Metadata } from "next";
import Image from "next/image";
import { publicClient } from "@/lib/supabase/public";
import { hasSupabase } from "@/lib/supabase/env";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = { title: "Recrutement", description: "Rejoignez l'équipe Ô Bon Prix à Dakar : offres d'emploi et candidature spontanée." };
export const revalidate = 300;

type Offer = { id: string; title: string; contract: string; location: string; description: string; requirements: string; closes_on: string | null };

export default async function RecruitmentPage() {
  const offers: Offer[] = hasSupabase
    ? ((await publicClient().from("job_offers").select("id, title, contract, location, description, requirements, closes_on").order("created_at", { ascending: false })).data ?? [])
    : [];

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <header className="grid items-center overflow-hidden rounded-[28px] bg-ink text-white md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 p-7 sm:p-10">
          <p className="text-xs font-bold tracking-[0.14em] text-sun uppercase">Recrutement</p>
          <h1 className="font-display text-3xl font-black sm:text-4xl">Rejoignez l&apos;équipe Ô Bon Prix</h1>
          <p className="max-w-md text-white/75">Préparation des commandes, livraison, caisse, gestion du stock : nous cherchons des personnes sérieuses, souriantes et motivées pour servir nos clients à Dakar.</p>
        </div>
        <div className="relative h-full min-h-60 overflow-hidden">
          <div className="absolute -right-[10%] -bottom-[30%] aspect-square w-[95%] rounded-full bg-sun" aria-hidden />
          <Image src="/egeries/detoure/pouces.webp" alt="" fill sizes="(min-width: 768px) 35vw, 100vw" className="object-contain object-bottom pt-6" />
        </div>
      </header>

      <section aria-labelledby="offres" className="space-y-4">
        <h2 id="offres" className="font-display text-2xl font-extrabold">Offres en cours</h2>
        {offers.length ? (
          offers.map((o) => (
            <article key={o.id} className="card space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-extrabold">{o.title}</h3>
                <span className="pill bg-red-50 text-red">{o.contract}</span>
                <span className="pill bg-cream text-ink">{o.location}</span>
              </div>
              {o.description && <p className="whitespace-pre-line text-ink/80">{o.description}</p>}
              {o.requirements && (
                <div>
                  <p className="text-sm font-semibold">Profil recherché</p>
                  <p className="whitespace-pre-line text-sm text-ink/80">{o.requirements}</p>
                </div>
              )}
              {o.closes_on && <p className="text-xs text-mute">Candidatures jusqu&apos;au {new Date(`${o.closes_on}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</p>}
            </article>
          ))
        ) : (
          <p className="card p-6 text-mute">Aucune offre ouverte en ce moment. Vous pouvez nous envoyer une candidature spontanée : nous la garderons pour nos prochains recrutements.</p>
        )}
      </section>

      <section aria-labelledby="postuler" className="space-y-4">
        <h2 id="postuler" className="font-display text-2xl font-extrabold">Postuler</h2>
        <ApplyForm offers={offers.map((o) => ({ id: o.id, title: o.title }))} />
      </section>
    </main>
  );
}
