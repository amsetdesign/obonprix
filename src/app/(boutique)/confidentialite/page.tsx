import type { Metadata } from "next";
import { getSettings } from "@/lib/shop";
import LegalPage from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };
export const revalidate = 300;

export default async function Privacy() {
  const s = await getSettings();
  const phone = s?.phone ?? "+221 78 737 82 90";
  return (
    <LegalPage title="Politique de confidentialité" updated="6 novembre 2026">
      <p>Ô Bon Prix respecte votre vie privée et applique la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel.</p>
      <section>
        <h2>Les informations que nous recueillons</h2>
        <ul>
          <li>À la commande : nom, téléphone, quartier, adresse, point de repère, contenu de la commande et moyen de paiement choisi.</li>
          <li>Votre position GPS, uniquement si vous choisissez de la partager pour faciliter la livraison.</li>
          <li>Pour une candidature : nom, téléphone, e-mail facultatif, message et CV.</li>
        </ul>
        <p>Nous ne recueillons aucune donnée bancaire : le paiement se fait directement sur Wave ou Orange Money.</p>
      </section>
      <section>
        <h2>Pourquoi</h2>
        <p>Uniquement pour préparer, livrer et suivre vos commandes, vous contacter à leur sujet, tenir notre comptabilité et étudier les candidatures. Nous ne vendons ni ne cédons vos données à personne.</p>
      </section>
      <section>
        <h2>Sur votre téléphone</h2>
        <p>Pour vous faire gagner du temps, le site et l&apos;application gardent sur votre appareil votre panier, vos coordonnées et vos dernières commandes. Vous pouvez les effacer à tout moment depuis « Mes commandes » (« Effacer mes informations de ce téléphone »).</p>
      </section>
      <section>
        <h2>Qui y a accès</h2>
        <p>Seule l&apos;équipe Ô Bon Prix concernée (gérant, vendeur, livreur pour ses livraisons). Les données sont hébergées de façon sécurisée chez nos prestataires techniques (Supabase, Vercel).</p>
      </section>
      <section>
        <h2>Durée de conservation</h2>
        <p>Les commandes sont conservées le temps nécessaire à nos obligations comptables. Les candidatures non retenues sont supprimées au plus tard un an après leur réception.</p>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>Vous pouvez demander à consulter, corriger ou supprimer vos informations en nous contactant au {phone}{s && (s as { email?: string }).email ? ` ou par e-mail (${(s as { email?: string }).email})` : ""}. Vous pouvez aussi saisir la Commission de Protection des Données Personnelles (CDP) du Sénégal.</p>
      </section>
    </LegalPage>
  );
}
