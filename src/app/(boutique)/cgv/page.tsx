import type { Metadata } from "next";
import Link from "next/link";
import { getSettings, getZones } from "@/lib/shop";
import { fcfa } from "@/lib/format";
import LegalPage from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Conditions générales de vente" };
export const revalidate = 300;

export default async function Terms() {
  const [s, zones] = await Promise.all([getSettings(), getZones()]);
  const hours = (s as { unpaid_cancel_hours?: number } | null)?.unpaid_cancel_hours ?? 3;
  const phone = s?.phone ?? "+221 78 737 82 90";
  return (
    <LegalPage title="Conditions générales de vente" updated="6 novembre 2026">
      <p>Les présentes conditions s&apos;appliquent aux commandes passées auprès d&apos;Ô Bon Prix sur le site, l&apos;application mobile ou par WhatsApp. Passer commande vaut acceptation de ces conditions.</p>
      <section>
        <h2>1. Produits et prix</h2>
        <p>Les prix sont indiqués en francs CFA. Les produits au kilo sont vendus par demi-kilo ; le poids exact est pesé à la préparation et peut varier légèrement. Les offres et promotions sont valables dans la limite des stocks et jusqu&apos;à la date indiquée.</p>
      </section>
      <section>
        <h2>2. Commande</h2>
        <p>Chaque commande reçoit un numéro (par exemple C1001) qui permet de la suivre sur la page <Link href="/suivi" className="text-red underline">Suivre ma commande</Link>. Le stock est réservé dès la commande.</p>
      </section>
      <section>
        <h2>3. Paiement avant livraison</h2>
        <p>Le paiement se fait par Wave ou Orange Money au numéro indiqué à la commande ({s?.wave_number ?? "78 737 82 90"}). La commande est préparée et livrée après vérification du paiement.{hours > 0 ? ` Une commande non payée sous ${hours} heure${hours > 1 ? "s" : ""} est annulée automatiquement.` : ""}</p>
      </section>
      <section>
        <h2>4. Livraison</h2>
        <p>Nous livrons dans tout Dakar, aux tarifs suivants selon le quartier :</p>
        <ul>
          {zones.map((z) => <li key={z.id}>{z.name} ({fcfa(z.price)}) : {z.areas.join(", ")}</li>)}
          <li>Autres quartiers : livraison par Yango, course payée directement au livreur.</li>
        </ul>
        <p>Les livraisons sont effectuées pendant les heures d&apos;ouverture, dans les meilleurs délais. Merci d&apos;indiquer une adresse précise et un numéro joignable.</p>
      </section>
      <section>
        <h2>5. Réclamations et remboursements</h2>
        <p>Vérifiez votre commande à la livraison. Un produit manquant, abîmé ou non conforme doit être signalé le jour même au {phone} (appel ou WhatsApp), avec une photo si possible. Après vérification, nous le remplaçons ou le remboursons. Les produits frais et surgelés ne sont ni repris ni échangés une fois acceptés, sauf défaut constaté à la livraison.</p>
      </section>
      <section>
        <h2>6. Annulation</h2>
        <p>Vous pouvez annuler une commande tant qu&apos;elle n&apos;est pas partie en livraison, en nous contactant. Si elle a déjà été payée, elle vous est remboursée par le même moyen de paiement.</p>
      </section>
      <section>
        <h2>7. Données personnelles</h2>
        <p>Vos informations servent uniquement au traitement de vos commandes : voir notre <Link href="/confidentialite" className="text-red underline">politique de confidentialité</Link>.</p>
      </section>
    </LegalPage>
  );
}
