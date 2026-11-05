import type { Metadata } from "next";
import { getSettings, getZones, openNow } from "@/lib/shop";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = { title: "Commander", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, settings] = await Promise.all([getZones(), getSettings()]);
  const closedNow = settings ? !openNow(settings.hours) : false;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-black">Commander</h1>
      {settings && !settings.accepting_orders ? (
        <p className="mt-6 rounded-xl bg-sun-100 p-5">Les commandes en ligne sont suspendues pour le moment. Écrivez-nous sur WhatsApp au {settings.phone}.</p>
      ) : (
        <>
          {closedNow && <p className="mt-4 rounded-xl bg-sun-100 px-4 py-3 text-sm">La boutique est fermée en ce moment : votre commande sera préparée dès l&apos;ouverture.</p>}
          <CheckoutForm zones={zones} />
        </>
      )}
    </main>
  );
}
