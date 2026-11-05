import type { Metadata } from "next";
import { getSettings } from "@/lib/shop";
import TrackForm from "./TrackForm";

export const metadata: Metadata = { title: "Suivre ma commande" };
export const revalidate = 60;

export default async function TrackPage() {
  const settings = await getSettings();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-black">Suivre ma commande</h1>
      <p className="mt-1 text-mute">Saisissez le numéro reçu à la commande (par exemple C1001) et votre téléphone.</p>
      <TrackForm waveNumber={settings?.wave_number ?? "78 737 82 90"} omNumber={settings?.om_number ?? "78 737 82 90"} whatsapp={settings?.whatsapp ?? "221787378290"} />
    </main>
  );
}
