import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./env";

/**
 * Requêtes /gestion : rafraîchit la session et renvoie vers la connexion tout visiteur non connecté.
 * Le rôle (gérant, stock, vendeur, livreur) est vérifié ensuite côté serveur et par la base (RLS, has_role()).
 */
export async function refreshStaffSession(request: NextRequest) {
  const login = "/gestion/connexion";
  const isLogin = request.nextUrl.pathname === login;
  const toLogin = () => NextResponse.redirect(new URL(login, request.url));
  if (!hasSupabase) return isLogin ? NextResponse.next() : toLogin();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub && !isLogin) return toLogin();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
