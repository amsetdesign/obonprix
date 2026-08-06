import "server-only";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "obp_admin_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "authenticated";
}
