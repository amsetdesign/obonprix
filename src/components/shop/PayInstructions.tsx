import { fcfa } from "@/lib/format";
import type { TrackedOrder } from "@/app/(boutique)/commande/actions";
import { IconWhatsapp } from "@/components/icons";
import { PAY_LABEL } from "./OrderStatus";

/** Consignes de paiement Wave / Orange Money, tant que le paiement n'est pas confirmé par l'équipe */
export default function PayInstructions({ o, payNumber, whatsapp }: { o: TrackedOrder; payNumber: string; whatsapp: string }) {
  if (o.payment_status === "paye" || o.status === "annulee") return null;
  const msg = `Bonjour Ô Bon Prix, j'ai payé ma commande ${o.number} (${fcfa(o.total)}) par ${PAY_LABEL[o.payment_method]}.`;
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border-2 border-red bg-white">
      <p className="bg-red px-5 py-2.5 text-sm font-semibold text-white">Dernière étape : le paiement</p>
      <div className="space-y-4 p-5">
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sun font-bold">1</span>
            <span>Envoyez <strong className="tabular">{fcfa(o.total)}</strong> par <strong>{PAY_LABEL[o.payment_method]}</strong> au <strong className="tabular whitespace-nowrap">{payNumber}</strong> (Ô Bon Prix).</span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sun font-bold">2</span>
            <span>Prévenez-nous sur WhatsApp en rappelant le numéro de commande <strong>{o.number}</strong>.</span>
          </li>
        </ol>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`} className="btn min-h-12 w-full bg-[#1f9d55] text-base text-white hover:bg-[#17864a] sm:w-auto">
          <IconWhatsapp className="size-5" /> J&apos;ai payé, je préviens Ô Bon Prix
        </a>
        <p className="text-sm text-mute">Votre commande est préparée et livrée dès que le paiement est vérifié.</p>
      </div>
    </section>
  );
}
