import Image from "next/image";

// Page d'attente : la boutique en ligne arrive à l'étape suivante
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-white px-4 text-center">
      <Image src="/brand/logo.png" alt="Ô Bon Prix Superette" width={360} height={168} priority />
      <div className="max-w-md space-y-3">
        <h1 className="font-display text-2xl font-extrabold">La boutique en ligne arrive bientôt</h1>
        <p className="text-mute">En attendant, commandez sur WhatsApp : livraison partout à Dakar, paiement Wave ou Orange Money.</p>
      </div>
      <a href="https://wa.me/221787378290" className="btn-primary px-7">Commander sur WhatsApp</a>
      <p className="text-sm text-mute">Lundi au samedi 8 h - 23 h · Dimanche 12 h - 23 h</p>
    </main>
  );
}
