"use client";

import React, { useEffect, useState } from "react";
import { Check, Clock, CreditCard, Mail, MapPin, Package, Phone, ShieldAlert, Truck, Undo2, User } from "lucide-react";
import { getAdminOrderAction, setAdminOrderPaymentAction, updateAdminOrderStatusAction } from "@/app/(admin)/actions/orders";
import type { AdminOrderDetail, OrderStatus } from "@/types/admin-orders";
import { Badge, Button, ConfirmDialog, Field, InlineError, Input, Modal, Spinner, Tabs } from "@/app/(admin)/components/ui";
import { formatDateTime, formatTaka } from "@/app/(admin)/components/format";
import { ORDER_STATUS_META, PAYMENT_STATUS_META, metaFor } from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";
import { cn } from "@/lib/utils";
import { AdminInvoiceButton, OrderRefundsPanel } from "./OrderRefundsPanel";
import { ShipmentCard, ShipWithCourierDialog } from "./ShipmentPanel";
import { OrderFraudPanel } from "./OrderFraudPanel";

type Tab = "details" | "fraud";

/** Some mutations answer with a trimmed order; fall back to a fresh read so the modal never shows half an order. */
async function ensureFull(id: number, maybe: AdminOrderDetail | null | undefined): Promise<AdminOrderDetail | null> {
  if (maybe && Array.isArray(maybe.items) && Array.isArray(maybe.history)) return maybe;
  const res = await getAdminOrderAction(id);
  return res.success ? res.data : maybe ?? null;
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
  const [tab, setTab] = useState<Tab>("details");

  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);
  const [confirmUnpaid, setConfirmUnpaid] = useState(false);

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

  const apply = (updated: AdminOrderDetail, message: string) => {
    setOrder(updated);
    onChanged(updated);
    setOk(message);
    setErr(null);
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
    if (full) apply(full, `Order moved to ${metaFor(ORDER_STATUS_META, nextStatus).label}.`);
    setNextStatus("");
    setNote("");
  };

  const setPayment = async (paymentStatus: "paid" | "unpaid") => {
    if (!order) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    const res = await setAdminOrderPaymentAction(
      order.id,
      paymentStatus,
      paymentStatus === "paid" ? "Payment recorded in the back office" : "Marked unpaid in the back office"
    );
    setConfirmUnpaid(false);
    if (!res.success) {
      setBusy(false);
      return setErr(res.error.message);
    }
    const full = await ensureFull(order.id, res.data);
    setBusy(false);
    if (full) apply(full, paymentStatus === "paid" ? "Payment recorded." : "Order marked unpaid.");
  };

  const refresh = async () => {
    const res = await getAdminOrderAction(orderId);
    if (res.success) {
      setOrder(res.data);
      onChanged(res.data);
    }
  };

  const status = order ? metaFor(ORDER_STATUS_META, order.status) : null;
  const payment = order ? metaFor(PAYMENT_STATUS_META, order.payment_status) : null;
  const canShipWithCourier = !!order && order.status === "packed" && !order.shipment && can("orders.fulfil");
  const transitions = order?.allowed_transitions ?? [];
  const canRecordPayment =
    !!order && !["paid", "refunded", "partially_refunded"].includes(order.payment_status) && !["cancelled", "refunded"].includes(order.status);
  // Undo a payment recorded by mistake; online payments are reversed with a refund instead.
  const canMarkUnpaid = !!order && order.payment_status === "paid" && order.payment_method !== "sslcommerz";

  return (
    <>
      <Modal
        open
        // While the ship dialog is on top, Escape belongs to it.
        onClose={() => !busy && !shipping && !confirmUnpaid && onClose()}
        size="xl"
        title={order ? `Order ${order.number}` : "Order"}
        description={order ? `Placed ${formatDateTime(order.placed_at)} · ${order.source === "buy_now" ? "Buy now" : "Cart checkout"}` : undefined}
        footer={
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Close
          </Button>
        }
      >
        {loadError ? (
          <InlineError message={loadError} />
        ) : !order ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {status && <Badge tone={status.tone}>{status.label}</Badge>}
                {payment && <Badge tone={payment.tone}>{payment.label}</Badge>}
                <span className="text-xs text-slate-500">{order.payment_method_label}</span>
              </div>
              <div className="flex items-center gap-2">
                <AdminInvoiceButton orderId={order.id} />
              </div>
            </div>

            {can("fraud.view") && (
              <Tabs
                tabs={[
                  { value: "details", label: "Order" },
                  { value: "fraud", label: "Fraud check" },
                ]}
                value={tab}
                onChange={setTab}
              />
            )}

            {tab === "fraud" ? (
              <OrderFraudPanel orderId={order.id} />
            ) : (
              <>
                <InlineError message={err} />
                {ok && (
                  <div role="status" className="rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-3 py-2.5 text-sm text-emerald-800">
                    {ok}
                  </div>
                )}

                {/* Next step */}
                <section className="rounded-xl ring-1 ring-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Next step</h3>
                  {canShipWithCourier && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-white ring-1 ring-brand-200 px-3 py-2.5">
                      <p className="text-sm text-slate-700">This order is packed. Book it with a courier to ship it.</p>
                      <Button size="sm" icon={Truck} onClick={() => setShipping(true)}>
                        Ship with courier
                      </Button>
                    </div>
                  )}
                  {transitions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {["delivered", "cancelled", "returned", "refunded"].includes(order.status)
                        ? "This order is finished; there are no further steps."
                        : "You have no steps available for this order with your permissions."}
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {transitions.map((t) => {
                          const m = metaFor(ORDER_STATUS_META, t.status);
                          const danger = t.status === "cancelled" || t.status === "returned";
                          return (
                            <button
                              key={t.status}
                              type="button"
                              disabled={busy}
                              onClick={() => setNextStatus(nextStatus === t.status ? "" : t.status)}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs font-semibold ring-1 transition-colors cursor-pointer disabled:opacity-50",
                                nextStatus === t.status
                                  ? "bg-slate-900 text-white ring-slate-900"
                                  : danger
                                  ? "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50"
                                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                              )}
                            >
                              {t.status === "shipped" && order.status === "packed" ? "Shipped by hand" : m.label}
                            </button>
                          );
                        })}
                      </div>
                      {nextStatus && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                          <Field label="Note (optional)" className="flex-1">
                            <Input
                              value={note}
                              maxLength={500}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder={nextStatus === "cancelled" ? "Why it was cancelled" : "Shown in the order history"}
                            />
                          </Field>
                          <Button
                            loading={busy}
                            variant={nextStatus === "cancelled" || nextStatus === "returned" ? "danger" : "primary"}
                            onClick={changeStatus}
                          >
                            Move to {metaFor(ORDER_STATUS_META, nextStatus).label}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      Payment: {payment && <Badge tone={payment.tone}>{payment.label}</Badge>}
                    </span>
                    {canRecordPayment && can("orders.update") && (
                      <Button size="sm" variant="success" icon={Check} disabled={busy} onClick={() => setPayment("paid")}>
                        Record as paid
                      </Button>
                    )}
                    {canMarkUnpaid && can("orders.update") && (
                      <Button size="sm" variant="ghost" icon={Undo2} disabled={busy} onClick={() => setConfirmUnpaid(true)}>
                        Mark unpaid
                      </Button>
                    )}
                  </div>
                </section>

                {order.shipment && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Parcel</h3>
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

                <OrderRefundsPanel orderId={order.id} onRefunded={refresh} />

                {/* Items */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-slate-400" /> Items ({order.items.length})
                    </h3>
                    {order.delivery?.weight_grams ? <span className="text-xs text-slate-500">{order.delivery.weight_grams / 1000} kg</span> : null}
                  </div>
                  <div className="rounded-xl ring-1 ring-slate-200 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Product</th>
                          <th className="px-3 py-2 text-left font-semibold">SKU</th>
                          <th className="px-3 py-2 text-right font-semibold">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold">Unit</th>
                          <th className="px-3 py-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((it) => (
                          <tr key={it.id}>
                            <td className="px-3 py-2.5">
                              <div className="font-medium text-slate-900">{it.name}</div>
                              {it.label && <div className="text-xs text-slate-500">{it.label}</div>}
                              {it.discount > 0 && <div className="text-xs text-emerald-700">Discount {formatTaka(it.discount)}</div>}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{it.sku ?? "—"}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{it.quantity}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{formatTaka(it.unit_price)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatTaka(it.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <section className="rounded-xl ring-1 ring-slate-200 p-4 space-y-1.5 text-sm">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                      <User className="w-4 h-4 text-slate-400" /> Customer
                    </h3>
                    <p className="font-medium text-slate-800">
                      {order.customer.name} {order.customer.is_guest && <Badge tone="slate">Guest</Badge>}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${order.customer.phone}`} className="hover:text-primary">
                        {order.customer.phone}
                      </a>
                    </p>
                    {order.customer.email && (
                      <p className="flex items-center gap-1.5 text-slate-600 break-all">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {order.customer.email}
                      </p>
                    )}
                    {order.customer.group && <p className="text-xs text-slate-500">{order.customer.group}</p>}
                  </section>

                  <section className="rounded-xl ring-1 ring-slate-200 p-4 space-y-1.5 text-sm">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-4 h-4 text-slate-400" /> Delivery
                    </h3>
                    {order.shipping_address ? (
                      <>
                        <p className="text-slate-800">{order.shipping_address.name}</p>
                        <p className="text-slate-600">
                          {[order.shipping_address.line1, order.shipping_address.line2].filter(Boolean).join(", ")}
                        </p>
                        <p className="text-slate-600">
                          {[order.shipping_address.area, order.shipping_address.district, order.shipping_address.postcode].filter(Boolean).join(", ")}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-400">No address recorded.</p>
                    )}
                    {order.delivery?.zone && (
                      <p className="text-xs text-primary font-medium pt-1">
                        {order.delivery.zone}
                        {order.delivery.days_min ? ` · ${order.delivery.days_min}–${order.delivery.days_max} days` : ""}
                      </p>
                    )}
                  </section>

                  <section className="rounded-xl ring-1 ring-slate-200 p-4 space-y-1.5 text-sm">
                    <h3 className="font-semibold text-slate-900 mb-1">Totals</h3>
                    <Row label="Subtotal" value={formatTaka(order.totals.subtotal)} />
                    {order.totals.discount > 0 && (
                      <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`−${formatTaka(order.totals.discount)}`} />
                    )}
                    {order.totals.vat > 0 && <Row label="VAT" value={formatTaka(order.totals.vat)} />}
                    <Row label="Delivery" value={formatTaka(order.totals.shipping)} />
                    <div className="flex justify-between pt-2 mt-1 border-t border-slate-100 font-bold text-slate-900">
                      <span>Total</span>
                      <span className="tabular-nums">{formatTaka(order.totals.grand_total)}</span>
                    </div>
                  </section>
                </div>

                {order.customer_note && (
                  <section className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm text-amber-900">
                    <span className="font-semibold">Customer note: </span>
                    {order.customer_note}
                  </section>
                )}

                {order.history.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> History
                    </h3>
                    <ol className="rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100">
                      {order.history.map((h, i) => (
                        <li key={i} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-sm">
                          <div>
                            <span className="font-medium text-slate-800">
                              {h.from ? `${metaFor(ORDER_STATUS_META, h.from).label} → ${metaFor(ORDER_STATUS_META, h.to).label}` : `Placed as ${metaFor(ORDER_STATUS_META, h.to).label}`}
                            </span>
                            {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            {formatDateTime(h.at)}
                            {h.by && ` · ${h.by}`}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {(order.customer_ip || order.ip_address) && can("fraud.view") && (
                  <button
                    type="button"
                    onClick={() => setTab("fraud")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Check this customer for fraud
                  </button>
                )}
              </>
            )}
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
            apply(o, `Booked with ${o.shipment?.courier_label ?? "the courier"}. The order is now Shipped.`);
          }}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="tabular-nums text-slate-800">{value}</span>
    </div>
  );
}
