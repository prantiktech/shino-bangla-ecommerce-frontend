import type { Metadata } from "next";
import { getAdminOrdersAction, getAdminOrdersSummaryAction } from "@/app/(admin)/actions/orders";
import { ORDER_STATUSES } from "@/app/(admin)/components/order-meta";
import type { OrderStatus } from "@/types/admin-orders";
import { OrdersManagement } from "./_components/OrdersManagement";
import { EMPTY_FILTERS, type OrderFilters } from "./_components/filters";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Orders | Admin Portal" };

/** `?status=packed` opens a tab, `?order=12` opens that order's detail. */
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; order?: string; q?: string }> }) {
  const access = await guardAdminPage("/admin/orders");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : "";
  const filters: OrderFilters = { ...EMPTY_FILTERS, status, q: sp.q?.slice(0, 100) ?? "" };
  const openOrderId = sp.order && /^\d+$/.test(sp.order) ? Number(sp.order) : null;

  const [res, summary] = await Promise.all([getAdminOrdersAction({ status, q: filters.q }), getAdminOrdersSummaryAction()]);

  return (
    <OrdersManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
      initialSummary={summary.success ? summary.data : null}
      initialFilters={filters}
      openOrderId={openOrderId}
    />
  );
}
