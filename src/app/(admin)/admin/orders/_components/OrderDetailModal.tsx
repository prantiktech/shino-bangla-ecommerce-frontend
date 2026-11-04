"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  History,
  Layers,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  PauseCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Undo2,
  User,
  XCircle,
} from "lucide-react";
import {
  getAdminOrderAction,
  setAdminOrderPaymentAction,
  updateAdminOrderStatusAction,
} from "@/app/(admin)/actions/orders";
import type { AdminOrderDetail, OrderAddress, OrderStatus } from "@/types/admin-orders";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  InlineError,
  Input,
  Modal,
  Spinner,
} from "@/app/(admin)/components/ui";
import {
  bpToPercent,
  formatDateTime,
  formatTaka,
  poishaToTaka,
  takaToPoisha,
} from "@/app/(admin)/components/format";
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  metaFor,
  timeAgo,
} from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";
import { imageSrc } from "@/lib/utils/image";
import { cn } from "@/lib/utils";
import { AdminInvoiceButton, OrderRefundsPanel } from "./OrderRefundsPanel";
import { ShipmentCard, ShipWithCourierDialog } from "./ShipmentPanel";
import { OrderFraudPanel } from "./OrderFraudPanel";

type ModalTab = "overview" | "financials" | "timeline" | "fraud";

/** Standard forward fulfilment pipeline steps. */
const FULFILMENT_STEPS: {
  status: OrderStatus;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    status: "pending",
    label: "Pending",
    shortDesc: "Order placed & stock reserved",
    icon: Clock,
  },
  {
    status: "confirmed",
    label: "Confirmed",
    shortDesc: "Verified by staff or gateway",
    icon: CheckCircle2,
  },
  {
    status: "processing",
    label: "Processing",
    shortDesc: "Picking & preparing items",
    icon: Sparkles,
  },
  {
    status: "packed",
    label: "Packed",
    shortDesc: "Sealed & ready to dispatch",
    icon: PackageCheck,
  },
  {
    status: "shipped",
    label: "Shipped",
    shortDesc: "In transit with courier / rider",
    icon: Truck,
  },
  {
    status: "delivered",
    label: "Delivered",
    shortDesc: "Handed over to customer",
    icon: Award,
  },
];

const QUICK_STATUS_NOTES: Partial<Record<OrderStatus, string[]>> = {
  confirmed: [
    "Confirmed with customer by phone",
    "Delivery address & items verified",
    "Advance payment verified",
  ],
  processing: [
    "Sent to warehouse for picking",
    "Quality check in progress",
  ],
  packed: [
    "Items packed, weighed & invoice attached",
    "Ready for courier pickup",
  ],
  shipped: [
    "Dispatched by store rider",
    "Handed over to courier pickup agent",
  ],
  delivered: [
    "Delivered to customer & confirmed",
    "Received at customer address",
  ],
  on_hold: [
    "Waiting for customer phone confirmation",
    "Customer requested delayed delivery",
    "Awaiting stock transfer from warehouse",
  ],
  cancelled: [
    "Customer requested cancellation",
    "Customer unreachable after multiple calls",
    "Duplicate order placed by customer",
  ],
  returned: [
    "Customer refused delivery at doorstep",
    "Customer unavailable at delivery address",
    "Returned undamaged to warehouse",
  ],
  refunded: [
    "Refund processed to customer",
    "Returned order settled & refunded",
  ],
};

const QUICK_PAYMENT_NOTES = [
  "Advance received via bKash",
  "Advance received via Nagad",
  "Bank transfer verified",
  "Cash collected on delivery",
  "Courier partial settlement",
];

/** Some mutations answer with a trimmed order; fall back to a fresh read so the modal never shows half an order. */
async function ensureFull(
  id: number,
  maybe: AdminOrderDetail | null | undefined
): Promise<AdminOrderDetail | null> {
  if (maybe && Array.isArray(maybe.items) && Array.isArray(maybe.history)) return maybe;
  const res = await getAdminOrderAction(id);
  return res.success ? res.data : maybe ?? null;
}

function formatAddressLines(addr: OrderAddress | null): string {
  if (!addr) return "";
  return [
    addr.name,
    addr.phone,
    [addr.line1, addr.line2].filter(Boolean).join(", "),
    [addr.area, addr.district, addr.division, addr.postcode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}

export function OrderDetailModal({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: number;
  onClose: () => void;
  /** Called with the updated order after any change, so the list row can follow. */
  onChanged: (order: AdminOrderDetail) => void;
}) {
  const can = useCan();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<ModalTab>("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);
  const [confirmUnpaid, setConfirmUnpaid] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialTaka, setPartialTaka] = useState("");
  const [partialNote, setPartialNote] = useState("");
  const [paidNoteOpen, setPaidNoteOpen] = useState(false);
  const [paidNote, setPaidNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAdminOrderAction(orderId).then((res) => {
      if (cancelled) return;
      if (res.success) setOrder(res.data);
      else setLoadError(res.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const copyText = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const apply = (updated: AdminOrderDetail, message: string) => {
    setOrder(updated);
    onChanged(updated);
    setOk(message);
    setErr(null);
  };

  const refresh = async () => {
    setRefreshing(true);
    const res = await getAdminOrderAction(orderId);
    setRefreshing(false);
    if (res.success) {
      setOrder(res.data);
      onChanged(res.data);
    }
  };

  const changeStatus = async () => {
    if (!order || !nextStatus) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    const res = await updateAdminOrderStatusAction(order.id, nextStatus, note);
    if (!res.success) {
      setBusy(false);
      return setErr(res.error.message);
    }
    const full = await ensureFull(order.id, res.data);
    setBusy(false);
    if (full) {
      apply(full, `Order moved to ${metaFor(ORDER_STATUS_META, nextStatus).label}.`);
    }
    setNextStatus("");
    setNote("");
  };

  const setPayment = async (
    paymentStatus: "paid" | "unpaid" | "partially_paid",
    customAmountPoisha?: number,
    customNote?: string
  ) => {
    if (!order) return;
    if (paymentStatus === "partially_paid") {
      const grandTotal = order.totals?.grand_total ?? 0;
      if (!customAmountPoisha || customAmountPoisha < 1 || customAmountPoisha >= grandTotal) {
        return setErr(
          `Partial payment must be greater than ৳0 and less than the order total (${formatTaka(
            grandTotal
          )}). Use "Record Full Payment" if the entire total was collected.`
        );
      }
    }
    setBusy(true);
    setErr(null);
    setOk(null);
    const defaultNote =
      paymentStatus === "paid"
        ? "Full payment recorded in the back office"
        : paymentStatus === "partially_paid"
        ? `Partial payment (${formatTaka(customAmountPoisha)}) recorded in the back office`
        : "Marked unpaid in the back office";
    const res = await setAdminOrderPaymentAction(
      order.id,
      paymentStatus,
      customNote?.trim() || defaultNote,
      paymentStatus === "partially_paid" ? customAmountPoisha : undefined
    );
    setConfirmUnpaid(false);
    if (!res.success) {
      setBusy(false);
      return setErr(res.error.message);
    }
    const full = await ensureFull(order.id, res.data);
    setBusy(false);
    setPartialOpen(false);
    setPartialTaka("");
    setPartialNote("");
    setPaidNoteOpen(false);
    setPaidNote("");
    if (full) {
      apply(
        full,
        paymentStatus === "paid"
          ? "Full payment recorded."
          : paymentStatus === "partially_paid"
          ? `Partial payment (${formatTaka(customAmountPoisha)}) recorded.`
          : "Order marked unpaid."
      );
    }
  };

  // Compute timestamps for each step from order fields & history
  const stepTimestamps = useMemo(() => {
    const map: Partial<Record<OrderStatus, { at: string; by?: string | null; note?: string | null }>> = {};
    if (!order) return map;
    if (order.placed_at) {
      map.pending = { at: order.placed_at, by: null, note: "Order placed" };
    }
    if (order.confirmed_at) {
      map.confirmed = { at: order.confirmed_at };
    }
    if (order.delivered_at) {
      map.delivered = { at: order.delivered_at };
    }
    if (order.cancelled_at) {
      map.cancelled = { at: order.cancelled_at };
    }
    if (Array.isArray(order.history)) {
      for (const h of order.history) {
        if (h.to) {
          map[h.to] = { at: h.at, by: h.by, note: h.note };
        }
      }
    }
    return map;
  }, [order]);

  // Determine where the order is in the 6-step fulfilment pipeline
  const pipelineInfo = useMemo(() => {
    if (!order) {
      return {
        activeIndex: 0,
        heldFromStatus: null as OrderStatus | null,
        isTerminalException: false,
      };
    }

    const directIdx = FULFILMENT_STEPS.findIndex((s) => s.status === order.status);
    if (directIdx !== -1) {
      return {
        activeIndex: directIdx,
        heldFromStatus: null as OrderStatus | null,
        isTerminalException: false,
      };
    }

    // For on_hold, cancelled, returned, refunded: find the last standard pipeline step from history
    let lastStandardStatus: OrderStatus = "pending";
    if (Array.isArray(order.history)) {
      for (const h of order.history) {
        if (h.from && FULFILMENT_STEPS.some((s) => s.status === h.from)) {
          lastStandardStatus = h.from;
        }
        if (h.to && FULFILMENT_STEPS.some((s) => s.status === h.to)) {
          lastStandardStatus = h.to;
        }
      }
    }
    const fallbackIdx = Math.max(
      0,
      FULFILMENT_STEPS.findIndex((s) => s.status === lastStandardStatus)
    );

    return {
      activeIndex: fallbackIdx,
      heldFromStatus: order.status === "on_hold" ? lastStandardStatus : null,
      isTerminalException: ["cancelled", "returned", "refunded"].includes(order.status),
    };
  }, [order]);

  const status = order ? metaFor(ORDER_STATUS_META, order.status) : null;
  const payment = order ? metaFor(PAYMENT_STATUS_META, order.payment_status) : null;
  const canShipWithCourier =
    !!order && order.status === "packed" && !order.shipment && can("orders.fulfil");
  const transitions = order?.allowed_transitions ?? [];
  const allowedStatusSet = new Set(transitions.map((t) => t.status));

  const canRecordPayment =
    !!order &&
    !["paid", "refunded", "partially_refunded"].includes(order.payment_status) &&
    !["cancelled", "refunded"].includes(order.status);
  const canMarkUnpaid =
    !!order &&
    ["paid", "partially_paid"].includes(order.payment_status) &&
    order.payment_method !== "sslcommerz";

  // Financial & Margin calculations
  const grandTotal = order?.totals?.grand_total ?? 0;
  const amountPaid =
    order?.totals?.amount_paid ??
    (order?.payment_status === "paid" ? grandTotal : 0);
  const amountDue =
    order?.totals?.amount_due ?? Math.max(0, grandTotal - amountPaid);
  const paidPercent =
    grandTotal > 0 ? Math.min(100, Math.round((amountPaid / grandTotal) * 100)) : 0;

  const totalCost =
    order?.totals?.cost ??
    order?.items?.reduce(
      (sum, it) => sum + (it.unit_cost ? it.unit_cost * it.quantity : 0),
      0
    ) ??
    0;
  const hasCostData = totalCost > 0;
  const netProductRevenue = (order?.totals?.subtotal ?? 0) - (order?.totals?.discount ?? 0);
  const estimatedGrossProfit = hasCostData ? netProductRevenue - totalCost : null;
  const estimatedMarginPct =
    hasCostData && netProductRevenue > 0
      ? ((netProductRevenue - totalCost) / netProductRevenue) * 100
      : null;

  const totalItemsQuantity =
    order?.items?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;

  // Separate forward transitions vs hold/exception transitions
  const forwardTransitions = transitions.filter(
    (t) => !["on_hold", "cancelled", "returned", "refunded"].includes(t.status)
  );
  const exceptionTransitions = transitions.filter((t) =>
    ["on_hold", "cancelled", "returned", "refunded"].includes(t.status)
  );

  // Preview for partial payment input
  const previewPartialPoisha = takaToPoisha(partialTaka) ?? 0;
  const previewRemainingPoisha = Math.max(0, grandTotal - previewPartialPoisha);

  return (
    <>
      <Modal
        open
        onClose={() => !busy && !shipping && !confirmUnpaid && onClose()}
        size="xl"
        title={order ? `Order #${order.number}` : "Order Workspace"}
        description={
          order
            ? `Placed ${formatDateTime(order.placed_at)} (${timeAgo(order.placed_at)}) · ${
                order.source === "buy_now" ? "Express Buy Now" : "Standard Cart Checkout"
              }`
            : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              {order ? (
                <span>
                  Order ID <span className="font-mono font-semibold text-slate-700">#{order.id}</span>
                  {order.currency ? ` · Currency: ${order.currency}` : ""}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {order && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={refresh}
                  disabled={busy}
                >
                  Refresh
                </Button>
              )}
              <Button variant="secondary" onClick={onClose} disabled={busy}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        {loadError ? (
          <InlineError message={loadError} />
        ) : !order ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="w-7 h-7" />
            <p className="text-xs font-medium text-slate-500">Loading complete order workspace…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Status & Quick Action Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white p-4 shadow-sm">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                  <span className="text-xs font-mono font-bold tracking-wide text-white">
                    #{order.number}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText("order_num", order.number)}
                    className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy order number"
                  >
                    {copiedKey === "order_num" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {status && <Badge tone={status.tone}>{status.label}</Badge>}
                {payment && <Badge tone={payment.tone}>{payment.label}</Badge>}

                <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                  {order.payment_method_label}
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">
                  <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                  {order.source === "buy_now" ? "Buy Now" : "Cart"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-right mr-2 hidden sm:block">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Order Total
                  </div>
                  <div className="text-base font-black tabular-nums text-white">
                    {formatTaka(grandTotal)}
                  </div>
                </div>
                <AdminInvoiceButton orderId={order.id} />
              </div>
            </div>

            {/* Alerts */}
            <InlineError message={err} />
            {ok && (
              <div
                role="status"
                className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {ok}
                </span>
                <button
                  type="button"
                  onClick={() => setOk(null)}
                  className="text-xs text-emerald-700 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ================================================================= */}
            {/* PROFESSIONAL VISUAL LIFECYCLE STEPPER                             */}
            {/* ================================================================= */}
            <section className="rounded-2xl ring-1 ring-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FF5B00]" />
                    Order Fulfilment Lifecycle
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any unlocked next stage on the stepper or action bar below to transition this order.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Current Stage:</span>
                  {status && <Badge tone={status.tone}>{status.label}</Badge>}
                </div>
              </div>

              {/* Exception / Hold Banner inside Stepper */}
              {order.status === "on_hold" && (
                <div className="rounded-xl bg-amber-50/90 ring-1 ring-amber-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 space-y-0.5">
                      <p className="font-bold text-sm">
                        Order is currently On Hold
                        {pipelineInfo.heldFromStatus
                          ? ` (paused at ${metaFor(ORDER_STATUS_META, pipelineInfo.heldFromStatus).label})`
                          : ""}
                      </p>
                      <p className="text-amber-800">
                        Stock remains reserved and payment timeout is paused. Resume back to{" "}
                        <strong>
                          {pipelineInfo.heldFromStatus
                            ? metaFor(ORDER_STATUS_META, pipelineInfo.heldFromStatus).label
                            : "its previous step"}
                        </strong>{" "}
                        when ready.
                      </p>
                      {stepTimestamps.on_hold?.note && (
                        <p className="italic text-amber-900 pt-0.5">
                          Hold reason: &ldquo;{stepTimestamps.on_hold.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  {forwardTransitions.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setNextStatus(forwardTransitions[0].status)}
                    >
                      Resume to {metaFor(ORDER_STATUS_META, forwardTransitions[0].status).label}
                    </Button>
                  )}
                </div>
              )}

              {(order.status === "cancelled" ||
                order.status === "returned" ||
                order.status === "refunded") && (
                <div
                  className={cn(
                    "rounded-xl p-3.5 ring-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    order.status === "cancelled"
                      ? "bg-rose-50/90 ring-rose-200 text-rose-900"
                      : order.status === "returned"
                      ? "bg-purple-50/90 ring-purple-200 text-purple-900"
                      : "bg-slate-100 ring-slate-300 text-slate-900"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {order.status === "cancelled" ? (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <RotateCcw className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-sm">
                        Order {metaFor(ORDER_STATUS_META, order.status).label}
                        {stepTimestamps[order.status]?.at
                          ? ` on ${formatDateTime(stepTimestamps[order.status]!.at)}`
                          : ""}
                      </p>
                      {stepTimestamps[order.status]?.note && (
                        <p className="font-medium">
                          Note: &ldquo;{stepTimestamps[order.status]!.note}&rdquo;
                        </p>
                      )}
                      {order.stock_released_at && (
                        <p className="opacity-80">
                          Reserved inventory was returned to stock on{" "}
                          {formatDateTime(order.stock_released_at)}.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6-Step Horizontal Pipeline */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {FULFILMENT_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const stamp = stepTimestamps[step.status];
                  const isCurrent = order.status === step.status;
                  const isCompleted =
                    !pipelineInfo.isTerminalException &&
                    (idx < pipelineInfo.activeIndex ||
                      (order.status === "delivered" && idx === pipelineInfo.activeIndex));
                  const isPassedBeforeException =
                    pipelineInfo.isTerminalException && idx <= pipelineInfo.activeIndex;
                  const isAllowedNext = allowedStatusSet.has(step.status);
                  const isSelectedNext = nextStatus === step.status;

                  return (
                    <button
                      key={step.status}
                      type="button"
                      disabled={!isAllowedNext || busy}
                      onClick={() => {
                        if (isAllowedNext) {
                          setNextStatus(isSelectedNext ? "" : step.status);
                        }
                      }}
                      className={cn(
                        "group relative text-left rounded-xl p-3 transition-all flex flex-col justify-between min-h-[106px] border",
                        isSelectedNext
                          ? "bg-orange-50/90 border-[#FF5B00] ring-2 ring-[#FF5B00]/30 shadow-xs cursor-pointer"
                          : isCurrent
                          ? "bg-orange-50/50 border-[#FF5B00] ring-1 ring-[#FF5B00]/20"
                          : isCompleted
                          ? "bg-emerald-50/40 border-emerald-200/80"
                          : isPassedBeforeException
                          ? "bg-slate-50 border-slate-200 opacity-75"
                          : isAllowedNext
                          ? "bg-white border-slate-200 hover:border-[#FF5B00] hover:bg-orange-50/20 cursor-pointer shadow-2xs"
                          : "bg-slate-50/60 border-slate-200/60 opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                            isCurrent || isSelectedNext
                              ? "bg-[#FF5B00] text-white shadow-xs"
                              : isCompleted
                              ? "bg-emerald-600 text-white"
                              : isPassedBeforeException
                              ? "bg-slate-400 text-white"
                              : isAllowedNext
                              ? "bg-slate-100 text-slate-700 group-hover:bg-[#FF5B00] group-hover:text-white"
                              : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                        </span>

                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Step {idx + 1}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              isCurrent || isSelectedNext
                                ? "text-[#FF5B00]"
                                : isCompleted
                                ? "text-emerald-900"
                                : "text-slate-800"
                            )}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-[#FF5B00] animate-pulse" />
                          )}
                        </div>

                        {stamp?.at ? (
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight font-medium">
                            {formatDateTime(stamp.at)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                            {isAllowedNext ? "Click to move here →" : step.shortDesc}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Controls for Next Transitions */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {canShipWithCourier && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-orange-50 via-amber-50/60 to-white ring-1 ring-orange-200 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#FF5B00] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Truck className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Ready for Courier Dispatch
                        </p>
                        <p className="text-xs text-slate-600">
                          This order is packed. Book it with Steadfast, Pathao, or RedX to generate a consignment & tracking link automatically.
                        </p>
                      </div>
                    </div>
                    <Button size="sm" icon={Truck} onClick={() => setShipping(true)}>
                      Ship with Courier
                    </Button>
                  </div>
                )}

                {transitions.length === 0 ? (
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-xl px-3.5 py-2.5">
                    <span>
                      {["delivered", "cancelled", "returned", "refunded"].includes(order.status)
                        ? "This order has reached a final state; no further status transitions apply."
                        : "No status transitions available for your role on this order."}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-500 mr-1">
                          Available Actions:
                        </span>
                        {forwardTransitions.map((t) => {
                          const m = metaFor(ORDER_STATUS_META, t.status);
                          const active = nextStatus === t.status;
                          return (
                            <button
                              key={t.status}
                              type="button"
                              disabled={busy}
                              onClick={() => setNextStatus(active ? "" : t.status)}
                              className={cn(
                                "h-8 px-3.5 rounded-lg text-xs font-bold ring-1 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                                active
                                  ? "bg-[#FF5B00] text-white ring-[#FF5B00] shadow-xs"
                                  : "bg-slate-900 text-white ring-slate-900 hover:bg-slate-800"
                              )}
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              {t.status === "shipped" && order.status === "packed"
                                ? "Mark Shipped by Hand"
                                : `Move to ${m.label}`}
                            </button>
                          );
                        })}

                        {exceptionTransitions.map((t) => {
                          const m = metaFor(ORDER_STATUS_META, t.status);
                          const active = nextStatus === t.status;
                          const isDanger =
                            t.status === "cancelled" || t.status === "returned";
                          return (
                            <button
                              key={t.status}
                              type="button"
                              disabled={busy}
                              onClick={() => setNextStatus(active ? "" : t.status)}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs font-semibold ring-1 transition-all cursor-pointer disabled:opacity-50",
                                active
                                  ? isDanger
                                    ? "bg-rose-600 text-white ring-rose-600"
                                    : "bg-slate-800 text-white ring-slate-800"
                                  : isDanger
                                  ? "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50"
                                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                              )}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Transition Confirmation Panel with Quick Note Templates */}
                    {nextStatus && (
                      <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200/90 p-3.5 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>Transitioning:</span>
                            {status && <Badge tone={status.tone}>{status.label}</Badge>}
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <Badge tone={metaFor(ORDER_STATUS_META, nextStatus).tone}>
                              {metaFor(ORDER_STATUS_META, nextStatus).label}
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNextStatus("");
                              setNote("");
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        {(QUICK_STATUS_NOTES[nextStatus]?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-medium text-slate-500">
                              Quick notes:
                            </span>
                            {QUICK_STATUS_NOTES[nextStatus]!.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setNote(preset)}
                                className={cn(
                                  "text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
                                  note === preset
                                    ? "bg-orange-50 border-[#FF5B00] text-[#FF5B00] font-semibold"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                )}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                          <Field label="Status update note (recorded in audit trail)" className="flex-1">
                            <Input
                              value={note}
                              maxLength={500}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder={
                                nextStatus === "cancelled"
                                  ? "Reason for cancelling this order…"
                                  : "Optional note for staff & customer history…"
                              }
                            />
                          </Field>
                          <Button
                            loading={busy}
                            variant={
                              nextStatus === "cancelled" || nextStatus === "returned"
                                ? "danger"
                                : "primary"
                            }
                            onClick={changeStatus}
                          >
                            Confirm {metaFor(ORDER_STATUS_META, nextStatus).label}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ================================================================= */}
            {/* WORKSPACE TABS                                                    */}
            {/* ================================================================= */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
              {(
                [
                  {
                    id: "overview" as const,
                    label: "Order & Fulfilment",
                    count: order.items.length,
                  },
                  {
                    id: "financials" as const,
                    label: "Payments, Refunds & Profit",
                    count: order.payments?.length || undefined,
                  },
                  {
                    id: "timeline" as const,
                    label: "History & Technical Info",
                    count: order.history.length,
                  },
                  ...(can("fraud.view")
                    ? [{ id: "fraud" as const, label: "Fraud & Risk Check", count: undefined }]
                    : []),
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    tab === t.id
                      ? "border-[#FF5B00] text-[#FF5B00]"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px]",
                        tab === t.id
                          ? "bg-orange-100 text-[#FF5B00]"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ================================================================= */}
            {/* TAB 1: ORDER & FULFILMENT                                         */}
            {/* ================================================================= */}
            {tab === "overview" && (
              <div className="space-y-5">
                {/* Payment Quick Bar */}
                <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-slate-900">
                          Payment Collection
                        </span>
                        {payment && <Badge tone={payment.tone}>{payment.label}</Badge>}
                        <span className="text-xs text-slate-500">
                          via {order.payment_method_label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-600">
                          Collected:{" "}
                          <strong className="text-emerald-700 tabular-nums">
                            {formatTaka(amountPaid)}
                          </strong>{" "}
                          ({paidPercent}%)
                        </span>
                        <span className="text-slate-600">
                          Remaining Due:{" "}
                          <strong
                            className={cn(
                              "tabular-nums",
                              amountDue > 0 ? "text-amber-700" : "text-slate-700"
                            )}
                          >
                            {formatTaka(amountDue)}
                          </strong>
                        </span>
                        <span className="text-slate-600">
                          Total:{" "}
                          <strong className="text-slate-900 tabular-nums">
                            {formatTaka(grandTotal)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canRecordPayment && can("orders.update") && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => {
                              setPartialTaka(
                                amountPaid > 0 ? poishaToTaka(amountPaid) : ""
                              );
                              setPartialOpen((v) => !v);
                              setPaidNoteOpen(false);
                            }}
                          >
                            {order.payment_status === "partially_paid"
                              ? "Update Partial Paid"
                              : "Record Partial"}
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            icon={Check}
                            disabled={busy}
                            onClick={() => {
                              setPaidNoteOpen((v) => !v);
                              setPartialOpen(false);
                            }}
                          >
                            Record Full Paid
                          </Button>
                        </>
                      )}
                      {canMarkUnpaid && can("orders.update") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Undo2}
                          disabled={busy}
                          onClick={() => setConfirmUnpaid(true)}
                        >
                          Mark Unpaid
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        paidPercent >= 100
                          ? "bg-emerald-500"
                          : paidPercent > 0
                          ? "bg-sky-500"
                          : "bg-amber-400"
                      )}
                      style={{ width: `${Math.max(paidPercent, 3)}%` }}
                    />
                  </div>

                  {/* Record Full Paid Drawer */}
                  {paidNoteOpen && can("orders.update") && (
                    <div className="rounded-xl bg-emerald-50/60 ring-1 ring-emerald-200 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">
                          Mark Full Order Total ({formatTaka(grandTotal)}) as Paid
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaidNoteOpen(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {QUICK_PAYMENT_NOTES.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPaidNote(preset)}
                            className={cn(
                              "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer",
                              paidNote === preset
                                ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                                : "bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100/50"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                        <Field label="Payment note (optional)" className="flex-1">
                          <Input
                            value={paidNote}
                            maxLength={500}
                            onChange={(e) => setPaidNote(e.target.value)}
                            placeholder="e.g. Full amount collected on delivery / bKash TrxID…"
                          />
                        </Field>
                        <Button
                          size="sm"
                          variant="success"
                          icon={Check}
                          loading={busy}
                          onClick={() => setPayment("paid", undefined, paidNote)}
                        >
                          Confirm Full Paid ({formatTaka(grandTotal)})
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Record Partial Payment Drawer */}
                  {partialOpen && can("orders.update") && (
                    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Record Cumulative Partial Payment (total received so far)
                        </span>
                        <button
                          type="button"
                          onClick={() => setPartialOpen(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Quick Amount Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-500">
                          Quick amounts:
                        </span>
                        {order.totals.shipping > 0 &&
                          order.totals.shipping < grandTotal && (
                            <button
                              type="button"
                              onClick={() =>
                                setPartialTaka(poishaToTaka(order.totals.shipping))
                              }
                              className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#FF5B00] cursor-pointer"
                            >
                              Delivery Fee ({formatTaka(order.totals.shipping)})
                            </button>
                          )}
                        {[25, 50, 75].map((pct) => {
                          const pVal = Math.round((grandTotal * pct) / 100);
                          if (pVal <= 0 || pVal >= grandTotal) return null;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setPartialTaka(poishaToTaka(pVal))}
                              className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#FF5B00] cursor-pointer"
                            >
                              {pct}% ({formatTaka(pVal)})
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Note Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-500">
                          Quick notes:
                        </span>
                        {QUICK_PAYMENT_NOTES.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPartialNote(preset)}
                            className={cn(
                              "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer",
                              partialNote === preset
                                ? "bg-orange-50 border-[#FF5B00] text-[#FF5B00] font-semibold"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                        <Field
                          label={`Total collected so far (৳, max ${(
                            grandTotal / 100 -
                            0.01
                          ).toFixed(2)})`}
                          className="sm:w-60"
                        >
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={partialTaka}
                            onChange={(e) => setPartialTaka(e.target.value)}
                            placeholder="e.g. 500"
                          />
                        </Field>
                        <Field label="Note (optional)" className="flex-1">
                          <Input
                            value={partialNote}
                            maxLength={500}
                            onChange={(e) => setPartialNote(e.target.value)}
                            placeholder="e.g. ৳500 advance via bKash"
                          />
                        </Field>
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() =>
                            setPayment(
                              "partially_paid",
                              takaToPoisha(partialTaka) ?? 0,
                              partialNote
                            )
                          }
                        >
                          Save Partial
                        </Button>
                      </div>

                      {previewPartialPoisha > 0 && previewPartialPoisha < grandTotal && (
                        <div className="text-xs text-slate-600 flex items-center gap-4 pt-1">
                          <span>
                            New Paid:{" "}
                            <strong className="text-emerald-700">
                              {formatTaka(previewPartialPoisha)}
                            </strong>
                          </span>
                          <span>
                            New Balance Due:{" "}
                            <strong className="text-amber-700">
                              {formatTaka(previewRemainingPoisha)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Courier Parcel Card */}
                {order.shipment && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#FF5B00]" /> Courier Shipment & Tracking
                    </h3>
                    <ShipmentCard
                      orderId={order.id}
                      shipment={order.shipment}
                      canSync={can("orders.fulfil")}
                      onUpdated={(o) => {
                        setOrder(o);
                        onChanged(o);
                      }}
                    />
                  </section>
                )}

                {/* Customer Note Banner */}
                {order.customer_note && (
                  <section className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm text-amber-900 flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Customer Delivery Note: </span>
                      <span>{order.customer_note}</span>
                    </div>
                  </section>
                )}

                {/* Customer, Shipping Address & Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer Info Card */}
                  <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 space-y-2.5 text-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-[#FF5B00]" /> Customer
                        </h3>
                        <div className="flex items-center gap-1">
                          {order.customer.is_guest ? (
                            <Badge tone="slate">Guest</Badge>
                          ) : (
                            <Badge tone="green">Registered</Badge>
                          )}
                          {order.customer.account_type && (
                            <Badge
                              tone={
                                order.customer.account_type === "wholesale"
                                  ? "purple"
                                  : "blue"
                              }
                            >
                              {order.customer.account_type}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="font-bold text-slate-900 text-base">
                          {order.customer.name}
                        </p>
                        {order.customer.group && (
                          <p className="text-xs text-slate-500">
                            Group: <strong className="text-slate-700">{order.customer.group}</strong>
                            {order.customer.id ? ` · ID #${order.customer.id}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 hover:text-[#FF5B00]"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {order.customer.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => copyText("phone", order.customer.phone)}
                            className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy phone number"
                          >
                            {copiedKey === "phone" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {order.customer.email && (
                          <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                            <a
                              href={`mailto:${order.customer.email}`}
                              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-[#FF5B00] truncate"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{order.customer.email}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText("email", order.customer.email!)}
                              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                              title="Copy email"
                            >
                              {copiedKey === "email" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(order.customer.phone)}`}
                        onClick={onClose}
                        className="text-[#FF5B00] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        All orders by this phone <ExternalLink className="w-3 h-3" />
                      </Link>
                      {can("fraud.view") && (
                        <button
                          type="button"
                          onClick={() => setTab("fraud")}
                          className="text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Fraud check
                        </button>
                      )}
                    </div>
                  </section>

                  {/* Shipping & Billing Address Card */}
                  <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 space-y-2.5 text-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#FF5B00]" /> Delivery Address
                        </h3>
                        {order.shipping_address && (
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                "addr",
                                formatAddressLines(order.shipping_address)
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                            title="Copy full address"
                          >
                            {copiedKey === "addr" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {order.shipping_address ? (
                        <div className="space-y-1 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                          <p className="font-bold text-slate-900 text-sm">
                            {order.shipping_address.name}
                          </p>
                          {order.shipping_address.phone && (
                            <p className="font-mono text-slate-700">
                              {order.shipping_address.phone}
                            </p>
                          )}
                          <p className="text-slate-700 leading-relaxed">
                            {[
                              order.shipping_address.line1,
                              order.shipping_address.line2,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          <p className="font-medium text-slate-800">
                            {[
                              order.shipping_address.area,
                              order.shipping_address.district,
                              order.shipping_address.division,
                              order.shipping_address.postcode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs">No shipping address recorded.</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                      {order.delivery?.zone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Shipping Zone:</span>
                          <span className="font-bold text-[#FF5B00]">
                            {order.delivery.zone}
                            {order.delivery.days_min
                              ? ` (${order.delivery.days_min}–${
                                  order.delivery.days_max ?? order.delivery.days_min
                                }d)`
                              : ""}
                          </span>
                        </div>
                      )}
                      {order.delivery?.weight_grams ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total Parcel Weight:</span>
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {(order.delivery.weight_grams / 1000).toFixed(2)} kg (
                            {order.delivery.weight_grams} g)
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  {/* Financial Totals Summary Card */}
                  <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 space-y-2 text-sm flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900">Order Totals</h3>
                        {order.coupon_code && (
                          <Badge tone="orange">Coupon: {order.coupon_code}</Badge>
                        )}
                      </div>

                      <Row
                        label={`Subtotal (${totalItemsQuantity} qty)`}
                        value={formatTaka(order.totals.subtotal)}
                      />
                      {order.totals.discount > 0 && (
                        <Row
                          label={`Discount${
                            order.coupon_code ? ` (${order.coupon_code})` : ""
                          }`}
                          value={`−${formatTaka(order.totals.discount)}`}
                          valueClass="text-emerald-700 font-medium"
                        />
                      )}
                      {order.totals.vat > 0 && (
                        <Row label="Product VAT" value={formatTaka(order.totals.vat)} />
                      )}
                      <Row
                        label="Delivery Charge"
                        value={
                          order.totals.shipping > 0
                            ? formatTaka(order.totals.shipping)
                            : "Free (৳0)"
                        }
                      />
                      {(order.totals.shipping_vat ?? 0) > 0 && (
                        <Row
                          label="Delivery VAT"
                          value={formatTaka(order.totals.shipping_vat!)}
                        />
                      )}

                      <div className="flex justify-between pt-2 mt-1 border-t border-slate-200 font-black text-slate-900 text-base">
                        <span>Grand Total</span>
                        <span className="tabular-nums">{formatTaka(grandTotal)}</span>
                      </div>

                      <div className="flex justify-between text-emerald-700 text-xs pt-1">
                        <span>Amount Paid</span>
                        <span className="tabular-nums font-bold">
                          {formatTaka(amountPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between text-amber-700 text-xs">
                        <span>Amount Due</span>
                        <span className="tabular-nums font-bold">
                          {formatTaka(amountDue)}
                        </span>
                      </div>
                    </div>

                    {hasCostData && estimatedGrossProfit !== null && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          Est. Gross Profit:
                        </span>
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            estimatedGrossProfit >= 0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          )}
                        >
                          {formatTaka(estimatedGrossProfit)}
                          {estimatedMarginPct !== null
                            ? ` (${estimatedMarginPct.toFixed(1)}%)`
                            : ""}
                        </span>
                      </div>
                    )}
                  </section>
                </div>

                {/* Rich Line Items Table */}
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#FF5B00]" /> Order Line Items (
                      {order.items.length} line{order.items.length === 1 ? "" : "s"} ·{" "}
                      {totalItemsQuantity} unit{totalItemsQuantity === 1 ? "" : "s"})
                    </h3>
                    {hasCostData && (
                      <span className="text-xs text-slate-500">
                        Total COGS:{" "}
                        <strong className="text-slate-800 tabular-nums">
                          {formatTaka(totalCost)}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="rounded-2xl ring-1 ring-slate-200 bg-white overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-center font-bold w-10">#</th>
                          <th className="px-3 py-2.5 text-left font-bold">Product & Variant</th>
                          <th className="px-3 py-2.5 text-left font-bold">SKU / Pricing</th>
                          <th className="px-3 py-2.5 text-right font-bold">Qty</th>
                          <th className="px-3 py-2.5 text-right font-bold">Unit Price</th>
                          {hasCostData && (
                            <th className="px-3 py-2.5 text-right font-bold">Unit Cost</th>
                          )}
                          <th className="px-3 py-2.5 text-right font-bold">VAT</th>
                          <th className="px-3 py-2.5 text-right font-bold">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((it, idx) => {
                          const thumb = imageSrc(it.image, "thumb");
                          return (
                            <tr key={it.id} className="hover:bg-slate-50/60">
                              <td className="px-3 py-3 text-center text-xs font-mono text-slate-400 tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  {thumb ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={thumb}
                                      alt={it.name}
                                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0 bg-white"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900">
                                      {it.name}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                      {it.label && (
                                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                          {it.label}
                                        </span>
                                      )}
                                      {it.discount > 0 && (
                                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          −{formatTaka(it.discount)} discount
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                                  <span>{it.sku ?? "—"}</span>
                                  {it.sku && (
                                    <button
                                      type="button"
                                      onClick={() => copyText(`sku_${it.id}`, it.sku!)}
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                      title="Copy SKU"
                                    >
                                      {copiedKey === `sku_${it.id}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                {it.price_source && (
                                  <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                                    {it.price_source.replace(/_/g, " ")} price
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                                {it.quantity}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-800">
                                {formatTaka(it.unit_price)}
                              </td>
                              {hasCostData && (
                                <td className="px-3 py-3 text-right tabular-nums text-xs text-slate-500">
                                  {it.unit_cost ? formatTaka(it.unit_cost) : "—"}
                                </td>
                              )}
                              <td className="px-3 py-3 text-right tabular-nums text-xs text-slate-600">
                                {it.vat > 0 ? (
                                  <div>
                                    <div>{formatTaka(it.vat)}</div>
                                    {it.vat_rate_bp ? (
                                      <div className="text-[10px] text-slate-400">
                                        ({bpToPercent(it.vat_rate_bp)}%)
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                                {formatTaka(it.line_total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: PAYMENTS, REFUNDS & PROFITABILITY                          */}
            {/* ================================================================= */}
            {tab === "financials" && (
              <div className="space-y-5">
                {/* Profitability & Margin Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Grand Total
                    </div>
                    <div className="text-lg font-black text-slate-900 tabular-nums mt-1">
                      {formatTaka(grandTotal)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {order.payment_method_label}
                    </div>
                  </div>

                  <div className="rounded-xl ring-1 ring-emerald-200 bg-emerald-50/40 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Amount Paid
                    </div>
                    <div className="text-lg font-black text-emerald-800 tabular-nums mt-1">
                      {formatTaka(amountPaid)}
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      {paidPercent}% of order total
                    </div>
                  </div>

                  <div className="rounded-xl ring-1 ring-amber-200 bg-amber-50/40 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Balance Due
                    </div>
                    <div className="text-lg font-black text-amber-800 tabular-nums mt-1">
                      {formatTaka(amountDue)}
                    </div>
                    <div className="text-xs text-amber-700 mt-0.5">
                      {amountDue > 0 ? "Pending collection" : "Settled in full"}
                    </div>
                  </div>

                  <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Est. Gross Profit
                    </div>
                    <div className="text-lg font-black text-slate-900 tabular-nums mt-1">
                      {estimatedGrossProfit !== null
                        ? formatTaka(estimatedGrossProfit)
                        : "—"}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {hasCostData
                        ? `COGS ${formatTaka(totalCost)}${
                            estimatedMarginPct !== null
                              ? ` · ${estimatedMarginPct.toFixed(1)}% margin`
                              : ""
                          }`
                        : "No item cost recorded"}
                    </div>
                  </div>
                </div>

                {/* Gateway / Recorded Payment Transactions */}
                <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#FF5B00]" /> Payment Attempts & Ledger
                    </h3>
                    {order.payment_expires_at && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium">
                        Gateway window expires: {formatDateTime(order.payment_expires_at)}
                      </span>
                    )}
                  </div>

                  {!order.payments || order.payments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      No separate gateway transaction rows recorded for this order. Current payment state is{" "}
                      <strong>{payment?.label}</strong> ({formatTaka(amountPaid)} paid).
                    </p>
                  ) : (
                    <div className="rounded-xl ring-1 ring-slate-200 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase">
                          <tr>
                            <th className="px-3 py-2 text-center font-bold w-10">#</th>
                            <th className="px-3 py-2 text-left font-bold">Method</th>
                            <th className="px-3 py-2 text-left font-bold">Status</th>
                            <th className="px-3 py-2 text-right font-bold">Amount</th>
                            <th className="px-3 py-2 text-left font-bold">Reference / Note</th>
                            <th className="px-3 py-2 text-right font-bold">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.payments.map((p, idx) => (
                            <tr key={p.id ?? idx}>
                              <td className="px-3 py-2 text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-800 uppercase">
                                {p.method ?? order.payment_method}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  tone={
                                    p.status === "paid" || p.status === "valid"
                                      ? "green"
                                      : p.status === "failed"
                                      ? "red"
                                      : "amber"
                                  }
                                >
                                  {p.status ?? "recorded"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">
                                {p.amount !== undefined ? formatTaka(p.amount) : "—"}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {p.reference && (
                                  <span className="font-mono font-semibold text-slate-800 mr-2">
                                    Ref: {p.reference}
                                  </span>
                                )}
                                {p.note && <span>{p.note}</span>}
                                {!p.reference && !p.note && "—"}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-500">
                                {formatDateTime(p.paid_at ?? p.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Online Refunds Panel */}
                <OrderRefundsPanel orderId={order.id} onRefunded={refresh} />
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: HISTORY & TECHNICAL METADATA                               */}
            {/* ================================================================= */}
            {tab === "timeline" && (
              <div className="space-y-5">
                {/* Key Lifecycle Timestamps & Technical Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5 space-y-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Placed At
                    </span>
                    <p className="font-bold text-slate-900">
                      {formatDateTime(order.placed_at)}
                    </p>
                    <p className="text-slate-500">{timeAgo(order.placed_at)}</p>
                  </div>

                  <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5 space-y-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed At
                    </span>
                    <p className="font-bold text-slate-900">
                      {formatDateTime(order.confirmed_at)}
                    </p>
                    <p className="text-slate-500">
                      {order.confirmed_at ? timeAgo(order.confirmed_at) : "Not yet confirmed"}
                    </p>
                  </div>

                  <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5 space-y-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Delivered At
                    </span>
                    <p className="font-bold text-slate-900">
                      {formatDateTime(order.delivered_at)}
                    </p>
                    <p className="text-slate-500">
                      {order.delivered_at ? timeAgo(order.delivered_at) : "Not delivered"}
                    </p>
                  </div>

                  <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5 space-y-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> Network & Stock
                    </span>
                    <p className="font-mono text-slate-800">
                      Customer IP: <strong>{order.customer_ip ?? order.ip_address ?? "—"}</strong>
                    </p>
                    <p className="text-slate-500">
                      {order.stock_released_at
                        ? `Stock released: ${formatDateTime(order.stock_released_at)}`
                        : "Inventory reserved"}
                    </p>
                  </div>
                </div>

                {/* Billing vs Shipping Address Comparison */}
                {order.billing_address && (
                  <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm">Billing Address</h4>
                    <p className="text-slate-700">
                      <strong>{order.billing_address.name}</strong> · {order.billing_address.phone} ·{" "}
                      {[
                        order.billing_address.line1,
                        order.billing_address.line2,
                        order.billing_address.area,
                        order.billing_address.district,
                        order.billing_address.division,
                        order.billing_address.postcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </section>
                )}

                {/* Chronological Status History Timeline */}
                <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 sm:p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#FF5B00]" /> Complete Order Audit Trail (
                    {order.history.length} event{order.history.length === 1 ? "" : "s"})
                  </h3>

                  {order.history.length === 0 ? (
                    <p className="text-xs text-slate-500">No history events recorded.</p>
                  ) : (
                    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
                      {order.history.map((h, i) => {
                        const toMeta = metaFor(ORDER_STATUS_META, h.to);
                        const fromMeta = h.from
                          ? metaFor(ORDER_STATUS_META, h.from)
                          : null;
                        return (
                          <li key={i} className="ml-5 relative">
                            <span
                              className={cn(
                                "absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white",
                                i === order.history.length - 1
                                  ? "bg-[#FF5B00]"
                                  : "bg-slate-400"
                              )}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {fromMeta ? (
                                  <>
                                    <Badge tone={fromMeta.tone}>{fromMeta.label}</Badge>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    <Badge tone={toMeta.tone}>{toMeta.label}</Badge>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs font-semibold text-slate-600">
                                      Order Placed as
                                    </span>
                                    <Badge tone={toMeta.tone}>{toMeta.label}</Badge>
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                <span className="font-medium text-slate-700">
                                  {formatDateTime(h.at)}
                                </span>{" "}
                                ({timeAgo(h.at)})
                                {h.by && (
                                  <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                    by {h.by}
                                  </span>
                                )}
                              </div>
                            </div>
                            {h.note && (
                              <div className="mt-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200/70 px-3 py-2 text-xs text-slate-700">
                                {h.note}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 4: FRAUD CHECK                                                */}
            {/* ================================================================= */}
            {tab === "fraud" && <OrderFraudPanel orderId={order.id} />}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmUnpaid}
        title="Mark this order unpaid?"
        message="Use this when a payment was recorded by mistake. The change is kept in the order history."
        confirmLabel="Mark unpaid"
        loading={busy}
        onConfirm={() => setPayment("unpaid")}
        onClose={() => setConfirmUnpaid(false)}
      />

      {shipping && order && (
        <ShipWithCourierDialog
          order={order}
          onClose={() => setShipping(false)}
          onShipped={(o) => {
            setShipping(false);
            apply(
              o,
              `Booked with ${
                o.shipment?.courier_label ?? "the courier"
              }. The order is now Shipped.`
            );
          }}
        />
      )}
    </>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-slate-600 text-xs">
      <span>{label}</span>
      <span className={cn("tabular-nums text-slate-800", valueClass)}>{value}</span>
    </div>
  );
}
