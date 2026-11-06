import "server-only";
import type { requireStaff } from "@/lib/staff";

type Db = Awaited<ReturnType<typeof requireStaff>>["supabase"];

/** Prix d'achat : table à part, lisible seulement par le gérant et la gestionnaire de stock (vide = effacé) */
export async function writeCost(supabase: Db, productId: string, userId: string, cost: number | null) {
  if (cost == null) return supabase.from("product_costs").delete().eq("product_id", productId);
  return supabase.from("product_costs").upsert({ product_id: productId, cost_price: cost, updated_by: userId });
}
