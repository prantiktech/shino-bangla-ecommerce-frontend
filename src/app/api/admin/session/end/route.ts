import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/session/end?redirect=/admin/orders
 *
 * Reached when the API no longer accepts the admin token (expired, revoked, or not a staff account).
 * Server Components cannot delete cookies, and the proxy sends anyone holding an admin cookie away
 * from the login page, so the dead cookies are cleared here before showing the login page.
 */
export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("redirect") || "/admin";
  // Only ever return to a back-office path on this site.
  const target = raw.startsWith("/admin") && !raw.startsWith("//") && !raw.startsWith("/admin/login") ? raw : "/admin";

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("redirect", target);
  login.searchParams.set("expired", "1");

  const res = NextResponse.redirect(login);
  res.headers.set("Cache-Control", "no-store");

  const adminToken = request.cookies.get("admin_token")?.value;
  res.cookies.delete("admin_token");
  res.cookies.delete("admin_client_token");
  // Admin sign-in also sets the shared cookies; clear them only if they hold the same dead token,
  // so a separate customer session in this browser survives.
  for (const name of ["token", "client-token"]) {
    if (adminToken && request.cookies.get(name)?.value === adminToken) res.cookies.delete(name);
  }
  return res;
}
