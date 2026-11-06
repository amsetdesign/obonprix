import type { Metadata } from "next";
import { getSettings } from "@/lib/shop";
import LegalPage from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };
export const revalidate = 300;

type Legal = { legal_name?: string; ninea?: string; rccm?: string; email?: string };

export default async function LegalNotice() {
  const s = await getSettings();
  const l = (s ?? {}) as Legal & { phone?: string; base_address?: string };
  return (
    <LegalPage title="Mentions légales" updated="6 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <ul>
          <li>{l.legal_name || "Ô Bon Prix Superette"}</li>
          <li>Adresse : {l.base_address || "HLM Patte d'Oie, Dakar, Sénégal"}</li>
          <li>Téléphone : {l.phone || "+221 78 737 82 90"}</li>
          {l.email ? <li>E-mail : {l.email}</li> : null}
          <li>NINEA : {l.ninea || "en cours de publication"}</li>
          <li>RCCM : {l.rccm || "en cours de publication"}</li>
        </ul>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Données de la boutique hébergées par Supabase.</p>
      </section>
      <section>
        <h2>Propriété</h2>
        <p>Le nom, le logo, les photographies et les contenus d&apos;Ô Bon Prix sont protégés. Toute reproduction sans autorisation est interdite. Les marques des produits vendus appartiennent à leurs propriétaires respectifs.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Pour toute question : WhatsApp ou appel au {l.phone || "+221 78 737 82 90"}.</p>
      </section>
    </LegalPage>
  );
}
