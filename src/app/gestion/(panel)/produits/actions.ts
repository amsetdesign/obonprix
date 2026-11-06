"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { parseNum, slugify } from "@/lib/format";
import { writeCost } from "@/lib/costs";

export type ProductState = { ok?: boolean; error?: string; message?: string };

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PHOTO_MAX = 3 * 1024 * 1024;

const schema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court.").max(120),
    category_id: z.coerce.number().int().positive("Choisissez un rayon."),
    unit: z.enum(["piece", "kg"]),
    price: z.number().int().positive("Prix invalide.").nullable(),
    promo_price: z.number().int().positive("Prix promo invalide.").nullable(),
    stock_alert: z.number().min(0).max(100000),
    barcode: z.string().trim().max(32).regex(/^[0-9A-Za-z-]*$/, "Code-barres : chiffres et lettres uniquement."),
    description: z.string().trim().max(2000),
    is_active: z.boolean(),
    is_online: z.boolean(),
    featured: z.boolean(),
  })
  .refine((v) => v.promo_price == null || (v.price != null && v.promo_price < v.price), { message: "Le prix promo doit être inférieur au prix normal." })
  .refine((v) => !v.is_online || v.price != null, { message: "Saisissez un prix pour vendre ce produit en ligne." });

function read(fd: FormData) {
  return schema.safeParse({
    name: fd.get("name") ?? "",
    category_id: fd.get("category_id") ?? "",
    unit: fd.get("unit") ?? "piece",
    price: parseNum(fd.get("price")),
    promo_price: parseNum(fd.get("promo_price")),
    stock_alert: parseNum(fd.get("stock_alert")) ?? 0,
    barcode: fd.get("barcode") ?? "",
    description: fd.get("description") ?? "",
    is_active: fd.get("is_active") === "on",
    is_online: fd.get("is_online") === "on",
    featured: fd.get("featured") === "on",
  });
}

/** Envoie la photo dans l'espace « produits » ; renvoie son adresse publique, ou une erreur lisible. */
async function uploadPhoto(supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"], productId: string, file: File) {
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { error: "Photo : formats acceptés JPG, PNG ou WEBP." };
  if (file.size > PHOTO_MAX) return { error: "Photo trop lourde (3 Mo maximum)." };
  const path = `${productId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("produits").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: "La photo n'a pas pu être envoyée." };
  return { url: supabase.storage.from("produits").getPublicUrl(path).data.publicUrl };
}

const dbError = (msg: string) =>
  msg.includes("products_barcode_key") ? "Ce code-barres est déjà utilisé par un autre produit." :
  msg.includes("products_slug_key") ? "Un produit porte déjà ce nom." :
  "L'enregistrement a échoué. Réessayez.";

function readCost(fd: FormData): { cost: number | null; error?: string } {
  const cost = parseNum(fd.get("cost_price"));
  if (cost != null && (!Number.isInteger(cost) || cost < 0 || cost > 10_000_000)) return { cost: null, error: "Prix d'achat invalide." };
  return { cost };
}

export async function saveProduct(id: string, _prev: ProductState, fd: FormData): Promise<ProductState> {
  const { supabase, userId } = await requireStaff(["gerant", "stock"]);
  const parsed = read(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { cost, error: costError } = readCost(fd);
  if (costError) return { error: costError };

  const patch: Record<string, unknown> = { ...v, barcode: v.barcode || null };
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadPhoto(supabase, id, photo);
    if (up.error) return { error: up.error };
    patch.image_url = up.url;
  }
  if (fd.get("remove_photo") === "on") patch.image_url = "";

  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) return { error: dbError(error.message) };
  const { error: ce } = await writeCost(supabase, id, userId, cost);
  if (ce && cost != null) return { error: "Produit enregistré, mais pas le prix d'achat. Réessayez." };
  revalidatePath("/gestion/produits");
  revalidatePath(`/gestion/produits/${id}`);
  return { ok: true, message: "Produit enregistré." };
}

export async function createProduct(_prev: ProductState, fd: FormData): Promise<ProductState> {
  const { supabase, userId } = await requireStaff(["gerant", "stock"]);
  const parsed = read(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { cost, error: costError } = readCost(fd);
  if (costError) return { error: costError };
  const initial = parseNum(fd.get("initial_stock")) ?? 0;
  if (initial < 0 || (v.unit === "piece" && !Number.isInteger(initial))) return { error: "Stock de départ invalide." };

  const { data, error } = await supabase
    .from("products")
    .insert({ ...v, barcode: v.barcode || null, slug: slugify(v.name) })
    .select("id")
    .single();
  if (error || !data) return { error: dbError(error?.message ?? "") };

  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadPhoto(supabase, data.id, photo);
    if (up.url) await supabase.from("products").update({ image_url: up.url }).eq("id", data.id);
  }
  if (cost != null) await writeCost(supabase, data.id, userId, cost);
  if (initial > 0) {
    await supabase.from("stock_movements").insert({ product_id: data.id, delta: initial, reason: "achat", note: "Stock de départ", created_by: userId });
  }
  revalidatePath("/gestion/produits");
  redirect(`/gestion/produits/${data.id}?cree=1`);
}
