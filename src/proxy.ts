import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.get(ADMIN_COOKIE)?.value === "authenticated";

  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/produits/:path*"],
};
