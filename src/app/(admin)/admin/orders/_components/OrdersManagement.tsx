"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  PackageCheck,
  ScanBarcode,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import {
  getAdminOrdersAction,
  getAdminOrdersSummaryAction,
} from "@/app/(admin)/actions/orders";
import type { Paginated } from "@/app/(admin)/actions/_request";
import type {
  AdminOrderDetail,
  AdminOrderRow,
  OrderStatus,
  OrdersSummary,
} from "@/types/admin-orders";
import {
  AutoPollToggle,
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
  syncUrlParams,
  td,
  th,
  useAutoPoll,
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
  timeAgo,
} from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";
import { cn } from "@/lib/utils";
import { OrderDetailModal } from "./OrderDetailModal";
import {
  EMPTY_FILTERS,
  ORDER_DATE_PRESETS,
  resolveOrderDateRange,
  type OrderDatePreset,
  type OrderFilters,
} from "./filters";

const MAIN_TABS: (OrderStatus | "")[] = [
  "",
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "on_hold",
  "cancelled",
  "returned",
];

const PIPELINE_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
];

function getStepProgress(status: OrderStatus): {
  step: number;
  total: number;
  color: string;
} | null {
  const idx = PIPELINE_STEPS.indexOf(status);
  if (idx === -1) return null;
  const step = idx + 1;
  const color =
    status === "delivered"
      ? "bg-emerald-500"
      : status === "shipped"
      ? "bg-sky-500"
      : "bg-[#FF5B00]";
  return { step, total: PIPELINE_STEPS.length, color };
}

/** Determine badge styling for how recently an order arrived. */
function arrivalFreshness(placedAt: string | null | undefined): {
  label: string;
  isRecent: boolean;
  toneClass: string;
} {
  const label = timeAgo(placedAt);
  if (!placedAt) {
    return {
      label: "—",
      isRecent: false,
      toneClass: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(placedAt).getTime()) / 1000));
  if (diffSec < 900) {
    // Under 15 minutes
    return {
      label: diffSec < 60 ? "Just now" : label,
      isRecent: true,
      toneClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }
  if (diffSec < 3600) {
    // Under 1 hour
    return {
      label,
      isRecent: false,
      toneClass: "bg-teal-50 text-teal-700 ring-teal-200",
    };
  }
  if (diffSec < 86400) {
    // Under 24 hours
    return {
      label,
      isRecent: false,
      toneClass: "bg-sky-50 text-sky-700 ring-sky-200",
    };
  }
  return {
    label,
    isRecent: false,
    toneClass: "bg-slate-100 text-slate-600 ring-slate-200",
  };
}

export function OrdersManagement({
  initial,
  initialError,
  initialSummary,
  initialFilters,
  initialPage = 1,
  initialPerPage = 25,
  openOrderId,
}: {
  initial: Paginated<AdminOrderRow>;
  initialError: string | null;
  initialSummary: OrdersSummary | null;
  initialFilters: OrderFilters;
  initialPage?: number;
  initialPerPage?: number;
  openOrderId: number | null;
}) {
  const can = useCan();
  const [list, setList] = useState(initial);
  const [summary, setSummary] = useState(initialSummary);
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<number | null>(openOrderId);
  const [, setTick] = useState(0);
  const { notice, error, clear } = useNotice();

  // Keep relative "just now / X mins ago" labels ticking smoothly every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const syncFiltersToUrl = (
    next: OrderFilters,
    nextPage: number,
    nextPerPage: number
  ) => {
    syncUrlParams({
      status: next.status || null,
      payment_status: next.payment_status || null,
      payment_method: next.payment_method || null,
      courier: next.courier || null,
      source: next.source || null,
      preset: next.preset || null,
      from: next.from || null,
      to: next.to || null,
      q: next.q || null,
      product: next.product || null,
      page: nextPage > 1 ? nextPage : null,
      per_page: nextPerPage !== 25 ? nextPerPage : null,
    });
  };

  const load = async (
    next: OrderFilters,
    nextPage: number,
    nextPerPage = perPage,
    withSummary = false,
    silent = false
  ) => {
    if (!silent) setLoading(true);
    const [res, sum] = await Promise.all([
      getAdminOrdersAction({
        status: next.status || undefined,
        payment_status: next.payment_status || undefined,
        payment_method: next.payment_method || undefined,
        courier: next.courier || undefined,
        source: next.source || undefined,
        from: next.from || undefined,
        to: next.to || undefined,
        q: next.q || undefined,
        product: next.product || undefined,
        page: nextPage,
        per_page: nextPerPage,
      }),
      withSummary
        ? getAdminOrdersSummaryAction({
            from: next.from || undefined,
            to: next.to || undefined,
          })
        : Promise.resolve(null),
    ]);
    if (!silent) setLoading(false);
    if (res.success) setList(res.data);
    else if (!silent) error(res.error.message);
    if (sum && sum.success) setSummary(sum.data);
  };

  // Background 1-minute auto-polling (pauses automatically while viewing an order modal)
  const autoPoll = useAutoPoll(
    async () => {
      await load(filters, page, perPage, true, true);
    },
    { intervalMs: 60000, paused: viewing !== null }
  );

  const update = (
    patch: Partial<OrderFilters>,
    opts: { summary?: boolean } = {}
  ) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setPage(1);
    syncFiltersToUrl(next, 1, perPage);
    void load(next, 1, perPage, opts.summary);
  };

  const applyDatePreset = (preset: OrderDatePreset) => {
    const range = resolveOrderDateRange(preset);
    const next: OrderFilters = {
      ...filters,
      preset,
      from: range.from,
      to: range.to,
    };
    clear();
    setFilters(next);
    setPage(1);
    syncFiltersToUrl(next, 1, perPage);
    void load(next, 1, perPage, true);
  };

  const debounced = useDebouncedCallback(
    (patch: Partial<OrderFilters>, base: OrderFilters) => {
      const next = { ...base, ...patch };
      setPage(1);
      syncFiltersToUrl(next, 1, perPage);
      void load(next, 1, perPage);
    }
  );

  const onText = (key: "q" | "product", value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    debounced({ [key]: value }, filters);
  };

  const onDates = (key: "from" | "to", value: string) => {
    const next: OrderFilters = {
      ...filters,
      [key]: value,
      preset: value || filters[key === "from" ? "to" : "from"] ? "custom" : "",
    };
    if (next.from && next.to && next.to < next.from) {
      return error("The end date must be on or after the start date.");
    }
    clear();
    setFilters(next);
    setPage(1);
    syncFiltersToUrl(next, 1, perPage);
    void load(next, 1, perPage, true);
  };

  /** Keep the list row in step with changes made in the detail modal. */
  const onChanged = (o: AdminOrderDetail) => {
    setList((l) => ({
      ...l,
      data: l.data.map((r) =>
        r.id === o.id
          ? {
              ...r,
              status: o.status,
              payment_status: o.payment_status,
              shipment: o.shipment,
              grand_total: o.totals?.grand_total ?? r.grand_total,
              amount_paid: o.totals?.amount_paid ?? r.amount_paid,
              amount_due: o.totals?.amount_due ?? r.amount_due,
            }
          : r
      ),
    }));
  };

  const filtersActive =
    filters.q ||
    filters.product ||
    filters.payment_status ||
    filters.payment_method ||
    filters.courier ||
    filters.source ||
    filters.preset ||
    filters.from ||
    filters.to;

  const by = summary?.by_status ?? {};
  const byPay = summary?.by_payment_status ?? {};

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShoppingBag}
        title="Orders & Fulfilment"
        description="Track every order through the 6-step fulfilment pipeline, book courier consignments, and manage full or partial payments."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AutoPollToggle controller={autoPoll} loading={loading} label="Live 1m" />
            {can("orders.fulfil") ? (
              <Link
                href="/admin/shipments"
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 shadow-2xs"
              >
                <ScanBarcode className="w-4 h-4" /> Scan Station
              </Link>
            ) : null}
          </div>
        }
      />
      <NoticeBanner
        notice={notice ?? (initialError ? { type: "error", message: initialError } : null)}
        onClose={clear}
      />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Orders"
            value={summary.total_orders}
            hint={
              summary.range.from || summary.range.to
                ? `${summary.range.from ?? "…"} to ${summary.range.to ?? "…"}`
                : `${by.pending ?? 0} pending confirmation`
            }
            icon={ShoppingBag}
            tone="orange"
          />
          <StatCard
            label="Confirmed Sales"
            value={formatTaka(summary.sales.amount)}
            hint={`${summary.sales.orders} orders · avg ${formatTaka(summary.sales.average)}`}
            icon={Banknote}
            tone="green"
          />
          <StatCard
            label="Fulfilment Queue"
            value={(by.confirmed ?? 0) + (by.processing ?? 0) + (by.packed ?? 0)}
            hint={`${by.packed ?? 0} packed · ${by.processing ?? 0} processing`}
            icon={PackageCheck}
            tone="amber"
          />
          <StatCard
            label="In Transit / Courier"
            value={by.shipped ?? 0}
            hint={`${by.delivered ?? 0} delivered · ${by.returned ?? 0} returned`}
            icon={Truck}
            tone="blue"
          />
        </div>
      )}

      {/* Status Pipeline Tabs */}
      <Tabs
        tabs={MAIN_TABS.map((s) => ({
          value: s || "all",
          label: s ? metaFor(ORDER_STATUS_META, s).label : "All Orders",
          count: s ? by[s] : summary?.total_orders,
        }))}
        value={filters.status || "all"}
        onChange={(v) => update({ status: v === "all" ? "" : (v as OrderStatus) })}
      />

      {/* Date Range Quick Presets (Today, Yesterday, 1 Week, 2 Weeks, 1 Month, Custom) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-slate-200/80 p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-[#FF5B00]" /> Order Period:
          </span>
          {ORDER_DATE_PRESETS.map((p) => {
            const active = filters.preset === p.value && (p.value !== "" || (!filters.from && !filters.to));
            return (
              <button
                key={p.value || "all"}
                type="button"
                onClick={() => applyDatePreset(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  active
                    ? "bg-[#FF5B00] text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-inset ring-slate-200/70"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom From / To Date Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>From</span>
            <input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => onDates("from", e.target.value)}
              aria-label="Placed from"
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 focus:border-primary focus:bg-white focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>To</span>
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => onDates("to", e.target.value)}
              aria-label="Placed to"
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 focus:border-primary focus:bg-white focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Quick Payment Status Filter Strip */}
      {summary?.by_payment_status && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1 mr-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Filter:
          </span>
          <button
            type="button"
            onClick={() => update({ payment_status: "" })}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
              !filters.payment_status
                ? "bg-slate-900 text-white"
                : "bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            Any Payment
          </button>
          {PAYMENT_STATUSES.map((ps) => {
            const count = byPay[ps] ?? 0;
            const active = filters.payment_status === ps;
            const meta = PAYMENT_STATUS_META[ps];
            return (
              <button
                key={ps}
                type="button"
                onClick={() => update({ payment_status: active ? "" : ps })}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer",
                  active
                    ? "bg-[#FF5B00] text-white"
                    : "bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{meta.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] tabular-nums",
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Additional Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <SearchInput
          value={filters.q}
          onChange={(v) => onText("q", v)}
          placeholder="Order number, customer name or phone"
        />
        <SearchInput
          value={filters.product}
          onChange={(v) => onText("product", v)}
          placeholder="Product name or SKU"
        />
        <Select
          value={filters.payment_method}
          onChange={(e) => update({ payment_method: e.target.value })}
          aria-label="Payment method"
        >
          <option value="">Any payment method</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.courier}
          onChange={(e) => update({ courier: e.target.value })}
          aria-label="Courier"
        >
          <option value="">Any courier</option>
          {COURIERS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.source}
          onChange={(e) => update({ source: e.target.value })}
          aria-label="Order source"
        >
          <option value="">Cart and Buy Now</option>
          <option value="cart">Cart checkout</option>
          <option value="buy_now">Buy Now</option>
        </Select>
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
              syncFiltersToUrl(next, 1, perPage);
              void load(next, 1, perPage, Boolean(filters.from || filters.to));
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <TableShell>
        <THead>
          <th className={`${th} w-12`}>#</th>
          <th className={th}>Order</th>
          <th className={th}>Customer</th>
          <th className={th}>Total & Balance</th>
          <th className={th}>Fulfilment Stage</th>
          <th className={th}>Payment</th>
          <th className={th}>Parcel / Courier</th>
          <th className={th}>Arrived</th>
          <th className={th}>Placed Date</th>
          <th className={`${th} text-right`}>Action</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={10} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={10}>
                <EmptyState
                  icon={ShoppingBag}
                  title="No orders found"
                  description={
                    filtersActive || filters.status
                      ? "Try clearing or adjusting your filters."
                      : "New customer orders will appear here automatically."
                  }
                />
              </td>
            </tr>
          ) : (
            list.data.map((o, idx) => {
              const rowNum =
                ((list.meta?.current_page || page) - 1) *
                  (list.meta?.per_page || perPage) +
                idx +
                1;
              const st = metaFor(ORDER_STATUS_META, o.status);
              const pay = metaFor(PAYMENT_STATUS_META, o.payment_status);
              const parcel = o.shipment
                ? metaFor(SHIPMENT_STATE_META, o.shipment.state)
                : null;
              const progress = getStepProgress(o.status);
              const freshness = arrivalFreshness(o.placed_at);

              return (
                <tr
                  key={o.id}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  onClick={() => setViewing(o.id)}
                >
                  <td className={`${td} text-xs font-mono text-slate-400 tabular-nums`}>
                    {rowNum}
                  </td>
                  <td className={`${td} font-mono font-bold text-slate-900`}>
                    <span className="group-hover:text-[#FF5B00] transition-colors">
                      #{o.number}
                    </span>
                    <span className="block font-sans text-[11px] font-normal text-slate-500">
                      {o.source === "buy_now" ? "Express Buy Now" : "Cart Checkout"}
                    </span>
                  </td>
                  <td className={td}>
                    <div className="font-semibold text-slate-900">
                      {o.customer.name}
                      {o.customer.is_guest && (
                        <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          Guest
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{o.customer.phone}</div>
                  </td>
                  <td className={`${td} tabular-nums font-bold text-slate-900`}>
                    {formatTaka(o.grand_total)}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {o.item_count} item{o.item_count === 1 ? "" : "s"}
                    </span>
                    {o.payment_status === "partially_paid" && (
                      <div className="text-[11px] font-semibold mt-0.5 space-y-0.5">
                        {o.amount_paid !== undefined && (
                          <span className="block text-emerald-700">
                            Paid {formatTaka(o.amount_paid)}
                          </span>
                        )}
                        {o.amount_due !== undefined && (
                          <span className="block text-amber-700">
                            Due {formatTaka(o.amount_due)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    <div className="space-y-1.5">
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {progress ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", progress.color)}
                              style={{
                                width: `${Math.round(
                                  (progress.step / progress.total) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {progress.step}/{progress.total}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className={td}>
                    <Badge tone={pay.tone}>{pay.label}</Badge>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}
                    </span>
                  </td>
                  <td className={td}>
                    {o.shipment && parcel ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-800">
                          {o.shipment.courier_label}
                          {o.shipment.is_sandbox && (
                            <span className="ml-1 text-[10px] text-amber-600 font-bold">
                              TEST
                            </span>
                          )}
                        </div>
                        <Badge tone={parcel.tone}>{parcel.label}</Badge>
                        {o.shipment.tracking_code && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]">
                            #{o.shipment.tracking_code}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  {/* Dedicated Arrived / Time Ago Column */}
                  <td className={`${td} whitespace-nowrap`}>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                        freshness.toneClass
                      )}
                    >
                      {freshness.isRecent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ) : (
                        <Clock className="w-3 h-3 opacity-70" />
                      )}
                      {freshness.label}
                    </span>
                  </td>
                  {/* Placed Date & District Column */}
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`}>
                    <div className="font-medium text-slate-700">
                      {formatDateTime(o.placed_at)}
                    </div>
                    {o.district && (
                      <div className="text-[11px] text-slate-400">{o.district}</div>
                    )}
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
          syncFiltersToUrl(filters, p, perPage);
          void load(filters, p, perPage);
        }}
        onPerPageChange={(pp) => {
          setPerPage(pp);
          setPage(1);
          syncFiltersToUrl(filters, 1, pp);
          void load(filters, 1, pp);
        }}
      />

      {viewing !== null && (
        <OrderDetailModal
          key={viewing}
          orderId={viewing}
          onClose={() => {
            setViewing(null);
            getAdminOrdersSummaryAction({
              from: filters.from || undefined,
              to: filters.to || undefined,
            }).then((s) => {
              if (s.success) setSummary(s.data);
            });
            if (filters.status || filters.payment_status) {
              void load(filters, page, perPage);
            }
          }}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}
