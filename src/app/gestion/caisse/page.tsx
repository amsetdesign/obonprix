import type { Metadata } from "next";
import { requireStaff } from "@/lib/staff";
import Register from "./Register";
import { orderPulse } from "../(panel)/watch-actions";

export const metadata: Metadata = { title: "Caisse | Ô Bon Prix", robots: { index: false } };

/** Caisse plein écran (écran tactile Dell + imprimante ticket E26 + tiroir) */
export default async function CaissePage() {
  const { supabase, name, role } = await requireStaff(["gerant", "vendeur"]);
  const pulse = await orderPulse().catch(() => null);
  const [{ data: products }, { data: cats }, { data: settings }] = await Promise.all([
    supabase.from("products").select("id, name, unit, price, promo_price, barcode, category_id, kind, image_url, is_active").eq("is_active", true).not("price", "is", null).order("name"),
    supabase.from("categories").select("id, name").order("position"),
    supabase.from("store_settings").select("phone, base_address, ninea, rccm").eq("id", 1).maybeSingle(),
  ]);
  const list = (products ?? []).map((p) => ({
    id: p.id as string, name: p.name as string, unit: p.unit as "piece" | "kg", price: (p.promo_price ?? p.price) as number,
    barcode: (p.barcode as string | null) ?? null, category_id: p.category_id as number | null, kind: p.kind as string,
  }));
  return (
    <Register
      products={list}
      categories={cats ?? []}
      cashier={name || "Caisse"}
      isManager={role === "gerant"}
      pulse={pulse}
      store={{ phone: settings?.phone ?? "+221 78 737 82 90", address: settings?.base_address ?? "HLM Patte d'Oie, Dakar", ninea: settings?.ninea ?? "", rccm: settings?.rccm ?? "" }}
    />
  );
}
