import type { Metadata } from "next";
import { requireStaff } from "@/lib/staff";
import SettingsForm from "./SettingsForm";
import { saveZone } from "./actions";

export const metadata: Metadata = { title: "Réglages" };

export default async function SettingsPage() {
  const { supabase } = await requireStaff(["gerant"]);
  const [{ data: s }, { data: zones }] = await Promise.all([
    supabase.from("store_settings").select("*").eq("id", 1).single(),
    supabase.from("delivery_zones").select("id, name, price, areas, active").order("position"),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Réglages</h1>
      {s && <SettingsForm s={s} />}

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Zones de livraison</h2>
          <p className="text-sm text-mute">Le client choisit son quartier, le prix de la zone s&apos;ajoute à sa commande. Hors zones : livraison Yango, payée au livreur.</p>
        </div>
        {(zones ?? []).map((z) => (
          <form key={z.id} action={saveZone.bind(null, z.id)} className="card grid gap-4 p-5 sm:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <p className="font-display text-lg font-extrabold">{z.name}</p>
              <label className="block">
                <span className="label">Prix (F)</span>
                <input name="price" inputMode="numeric" defaultValue={z.price} className="field tabular" />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={z.active} className="size-4 accent-[var(--color-red)]" /> Active</label>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex-1">
                <span className="label">Quartiers (séparés par des virgules)</span>
                <textarea name="areas" rows={3} defaultValue={(z.areas ?? []).join(", ")} className="field h-full min-h-24" />
              </label>
              <button type="submit" className="btn-ghost self-start">Enregistrer la zone</button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
