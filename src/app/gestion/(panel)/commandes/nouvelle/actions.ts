"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";

export type WaOrderInput = {
  name: string; phone: string; items: { product_id: string; qty: number }[];
  delivery: string; area_other: string; address: string; landmark: string;
  payment: "wave" | "om"; paid: boolean; ref: string; note: string;
};

export async function createWhatsappOrder(input: WaOrderInput): Promise<{ error?: string }> {
  const { supabase } = await requireStaff(["gerant", "vendeur"]);
  if (input.name.trim().length < 2) return { error: "Indiquez le nom du client." };
  if (!/^\+?[0-9 ]{9,20}$/.test(input.phone.trim())) return { error: "Numéro de téléphone invalide." };
  if (!input.items.length) return { error: "Ajoutez au moins un produit." };
  if (!["wave", "om"].includes(input.payment)) return { error: "Choisissez Wave ou Orange Money." };

  let delivery: Record<string, unknown>;
  if (input.delivery === "yango") {
    if (!input.area_other.trim()) return { error: "Indiquez le quartier pour Yango." };
    delivery = { mode: "yango", area: input.area_other.trim().slice(0, 80) };
  } else {
    const m = /^z:(\d+):(.{1,80})$/.exec(input.delivery);
    if (!m) return { error: "Choisissez le quartier du client." };
    delivery = { mode: "zone", zone_id: Number(m[1]), area: m[2] };
  }
  Object.assign(delivery, { address: input.address.trim().slice(0, 300), landmark: input.landmark.trim().slice(0, 200) });

  const { data, error } = await supabase.rpc("staff_place_order", {
    p_customer: { name: input.name.trim(), phone: input.phone.trim() },
    p_items: input.items.map((i) => ({ product_id: String(i.product_id), qty: Number(i.qty) })),
    p_delivery: delivery,
    p_payment: input.payment,
    p_note: input.note.trim().slice(0, 500),
    p_paid: Boolean(input.paid),
    p_ref: input.ref.trim().slice(0, 80),
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    const msg = error?.message ?? "";
    if (msg.startsWith("out_of_stock:")) return { error: `Stock insuffisant : ${msg.slice(13)}.` };
    if (msg.includes("bad_qty")) return { error: "Quantité invalide (les produits au kilo se vendent par demi-kilo)." };
    return { error: "La commande n'a pas pu être enregistrée." };
  }
  revalidatePath("/gestion/commandes");
  redirect(`/gestion/commandes/${row.order_id}`);
}
