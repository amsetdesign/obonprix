import type { MetadataRoute } from "next";
import { publicClient } from "@/lib/supabase/public";
import { hasSupabase } from "@/lib/supabase/env";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/promotions", "/a-propos", "/recrutement", "/cgv", "/mentions-legales", "/confidentialite"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.5 : 1 }));
  if (!hasSupabase) return pages;
  const db = publicClient();
  const [{ data: cats }, { data: products }] = await Promise.all([
    db.from("categories").select("slug"),
    db.from("products").select("slug, updated_at").eq("is_active", true).eq("is_online", true).not("price", "is", null),
  ]);
  return [
    ...pages,
    ...(cats ?? []).map((c) => ({ url: `${SITE_URL}/rayons/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(products ?? []).map((p) => ({ url: `${SITE_URL}/produits/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
