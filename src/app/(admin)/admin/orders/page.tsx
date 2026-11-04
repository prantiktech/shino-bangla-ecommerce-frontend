import type { Metadata } from "next";
import { getAdminOrdersAction, getAdminOrdersSummaryAction } from "@/app/(admin)/actions/orders";
import { ORDER_STATUSES } from "@/app/(admin)/components/order-meta";
import type { OrderStatus } from "@/types/admin-orders";
import { OrdersManagement } from "./_components/OrdersManagement";
import {
  EMPTY_FILTERS,
  ORDER_DATE_PRESETS,
  resolveOrderDateRange,
  type OrderDatePreset,
  type OrderFilters,
} from "./_components/filters";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Orders | Admin Portal" };

/**
 * Supports deep-linked searchParams:
 * `?status=packed&payment_status=partially_paid&preset=today&page=2&per_page=25&order=12`
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    payment_status?: string;
    payment_method?: string;
    courier?: string;
    source?: string;
    preset?: string;
    from?: string;
    to?: string;
    q?: string;
    product?: string;
    page?: string;
    per_page?: string;
    order?: string;
  }>;
}) {
  const access = await guardAdminPage("/admin/orders");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus)
    ? (sp.status as OrderStatus)
    : "";
  const validPreset = ORDER_DATE_PRESETS.some((p) => p.value === sp.preset)
    ? (sp.preset as OrderDatePreset)
    : sp.from || sp.to
    ? "custom"
    : "";

  const presetDates =
    validPreset && validPreset !== "custom"
      ? resolveOrderDateRange(validPreset)
      : { from: sp.from ?? "", to: sp.to ?? "" };

  const filters: OrderFilters = {
    ...EMPTY_FILTERS,
    status,
    payment_status: sp.payment_status ?? "",
    payment_method: sp.payment_method ?? "",
    courier: sp.courier ?? "",
    source: sp.source ?? "",
    preset: validPreset,
    from: sp.from || presetDates.from,
    to: sp.to || presetDates.to,
    q: sp.q?.slice(0, 100) ?? "",
    product: sp.product?.slice(0, 100) ?? "",
  };

  const page = sp.page && /^\d+$/.test(sp.page) ? Math.max(1, Number(sp.page)) : 1;
  const perPage =
    sp.per_page && /^\d+$/.test(sp.per_page)
      ? Math.min(100, Math.max(10, Number(sp.per_page)))
      : 25;
  const openOrderId = sp.order && /^\d+$/.test(sp.order) ? Number(sp.order) : null;

  const [res, summary] = await Promise.all([
    getAdminOrdersAction({
      status: filters.status || undefined,
      payment_status: filters.payment_status || undefined,
      payment_method: filters.payment_method || undefined,
      courier: filters.courier || undefined,
      source: filters.source || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
      product: filters.product || undefined,
      page,
      per_page: perPage,
    }),
    getAdminOrdersSummaryAction({
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
  ]);

  return (
    <OrdersManagement
      initial={
        res.success
          ? res.data
          : {
              data: [],
              meta: { current_page: page, last_page: 1, per_page: perPage, total: 0 },
            }
      }
      initialError={res.success ? null : res.error.message}
      initialSummary={summary.success ? summary.data : null}
      initialFilters={filters}
      initialPage={page}
      initialPerPage={perPage}
      openOrderId={openOrderId}
    />
  );
}
