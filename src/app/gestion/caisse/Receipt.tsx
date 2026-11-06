/* eslint-disable @next/next/no-img-element -- le ticket s'imprime tel quel, sans optimisation d'image */
import { fcfa, qty } from "@/lib/format";

export type ReceiptData = {
  number: string; at: string; cashier: string; payment: string; total: number;
  cash: number | null; change: number | null; duplicate?: boolean;
  lines: { name: string; unit: string; qty: number; price: number; total: number }[];
  store: { phone: string; address: string };
};

/**
 * Ticket de caisse au format 80 mm (imprimante thermique E26 / R290).
 * Invisible à l'écran ; seul élément imprimé (voir les règles @media print plus bas).
 */
export default function Receipt({ data }: { data: ReceiptData }) {
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(data.at));
  return (
    <>
      <style>{`
        @media screen { #ticket { display: none; } }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: #fff !important; }
          body * { visibility: hidden; }
          #ticket, #ticket * { visibility: visible; }
          #ticket { position: absolute; left: 0; top: 0; width: 72mm; padding: 2mm 3mm 6mm; font: 12px/1.35 Arial, sans-serif; color: #000; }
        }
      `}</style>
      <div id="ticket" aria-hidden>
        <div style={{ textAlign: "center" }}>
          <img src="/brand/logo.png" alt="" style={{ width: "38mm", filter: "grayscale(1) contrast(1.4)" }} />
          <div style={{ marginTop: 4 }}>{data.store.address}</div>
          <div>Tél. / Wave / OM : {data.store.phone}</div>
        </div>
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Ticket {data.number}</span><span>{date}</span></div>
        <div>Caisse : {data.cashier}</div>
        {data.duplicate && <div style={{ textAlign: "center", fontWeight: 700 }}>DUPLICATA</div>}
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        {data.lines.map((l, i) => (
          <div key={i} style={{ marginBottom: 3 }}>
            <div>{l.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{qty(l.qty, l.unit)} x {fcfa(l.price)}</span>
              <span>{fcfa(l.total)}</span>
            </div>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}><span>TOTAL</span><span>{fcfa(data.total)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Paiement</span><span>{data.payment}</span></div>
        {data.cash != null && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Donné</span><span>{fcfa(data.cash)}</span></div>}
        {data.change != null && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Rendu</span><span>{fcfa(data.change)}</span></div>}
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div style={{ textAlign: "center" }}>
          Merci de votre visite !<br />
          Commandez aussi en ligne, livré partout à Dakar :<br />
          obonprix.vercel.app
        </div>
      </div>
    </>
  );
}
