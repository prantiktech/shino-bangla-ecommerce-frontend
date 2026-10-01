"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  X,
  RotateCcw,
  DollarSign,
  FileText,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Tag,
  AlertCircle,
  Share2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { OrderDetail, cancelOrderAction } from "@/app/(user)/actions/orders";
import { formatPoisha } from "@/lib/utils/money";

interface OrderDetailViewProps {
  order: OrderDetail;
}

export function OrderDetailView({ order: initialOrder }: OrderDetailViewProps) {
  const router = useRouter();

  const [currentOrder, setCurrentOrder] = useState<OrderDetail>(initialOrder);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : "";
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    }
    if (s === "shipped") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5" /> Shipped
        </span>
      );
    }
    if (s === "packed") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Package className="w-3.5 h-3.5" /> Packed
        </span>
      );
    }
    if (s === "processing") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Processing
        </span>
      );
    }
    if (s === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          <Clock className="w-3.5 h-3.5" /> Pending Confirmation
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <X className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    if (s === "returned") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <RotateCcw className="w-3.5 h-3.5" /> Returned
        </span>
      );
    }
    if (s === "refunded") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
          <DollarSign className="w-3.5 h-3.5" /> Refunded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
        <Clock className="w-3.5 h-3.5" /> {status}
      </span>
    );
  };

  // Helper to parse address whether object or array
  const parseAddress = (addr: any) => {
    if (!addr) return null;
    if (Array.isArray(addr)) {
      const valid = addr.find((item) => item !== null && typeof item === "object");
      return valid || null;
    }
    if (typeof addr === "object") return addr;
    return null;
  };

  const shippingAddr = parseAddress(currentOrder.shipping_address);
  const billingAddr = parseAddress(currentOrder.billing_address);

  // Helper for shipping fee
  const formatShipping = (shipping: number | string | undefined) => {
    if (shipping === undefined || shipping === null) return "Free";
    if (typeof shipping === "number") return formatPoisha(shipping);
    if (!isNaN(Number(shipping))) return formatPoisha(Number(shipping));
    return shipping;
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderNum = currentOrder.number || currentOrder.order_number;
    if (!orderNum) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await cancelOrderAction(orderNum, cancelReason);
      if (res.success && res.data) {
        setCurrentOrder(res.data);
        setCancelSuccess(`Order #${res.data.number || orderNum} has been cancelled successfully.`);
        setIsCancelModalOpen(false);
        router.refresh();
      } else {
        setCancelError(
          !res.success && res.error
            ? res.error.message ||
              "Cannot cancel order. The shop has already started packing or dispatched this order; the stock is committed."
            : "Failed to cancel order."
        );
      }
    } catch (err: any) {
      setCancelError(err.message || "An unexpected error occurred.");
    } finally {
      setIsCancelling(false);
    }
  };

  const grandTotal =
    currentOrder.totals?.grand_total ??
    currentOrder.grand_total ??
    currentOrder.total_amount ??
    0;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Link & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/account?tab=orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#009cae] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.refresh()}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Refresh order details"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {cancelSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccess}</span>
          </div>
        )}

        {/* Main Order Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  #{currentOrder.number || currentOrder.order_number}
                </h1>
                {getStatusBadge(currentOrder.status)}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                {currentOrder.placed_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Placed on{" "}
                    <strong className="text-slate-700">
                      {new Date(currentOrder.placed_at).toLocaleDateString("en-BD", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </strong>
                  </span>
                )}
                {currentOrder.source && (
                  <>
                    <span>•</span>
                    <span className="capitalize">Source: {currentOrder.source}</span>
                  </>
                )}
                {currentOrder.payment_method_label && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      {currentOrder.payment_method_label}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase ${
                          currentOrder.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {currentOrder.payment_status}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`/api/orders/${currentOrder.number || currentOrder.order_number}/invoice`}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Download Invoice</span>
              </a>

              <Link
                href={`/track-order?number=${currentOrder.number || currentOrder.order_number}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#009cae] hover:bg-[#008998] text-white text-xs font-bold transition-all shadow-xs"
              >
                <Truck className="w-4 h-4" />
                <span>Track Package</span>
              </Link>

              {currentOrder.can_cancel && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Order</span>
                </button>
              )}
            </div>
          </div>

          {/* Payment Expiry Warning if Applicable */}
          {currentOrder.payment_expires_at && currentOrder.payment_status === "unpaid" && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Please complete your payment before{" "}
                <strong>{new Date(currentOrder.payment_expires_at).toLocaleString()}</strong> to keep this order active.
              </span>
            </div>
          )}

          {/* Chronological Timeline Stepper */}
          {currentOrder.timeline && currentOrder.timeline.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Order Activity & Timeline
              </h3>
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {currentOrder.timeline.map((step, sIdx) => {
                  const isLatest = sIdx === currentOrder.timeline!.length - 1;
                  return (
                    <div key={sIdx} className="relative flex items-start justify-between gap-4">
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                          isLatest ? "bg-[#009cae] ring-[#009cae]/30" : "bg-slate-300 ring-slate-200"
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 capitalize">
                          {step.status}
                        </div>
                        {step.note && (
                          <div className="text-xs text-slate-500 mt-0.5">{step.note}</div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono shrink-0">
                        {step.at ? new Date(step.at).toLocaleString("en-BD", { dateStyle: "short", timeStyle: "short" }) : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Content: Line Items & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Purchased Items (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  Purchased Items ({currentOrder.items?.length || 0})
                </h2>
                {currentOrder.currency && (
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    Currency: {currentOrder.currency}
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {currentOrder.items && currentOrder.items.length > 0 ? (
                  currentOrder.items.map((item, idx) => (
                    <div key={idx} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || "Product"}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-7 h-7 text-slate-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.name || item.product_name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          {item.label && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              {item.label}
                            </span>
                          )}
                          {item.sku && (
                            <span className="font-mono text-[11px] text-slate-400">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                          <span>
                            Unit Price: <strong>{formatPoisha(item.unit_price || item.price || 0)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Qty: <strong>{item.quantity}</strong>
                          </span>
                          {item.vat_rate_bp ? (
                            <>
                              <span>•</span>
                              <span>VAT: {(item.vat_rate_bp / 100).toFixed(0)}%</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-900 font-mono">
                          {formatPoisha(item.line_total || (item.unit_price || item.price || 0) * item.quantity)}
                        </div>
                        {item.discount ? (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            -{formatPoisha(item.discount)} off
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No item details available for this order.
                  </div>
                )}
              </div>
            </div>

            {/* Customer Note if present */}
            {currentOrder.note && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Order Note / Special Delivery Instructions
                </h3>
                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {currentOrder.note}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Totals & Delivery Address (1 Col) */}
          <div className="space-y-6">
            {/* Cost Breakdown */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Payment Summary
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatPoisha(currentOrder.totals?.subtotal ?? grandTotal)}
                  </span>
                </div>

                {currentOrder.totals && currentOrder.totals.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Discount
                      {currentOrder.coupon_code && (
                        <span className="bg-emerald-100/70 text-emerald-800 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
                          {currentOrder.coupon_code}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold font-mono">
                      -{formatPoisha(currentOrder.totals.discount)}
                    </span>
                  </div>
                )}

                {currentOrder.totals && currentOrder.totals.vat > 0 && (
                  <div className="flex items-center justify-between">
                    <span>VAT</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatPoisha(currentOrder.totals.vat)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>
                    Shipping {currentOrder.delivery?.zone ? `(${currentOrder.delivery.zone})` : ""}
                  </span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatShipping(currentOrder.totals?.shipping)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900">Grand Total</span>
                  <span className="font-black text-slate-900 text-lg font-mono">
                    {formatPoisha(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Logistics Details */}
            {currentOrder.delivery && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delivery Estimate</span>
                </h3>
                <div className="text-xs text-slate-700 space-y-1">
                  {currentOrder.delivery.zone && (
                    <div>
                      Zone: <strong className="text-slate-900">{currentOrder.delivery.zone}</strong>
                    </div>
                  )}
                  {currentOrder.delivery.days_min !== undefined && currentOrder.delivery.days_max !== undefined && (
                    <div className="text-slate-500">
                      Estimated window:{" "}
                      <strong className="text-slate-800">
                        {currentOrder.delivery.days_min} – {currentOrder.delivery.days_max} business days
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact & Shipping Destination */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Shipping Destination</span>
              </h3>

              {shippingAddr ? (
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="font-bold text-slate-900 text-sm">{shippingAddr.name}</div>
                  {shippingAddr.phone && <div className="text-slate-500">{shippingAddr.phone}</div>}
                  {shippingAddr.line1 && <div>{shippingAddr.line1}</div>}
                  {shippingAddr.line2 && <div>{shippingAddr.line2}</div>}
                  <div className="font-medium text-slate-700">
                    {[shippingAddr.area, shippingAddr.district, shippingAddr.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              ) : currentOrder.contact ? (
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="font-bold text-slate-900 text-sm">{currentOrder.contact.name}</div>
                  <div className="text-slate-500">{currentOrder.contact.phone}</div>
                  {currentOrder.contact.email && <div className="text-slate-500">{currentOrder.contact.email}</div>}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Standard delivery address on file.</div>
              )}

              {/* Billing Address if different */}
              {billingAddr && (
                <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Billing Address
                  </span>
                  <div className="font-bold text-slate-900">{billingAddr.name}</div>
                  <div>{billingAddr.line1}</div>
                  <div className="text-slate-500">
                    {[billingAddr.area, billingAddr.district, billingAddr.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isCancelling && setIsCancelModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden z-10 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Cancel Order #{currentOrder.number || currentOrder.order_number}
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cancellation Policy Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Cancellation Policy:</span> You can cancel an order only if the shop has not started packing. Once packing begins, inventory is committed and items may already be on their way.
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you are cancelling: e.g. Ordered by mistake, ordered wrong size/quantity, found another option..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
