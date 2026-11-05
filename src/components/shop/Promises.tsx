import { IconClock, IconTruck, IconWallet, IconWhatsapp } from "@/components/icons";

/** Bande de réassurance : ce que le client gagne à commander chez Ô Bon Prix */
export default function Promises({ minFee }: { minFee: string }) {
  const items = [
    { Icon: IconTruck, title: "Livraison partout à Dakar", text: `Dès ${minFee}, ou par Yango` },
    { Icon: IconWallet, title: "Wave et Orange Money", text: "Paiement simple, sans espèces" },
    { Icon: IconClock, title: "Ouvert 7 jours sur 7", text: "De 8 h à 23 h, dimanche dès 12 h" },
    { Icon: IconWhatsapp, title: "Une question ?", text: "Réponse rapide sur WhatsApp" },
  ];
  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-px lg:overflow-hidden lg:rounded-2xl lg:bg-line lg:p-0 lg:ring-1 lg:ring-line">
      {items.map(({ Icon, title, text }) => (
        <li key={title} className="flex w-64 shrink-0 snap-start items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line lg:w-auto lg:rounded-none lg:py-4 lg:ring-0">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red"><Icon className="size-5" /></span>
          <span className="min-w-0">
            <span className="block text-sm leading-tight font-bold">{title}</span>
            <span className="block text-xs text-mute">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
