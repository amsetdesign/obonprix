import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/shop";
import OrderStatus from "@/components/shop/OrderStatus";
import PayInstructions from "@/components/shop/PayInstructions";
import { lastOrder } from "../actions";
import ClearCart from "./ClearCart";

export const metadata: Metadata = { title: "Commande enregistrée", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ThanksPage() {
  const [last, settings] = await Promise.all([lastOrder(), getSettings()]);
  if (!last) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <p className="text-mute">Aucune commande récente sur ce navigateur.</p>
        <Link href="/suivi" className="btn-primary mt-4">Suivre une commande</Link>
      </main>
    );
  }
  const { order } = last;
  const payNumber = (order.payment_method === "om" ? settings?.om_number : settings?.wave_number) ?? "78 737 82 90";
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <ClearCart number={order.number} total={order.total} />
      <div className="flex items-center gap-5">
        <Image src="/egeries/detoure/victoire.webp" alt="" width={140} height={168} className="hidden h-auto w-28 sm:block" />
        <div>
          <p className="text-sm font-semibold text-leaf">Commande enregistrée</p>
          <h1 className="font-display text-3xl font-black">Merci ! Commande {order.number}</h1>
          <p className="mt-1 text-mute">Gardez ce numéro : il sert à suivre votre commande.</p>
        </div>
      </div>
      <PayInstructions o={order} payNumber={payNumber} whatsapp={settings?.whatsapp ?? "221787378290"} />
      <OrderStatus o={order} />
      <p className="text-sm text-mute">Retrouvez cette commande à tout moment dans <Link href="/mes-commandes" className="font-semibold text-red underline-offset-4 hover:underline">Mes commandes</Link>, sur ce téléphone.</p>
    </main>
  );
}
