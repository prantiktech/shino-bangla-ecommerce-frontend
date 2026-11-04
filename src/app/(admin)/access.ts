/**
 * Which permission opens which back-office page. One list, used by the sidebar (to show links)
 * and by every page's server-side guard (to allow or refuse the page), so the two never disagree.
 * The API stays the authority for data; this decides what the panel shows.
 */

/** One permission, or a list where any one is enough. */
export type PagePermission = string | readonly string[];

export interface StaffAccess {
  permissions: readonly string[];
  roles: readonly string[];
}

/** The owner role: the API grants it every permission, so the panel does too. */
export const SUPER_ADMIN_ROLE = "super-admin";

/** In sidebar order, which is also the order used to pick a landing page. */
export const ADMIN_PAGES: readonly { href: string; permission: PagePermission }[] = [
  { href: "/admin", permission: "dashboard.view" },
  { href: "/admin/accounting", permission: "accounting.view" },
  { href: "/admin/reports", permission: "reports.view" },
  { href: "/admin/products", permission: "products.view" },
  { href: "/admin/categories", permission: "categories.view" },
  { href: "/admin/brands", permission: "brands.view" },
  { href: "/admin/option-types", permission: "products.view" },
  { href: "/admin/inventory", permission: "inventory.view" },
  { href: "/admin/purchases", permission: "inventory.view" },
  { href: "/admin/orders", permission: "orders.view" },
  { href: "/admin/incomplete-orders", permission: "incomplete-orders.view" },
  // Shipping by scan needs orders.fulfil; the return tab needs orders.refund.
  { href: "/admin/shipments", permission: ["orders.fulfil", "orders.refund"] },
  { href: "/admin/couriers", permission: "couriers.view" },
  { href: "/admin/fraud", permission: "fraud.view" },
  { href: "/admin/customers", permission: "customers.view" },
  { href: "/admin/reviews", permission: "reviews.view" },
  { href: "/admin/coupons", permission: "discounts.view" },
  { href: "/admin/flash-sales", permission: "discounts.view" },
  { href: "/admin/shipping", permission: "shipping.view" },
  { href: "/admin/home-sections", permission: "storefront.view" },
  { href: "/admin/banners", permission: "storefront.view" },
  { href: "/admin/pages", permission: "content.view" },
  { href: "/admin/faqs", permission: "content.view" },
  { href: "/admin/newsletter", permission: "marketing.view" },
  { href: "/admin/messages", permission: "content.view" },
  { href: "/admin/business-applications", permission: "business-applications.view" },
  { href: "/admin/staff", permission: "staff.view" },
  { href: "/admin/roles", permission: "roles.view" },
  { href: "/admin/activity-log", permission: "activity-log.view" },
  { href: "/admin/settings", permission: "settings.view" },
];

export type AdminPageHref = (typeof ADMIN_PAGES)[number]["href"];

export function isSuperAdmin(access: StaffAccess): boolean {
  return access.roles.includes(SUPER_ADMIN_ROLE);
}

export function hasPermission(access: StaffAccess, permission: PagePermission | undefined): boolean {
  if (!permission) return true;
  if (isSuperAdmin(access)) return true;
  const needed = typeof permission === "string" ? [permission] : permission;
  return needed.some((p) => access.permissions.includes(p));
}

/** The permission a page needs: exact match, else the closest parent page. Unknown pages need none. */
export function pagePermission(href: string): PagePermission | undefined {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  let best: { href: string; permission: PagePermission } | undefined;
  for (const page of ADMIN_PAGES) {
    const matches = page.href === "/admin" ? path === "/admin" : path === page.href || path.startsWith(`${page.href}/`);
    if (matches && (!best || page.href.length > best.href.length)) best = page;
  }
  return best?.permission;
}

export function canOpenPage(access: StaffAccess, href: string): boolean {
  return hasPermission(access, pagePermission(href));
}

/** Where to send someone who cannot see the requested page; null when no page is open to them. */
export function firstAccessiblePage(access: StaffAccess): string | null {
  return ADMIN_PAGES.find((p) => hasPermission(access, p.permission))?.href ?? null;
}

/** "orders.fulfil or orders.refund" — for telling staff what to ask for. */
export function describePermission(permission: PagePermission): string {
  return typeof permission === "string" ? permission : permission.join(" or ");
}
