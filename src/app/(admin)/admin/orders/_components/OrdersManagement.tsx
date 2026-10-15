"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Banknote, Eye, PackageCheck, ScanBarcode, ShoppingBag, Truck, X } from "lucide-react";
import { getAdminOrdersAction, getAdminOrdersSummaryAction } from "@/app/(admin)/actions/orders";
import type { Paginated } from "@/app/(admin)/actions/_request";
import type { AdminOrderDetail, AdminOrderRow, OrderStatus, OrdersSummary } from "@/types/admin-orders";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  LoadingRows,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  TableShell,
  TBody,
  THead,
  Tabs,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime, formatTaka } from "@/app/(admin)/components/format";
import {
  COURIERS,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_META,
  SHIPMENT_STATE_META,
  metaFor,
} from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";
import { OrderDetailModal } from "./OrderDetailModal";
import { EMPTY_FILTERS, type OrderFilters } from "./filters";

const MAIN_TABS: (OrderStatus | "")[] = ["", "pending", "confirmed", "processing", "packed", "shipped", "delivered", "on_hold", "cancelled", "returned"];

export function OrdersManagement({
  initial,
  initialError,
  initialSummary,
  initialFilters,
  openOrderId,
}: {
  initial: Paginated<AdminOrderRow>;
  initialError: string | null;
  initialSummary: OrdersSummary | null;
  initialFilters: OrderFilters;
  openOrderId: number | null;
}) {
  const can = useCan();
  const [list, setList] = useState(initial);
  const [summary, setSummary] = useState(initialSummary);
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<number | null>(openOrderId);
  const { notice, error, clear } = useNotice();

  const load = async (next: OrderFilters, nextPage: number, withSummary = false) => {
    setLoading(true);
    const [res, sum] = await Promise.all([
      getAdminOrdersAction({ ...next, page: nextPage }),
      withSummary ? getAdminOrdersSummaryAction({ from: next.from || undefined, to: next.to || undefined }) : Promise.resolve(null),
    ]);
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
    if (sum && sum.success) setSummary(sum.data);
  };

  const update = (patch: Partial<OrderFilters>, opts: { summary?: boolean } = {}) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setPage(1);
    load(next, 1, opts.summary);
  };

  const debounced = useDebouncedCallback((patch: Partial<OrderFilters>, base: OrderFilters) => {
    const next = { ...base, ...patch };
    setPage(1);
    load(next, 1);
  });

  const onText = (key: "q" | "product", value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    debounced({ [key]: value }, filters);
  };

  const onDates = (key: "from" | "to", value: string) => {
    const next = { ...filters, [key]: value };
    if (next.from && next.to && next.to < next.from) return error("The end date must be on or after the start date.");
    clear();
    update({ [key]: value }, { summary: true });
  };

  /** Keep the list row in step with changes made in the detail modal. */
  const onChanged = (o: AdminOrderDetail) => {
    setList((l) => ({
      ...l,
      data: l.data.map((r) =>
        r.id === o.id
          ? { ...r, status: o.status, payment_status: o.payment_status, shipment: o.shipment, grand_total: o.totals?.grand_total ?? r.grand_total }
          : r
      ),
    }));
  };

  const filtersActive =
    filters.q || filters.product || filters.payment_status || filters.payment_method || filters.courier || filters.source || filters.from || filters.to;

  const by = summary?.by_status ?? {};

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShoppingBag}
        title="Orders"
        description="Move orders through fulfilment, ship them with a courier, record payments and refunds."
        actions={
          can("orders.fulfil") ? (
            <Link
              href="/admin/shipments"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ScanBarcode className="w-4 h-4" /> Scan station
            </Link>
          ) : null
        }
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Orders"
            value={summary.total_orders}
            hint={summary.range.from || summary.range.to ? `${summary.range.from ?? "…"} to ${summary.range.to ?? "…"}` : "All time"}
            icon={ShoppingBag}
            tone="orange"
          />
          <StatCard
            label="Sales"
            value={formatTaka(summary.sales.amount)}
            hint={`${summary.sales.orders} orders · average ${formatTaka(summary.sales.average)}`}
            icon={Banknote}
            tone="green"
          />
          <StatCard label="Waiting to ship" value={by.packed ?? 0} hint={`${by.processing ?? 0} processing`} icon={PackageCheck} tone="amber" />
          <StatCard label="With the courier" value={by.shipped ?? 0} hint={`${by.delivered ?? 0} delivered · ${by.returned ?? 0} returned`} icon={Truck} tone="blue" />
        </div>
      )}

      <Tabs
        tabs={MAIN_TABS.map((s) => ({
          value: s || "all",
          label: s ? metaFor(ORDER_STATUS_META, s).label : "All",
          count: s ? by[s] : summary?.total_orders,
        }))}
        value={filters.status || "all"}
        onChange={(v) => update({ status: v === "all" ? "" : (v as OrderStatus) })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchInput value={filters.q} onChange={(v) => onText("q", v)} placeholder="Order number, name or phone" />
        <SearchInput value={filters.product} onChange={(v) => onText("product", v)} placeholder="Product name or SKU" />
        <Select value={filters.payment_status} onChange={(e) => update({ payment_status: e.target.value })} aria-label="Payment status">
          <option value="">Any payment status</option>
          {PAYMENT_STATUSES.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_STATUS_META[p].label}
            </option>
          ))}
        </Select>
        <Select value={filters.payment_method} onChange={(e) => update({ payment_method: e.target.value })} aria-label="Payment method">
          <option value="">Any payment method</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={filters.courier} onChange={(e) => update({ courier: e.target.value })} aria-label="Courier">
          <option value="">Any courier</option>
          {COURIERS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select value={filters.source} onChange={(e) => update({ source: e.target.value })} aria-label="Order source">
          <option value="">Cart and buy now</option>
          <option value="cart">Cart checkout</option>
          <option value="buy_now">Buy now</option>
        </Select>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-10 shrink-0">From</span>
          <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => onDates("from", e.target.value)} aria-label="Placed from" />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-10 shrink-0">To</span>
          <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => onDates("to", e.target.value)} aria-label="Placed to" />
        </label>
      </div>
      {filtersActive && (
        <div>
          <Button
            size="sm"
            variant="ghost"
            icon={X}
            onClick={() => {
              const next = { ...EMPTY_FILTERS, status: filters.status };
              setFilters(next);
              setPage(1);
              load(next, 1, Boolean(filters.from || filters.to));
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <TableShell>
        <THead>
          <th className={th}>Order</th>
          <th className={th}>Customer</th>
          <th className={th}>Total</th>
          <th className={th}>Status</th>
          <th className={th}>Payment</th>
          <th className={th}>Parcel</th>
          <th className={th}>Placed</th>
          <th className={`${th} text-right`}>
            <span className="sr-only">Actions</span>
          </th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={8} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <EmptyState icon={ShoppingBag} title="No orders found" description={filtersActive || filters.status ? "Try other filters." : "New orders appear here."} />
              </td>
            </tr>
          ) : (
            list.data.map((o) => {
              const st = metaFor(ORDER_STATUS_META, o.status);
              const pay = metaFor(PAYMENT_STATUS_META, o.payment_status);
              const parcel = o.shipment ? metaFor(SHIPMENT_STATE_META, o.shipment.state) : null;
              return (
                <tr key={o.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setViewing(o.id)}>
                  <td className={`${td} font-mono font-semibold text-slate-900`}>
                    {o.number}
                    {o.source === "buy_now" && <span className="block font-sans text-[11px] font-normal text-slate-500">Buy now</span>}
                  </td>
                  <td className={td}>
                    <div className="font-medium text-slate-900">
                      {o.customer.name}
                      {o.customer.is_guest && <span className="ml-1.5 text-[11px] text-slate-400">guest</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{o.customer.phone}</div>
                  </td>
                  <td className={`${td} tabular-nums font-semibold`}>
                    {formatTaka(o.grand_total)}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {o.item_count} item{o.item_count === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className={td}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </td>
                  <td className={td}>
                    <Badge tone={pay.tone}>{pay.label}</Badge>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}</span>
                  </td>
                  <td className={td}>
                    {o.shipment && parcel ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-slate-800">
                          {o.shipment.courier_label}
                          {o.shipment.is_sandbox && <span className="ml-1 text-amber-600">TEST</span>}
                        </div>
                        <Badge tone={parcel.tone}>{parcel.label}</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`}>
                    {formatDateTime(o.placed_at)}
                    {o.district && <span className="block">{o.district}</span>}
                  </td>
                  <td className={`${td} text-right`}>
                    <IconButton
                      label={`View order ${o.number}`}
                      icon={Eye}
                      tone="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(o.id);
                      }}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </TBody>
      </TableShell>

      <Pagination
        meta={list.meta}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          load(filters, p);
        }}
      />

      {viewing !== null && (
        <OrderDetailModal
          key={viewing}
          orderId={viewing}
          onClose={() => {
            setViewing(null);
            // The summary counts may have moved; refresh them quietly.
            getAdminOrdersSummaryAction({ from: filters.from || undefined, to: filters.to || undefined }).then((s) => {
              if (s.success) setSummary(s.data);
            });
            if (filters.status) load(filters, page);
          }}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}
