import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import WhatsappOrderForm from "./WhatsappOrderForm";

export const metadata: Metadata = { title: "Commande WhatsApp" };

export default async function NewOrderPage() {
  const { supabase } = await requireStaff(["gerant", "vendeur"]);
  const [{ data: products }, { data: zones }] = await Promise.all([
    supabase.from("products").select("id, name, unit, price, promo_price, stock").eq("is_active", true).eq("is_online", true).not("price", "is", null).order("name"),
    supabase.from("delivery_zones").select("id, name, price, areas").eq("active", true).order("position"),
  ]);
  return (
    <div className="space-y-6">
      <Link href="/gestion/commandes" className="text-sm text-mute hover:text-red">← Commandes</Link>
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Saisir une commande WhatsApp</h1>
        <p className="mt-1 text-sm text-mute">Le stock est réservé, la commande suit le même parcours (paiement, préparation, livraison) et compte dans les statistiques.</p>
      </header>
      <WhatsappOrderForm
        products={(products ?? []).map((p) => ({ id: p.id, name: p.name, unit: p.unit, price: p.promo_price ?? p.price, stock: Number(p.stock) }))}
        zones={zones ?? []}
      />
    </div>
  );
}
