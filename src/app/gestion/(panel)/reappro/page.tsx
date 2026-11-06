import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { qty } from "@/lib/format";
import { IconWhatsapp } from "@/components/icons";
import SupplierForm from "./SupplierForm";
import SupplierSelect from "./SupplierSelect";
import { removeSupplier } from "./actions";

export const metadata: Metadata = { title: "Réapprovisionnement" };

type P = { id: string; name: string; unit: string; stock: number; stock_alert: number; supplier_id: number | null };

/** Message prêt à envoyer au fournisseur */
function orderMessage(supplier: string, items: P[]) {
  const lines = items.map((p) => `- ${p.name} (il nous reste ${qty(p.stock < 0 ? 0 : p.stock, p.unit)})`);
  return `Bonjour ${supplier}, ici Ô Bon Prix. Nous souhaitons passer commande :\n${lines.join("\n")}\nMerci de nous indiquer vos prix et le délai de livraison.`;
}
const waLink = (phone: string, text: string) => {
  const d = phone.replace(/\D/g, "");
  const to = d.length === 9 ? `221${d}` : d;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
};

export default async function ReapproPage() {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select("id, name, unit, stock, stock_alert, supplier_id").eq("is_active", true).eq("kind", "simple").order("name"),
    supabase.from("suppliers").select("id, name, phone, note").order("name"),
  ]);
  const low = ((products ?? []) as P[]).map((p) => ({ ...p, stock: Number(p.stock), stock_alert: Number(p.stock_alert) })).filter((p) => p.stock < p.stock_alert);
  const groups = [
    ...(suppliers ?? []).map((s) => ({ supplier: s, items: low.filter((p) => p.supplier_id === s.id) })),
    { supplier: null, items: low.filter((p) => p.supplier_id == null || !(suppliers ?? []).some((s) => s.id === p.supplier_id)) },
  ].filter((g) => g.items.length);
  const options = (suppliers ?? []).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Réapprovisionnement</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Produits passés sous leur seuil d&apos;alerte (5 par défaut, réglable dans chaque fiche), regroupés par fournisseur. Un bouton prépare la commande sur WhatsApp.
        </p>
      </header>

      {!low.length && <p className="card p-6 text-center text-leaf">Tout est au-dessus du seuil d&apos;alerte. Rien à commander pour l&apos;instant.</p>}

      {groups.map(({ supplier, items }) => (
        <section key={supplier?.id ?? "sans"} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream px-5 py-3.5">
            <div>
              <h2 className="font-display text-lg font-extrabold">{supplier ? supplier.name : "Fournisseur non renseigné"}</h2>
              <p className="text-sm text-mute">{items.length} produit{items.length > 1 ? "s" : ""} à commander{supplier?.phone ? ` · ${supplier.phone}` : ""}</p>
            </div>
            {supplier?.phone ? (
              <a href={waLink(supplier.phone, orderMessage(supplier.name, items))} target="_blank" rel="noopener noreferrer" className="btn min-h-10 bg-[#1f9d55] text-white hover:bg-[#17864a]">
                <IconWhatsapp className="size-5" /> Commander sur WhatsApp
              </a>
            ) : supplier ? (
              <span className="text-sm text-mute">Ajoutez son numéro pour lui écrire</span>
            ) : (
              <span className="text-sm text-mute">Choisissez le fournisseur de chaque produit</span>
            )}
          </div>
          <ul className="divide-y divide-line">
            {items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 text-sm">
                <Link href={`/gestion/produits/${p.id}`} className="min-w-0 font-medium hover:text-red">{p.name}</Link>
                <span className="flex items-center gap-4">
                  <span className={`tabular ${p.stock <= 0 ? "font-semibold text-red" : "text-[#a06d00]"}`}>
                    {p.stock <= 0 ? "Épuisé" : `Reste ${qty(p.stock, p.unit)}`} <span className="text-mute">/ seuil {qty(p.stock_alert, p.unit)}</span>
                  </span>
                  {!supplier && options.length > 0 && <SupplierSelect productId={p.id} options={options} />}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-extrabold">Fournisseurs</h2>
        {suppliers?.length ? (
          <ul className="divide-y divide-line rounded-xl border border-line text-sm">
            {suppliers.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <span><strong>{s.name}</strong>{s.phone && <span className="text-mute tabular"> · {s.phone}</span>}{s.note && <span className="text-mute"> · {s.note}</span>}</span>
                <form action={removeSupplier.bind(null, s.id)}><button type="submit" className="text-mute underline-offset-4 hover:text-red hover:underline">Supprimer</button></form>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-mute">Aucun fournisseur enregistré.</p>}
        <SupplierForm />
      </section>
    </div>
  );
}
