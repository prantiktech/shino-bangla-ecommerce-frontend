/**
 * Server-side access check for back-office pages.
 *
 * Every admin page calls `guardAdminPage(href)` before loading data:
 *  - signed out / expired token / not staff → the session is cleared and the login page is shown;
 *  - no permission for the page → the page renders <AccessDenied /> (the dashboard instead
 *    forwards to the first page the person may open);
 *  - allowed → the page renders as usual.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverGet } from "@/lib/api-client/server";
import {
  StaffAccess,
  describePermission,
  firstAccessiblePage,
  hasPermission,
  isSuperAdmin,
  pagePermission,
} from "./access";

export type AdminSession =
  | { status: "ok"; access: StaffAccess; name: string }
  | { status: "signed-out" }
  /** The API could not be reached; pages still render and their own requests report the problem. */
  | { status: "unavailable" };

/** One `/me` call per request, however many components ask. */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  // Ask with the admin cookie explicitly: the shared client may otherwise pick a customer token
  // from the same browser when the request carries no admin referer (e.g. a typed-in URL).
  const store = await cookies();
  const token = store.get("admin_token")?.value || store.get("admin_client_token")?.value;
  if (!token) return { status: "signed-out" };

  const res = await serverGet<{ data?: Record<string, unknown> } & Record<string, unknown>>("GET_ADMIN_ME", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.success) {
    const status = res.error.status;
    return status === 401 || status === 403 || status === 419 ? { status: "signed-out" } : { status: "unavailable" };
  }
  const user = (res.data?.data ?? res.data) as { name?: string; is_staff?: boolean; roles?: unknown; permissions?: unknown };
  const access: StaffAccess = {
    roles: Array.isArray(user.roles) ? user.roles.filter((r): r is string => typeof r === "string") : [],
    permissions: Array.isArray(user.permissions) ? user.permissions.filter((p): p is string => typeof p === "string") : [],
  };
  // A customer token in the admin cookie is not a staff session.
  if (user.is_staff === false && !isSuperAdmin(access)) return { status: "signed-out" };
  return { status: "ok", access, name: user.name ?? "Staff" };
});

export type PageAccess =
  | { allowed: true }
  | { allowed: false; needed: string; fallback: string | null };

/** Send the browser through the route that clears the dead session cookies, then to the login page. */
function endSession(href: string): never {
  redirect(`/api/admin/session/end?redirect=${encodeURIComponent(href)}`);
}

export async function guardAdminPage(href: string): Promise<PageAccess> {
  const session = await getAdminSession();
  if (session.status === "signed-out") endSession(href);
  if (session.status === "unavailable") return { allowed: true };

  const permission = pagePermission(href);
  if (hasPermission(session.access, permission)) return { allowed: true };

  const fallback = firstAccessiblePage(session.access);
  // The dashboard is where everyone lands after signing in: forward instead of refusing.
  if (href === "/admin" && fallback && fallback !== "/admin") redirect(fallback);
  return { allowed: false, needed: permission ? describePermission(permission) : "", fallback };
}
