import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import ProductForm from "../ProductForm";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const { supabase } = await requireStaff(["gerant", "stock"]);
  const [{ data: cats }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("id, name").order("position"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);
  return (
    <div className="space-y-6">
      <Link href="/gestion/produits" className="text-sm text-mute hover:text-red">← Tous les produits</Link>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Nouveau produit ou pack</h1>
      <ProductForm action={createProduct} categories={cats ?? []} suppliers={suppliers ?? []} isNew />
    </div>
  );
}
