"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  User,
  X,
  Clock,
  Check,
  ChevronRight,
  Package,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  MapPin,
  Mail,
  Phone
} from "lucide-react";
import { poishaToTaka } from "@/lib/utils/money";
import {
  getAdminOrderAction,
  updateAdminOrderStatusAction,
  markAdminOrderPaidAction,
} from "@/app/(admin)/actions/orders";

interface OrderCustomer {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  account_type?: string;
}

interface OrderItem {
  id: number;
  product_id?: number;
  variant_id?: number;
  name?: string;
  label?: string;
  sku?: string;
  image?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number;
  vat?: number;
  line_total: number;
}

interface OrderHistoryEntry {
  from: string | null;
  to: string;
  note: string | null;
  by: string | null;
  at: string;
}

interface AllowedTransition {
  status: string;
  permission?: string;
}

interface AdminOrderDetail {
  id: number;
  number?: string;
  order_number?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_method_label?: string;
  source?: string;
  customer?: OrderCustomer;
  contact?: OrderCustomer;
  shipping_address?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string | null;
    district?: string;
    division?: string;
    district_id?: number;
    division_id?: number;
  };
  billing_address?: any;
  delivery?: {
    zone?: string;
    days_min?: number;
    days_max?: number;
    weight_grams?: number;
  };
  items?: OrderItem[];
  totals?: {
    subtotal?: number;
    discount?: number;
    vat?: number;
    shipping?: number;
    grand_total?: number;
  };
  grand_total?: number;
  total_amount?: number;
  allowed_transitions?: AllowedTransition[];
  history?: OrderHistoryEntry[];
  customer_note?: string;
  placed_at?: string;
  created_at?: string;
}

interface OrdersManagementProps {
  initialOrders: any[];
}

export function OrdersManagement({ initialOrders }: OrdersManagementProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);

  // Status transition form state
  const [selectedNextStatus, setSelectedNextStatus] = useState<string>("");
  const [transitionNote, setTransitionNote] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // In-modal alerts
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    const orderNum = o.number || o.order_number || String(o.id);
    const custName = o.customer?.name || o.contact?.name || o.shipping_address?.name || "";
    const matchesSearch =
      orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || o.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Open drawer and load live order details by ID
  const handleOpenDetail = async (orderId: number) => {
    setIsModalOpen(true);
    setIsLoadingDetail(true);
    setModalSuccess(null);
    setModalError(null);
    setSelectedNextStatus("");
    setTransitionNote("");

    try {
      const res = await getAdminOrderAction(orderId);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      } else {
        setModalError(!res.success ? (res.error?.message || "Failed to load order details") : "Failed to load order details");
      }
    } catch {
      setModalError("Network error loading order details");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Perform confirmed status transition
  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedNextStatus) return;

    setIsTransitioning(true);
    setModalSuccess(null);
    setModalError(null);

    try {
      const res = await updateAdminOrderStatusAction(
        selectedOrder.id,
        selectedNextStatus,
        transitionNote.trim() || undefined
      );

      if (res.success) {
        setModalSuccess(
          `Order #${selectedOrder.number || selectedOrder.id} successfully updated to "${selectedNextStatus}"!`
        );

        // Refresh detail by reloading from API
        const refreshRes = await getAdminOrderAction(selectedOrder.id);
        if (refreshRes.success && refreshRes.data) {
          setSelectedOrder(refreshRes.data);
        } else {
          setSelectedOrder({ ...selectedOrder, status: selectedNextStatus });
        }

        // Update list state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, status: selectedNextStatus } : o
          )
        );

        setSelectedNextStatus("");
        setTransitionNote("");
        router.refresh();
      } else {
        setModalError(!res.success ? (res.error?.message || "Failed to update order status") : "Failed to update order status");
      }
    } catch {
      setModalError("Error updating order status. Please verify permissions.");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Mark payment as paid
  const handleMarkPaid = async () => {
    if (!selectedOrder) return;

    setIsTransitioning(true);
    setModalSuccess(null);
    setModalError(null);

    try {
      const res = await markAdminOrderPaidAction(
        selectedOrder.id,
        "Payment verified and recorded via Admin Portal"
      );

      if (res.success) {
        setModalSuccess(
          `Order #${selectedOrder.number || selectedOrder.id} successfully marked as PAID!`
        );

        // Reload fresh order detail
        const refreshRes = await getAdminOrderAction(selectedOrder.id);
        if (refreshRes.success && refreshRes.data) {
          setSelectedOrder(refreshRes.data);
        } else {
          setSelectedOrder({ ...selectedOrder, payment_status: "paid" });
        }

        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, payment_status: "paid" } : o
          )
        );
        router.refresh();
      } else {
        setModalError(!res.success ? (res.error?.message || "Failed to record payment") : "Failed to record payment");
      }
    } catch {
      setModalError("Network error marking payment");
    } finally {
      setIsTransitioning(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "packed":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "processing":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "confirmed":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time fulfillment tracking, payment verification, and order status transitions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["all", "pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-[#FF5B00] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Order Status</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No orders matching search / filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const grandTotal = o.grand_total || o.totals?.grand_total || o.total_amount || 0;
                  const orderNum = o.number || o.order_number || `#${o.id}`;
                  const custName = o.customer?.name || o.contact?.name || o.shipping_address?.name || "Guest";
                  const dateStr = o.placed_at || o.created_at;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {orderNum}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{custName}</div>
                        {(o.customer?.phone || o.contact?.phone) && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {o.customer?.phone || o.contact?.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ৳ {poishaToTaka(grandTotal).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusBadgeClass(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            o.payment_status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {dateStr ? new Date(dateStr).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenDetail(o.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#FF5B00] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5B00]/10 text-[#FF5B00] flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 font-mono">
                      Order {selectedOrder ? selectedOrder.number || `#${selectedOrder.id}` : "..."}
                    </h3>
                    {selectedOrder && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadgeClass(
                          selectedOrder.status
                        )}`}
                      >
                        {selectedOrder.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live database record from backend API (GET /admin/orders/{selectedOrder?.id || "..."})
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* In-Modal Feedback Messages */}
              {modalSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                  <button onClick={() => setModalSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2.5 text-xs font-semibold text-rose-700 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                  <button onClick={() => setModalError(null)} className="text-rose-600 hover:text-rose-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isLoadingDetail || !selectedOrder ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#FF5B00] animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">
                    Loading full order products and status transitions...
                  </span>
                </div>
              ) : (
                <>
                  {/* 1. Status Workflow Progression Box */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-[#FF5B00]" />
                        Status Transition Workflow
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Current: <strong className="uppercase text-slate-800">{selectedOrder.status}</strong>
                      </span>
                    </div>

                    {/* Next Allowed Transitions */}
                    {(() => {
                      const transitions =
                        selectedOrder.allowed_transitions && selectedOrder.allowed_transitions.length > 0
                          ? selectedOrder.allowed_transitions.map((t) => t.status)
                          : (() => {
                              switch (selectedOrder.status.toLowerCase()) {
                                case "pending":
                                  return ["confirmed", "cancelled"];
                                case "confirmed":
                                  return ["processing", "cancelled"];
                                case "processing":
                                  return ["packed", "shipped", "cancelled"];
                                case "packed":
                                  return ["shipped", "cancelled"];
                                case "shipped":
                                  return ["delivered"];
                                default:
                                  return [];
                              }
                            })();

                      if (transitions.length === 0) {
                        return (
                          <div className="p-3 bg-slate-100 rounded-lg text-slate-500 italic text-[11px]">
                            This order is in terminal state ({selectedOrder.status}). No further status transitions allowed.
                          </div>
                        );
                      }

                      return (
                        <form onSubmit={handleConfirmStatusChange} className="space-y-3 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-600 font-semibold text-[11px]">Select Next Stage:</span>
                            {transitions.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setSelectedNextStatus(st)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                                  selectedNextStatus === st
                                    ? "bg-slate-900 text-white shadow-xs ring-2 ring-slate-900"
                                    : st === "cancelled"
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                    : "bg-white hover:bg-orange-50 text-slate-700 border border-slate-300"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          {selectedNextStatus && (
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                              <label className="text-[11px] font-semibold text-slate-700 block">
                                Internal Transition Note (Optional)
                              </label>
                              <input
                                type="text"
                                value={transitionNote}
                                onChange={(e) => setTransitionNote(e.target.value)}
                                placeholder={`e.g. Moved order to ${selectedNextStatus}...`}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00]"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedNextStatus("")}
                                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isTransitioning}
                                  className="px-4 py-1.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isTransitioning ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Updating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Confirm Transition to {selectedNextStatus.toUpperCase()}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </form>
                      );
                    })()}

                    {/* Payment Status Bar */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600 font-semibold">Payment Status:</span>
                        <span
                          className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                            selectedOrder.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {selectedOrder.payment_status}
                        </span>
                      </div>

                      {selectedOrder.payment_status !== "paid" && (
                        <button
                          type="button"
                          disabled={isTransitioning}
                          onClick={handleMarkPaid}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Record as Paid</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Order Products Table */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#FF5B00]" />
                        Order Items & Products ({selectedOrder.items?.length || 0})
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        Weight: {selectedOrder.delivery?.weight_grams || 0}g
                      </span>
                    </div>

                    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2.5">Product</th>
                            <th className="px-4 py-2.5">SKU / Variant</th>
                            <th className="px-4 py-2.5 text-center">Qty</th>
                            <th className="px-4 py-2.5 text-right">Unit Price</th>
                            <th className="px-4 py-2.5 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {selectedOrder.items && selectedOrder.items.length > 0 ? (
                            selectedOrder.items.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{item.name || "Product"}</div>
                                  {item.discount ? (
                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                      Discount: ৳ {poishaToTaka(item.discount).toFixed(2)}
                                    </span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-mono text-slate-700 font-bold text-[11px]">
                                      {item.sku || "—"}
                                    </span>
                                    {item.label && (
                                      <span className="text-slate-400 text-[10px]">Size/Opt: {item.label}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-800">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-slate-800">
                                  ৳ {poishaToTaka(item.unit_price).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                  ৳ {poishaToTaka(item.line_total).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                No product items found for this order.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Customer & Address Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Customer Information
                      </span>
                      <div className="space-y-1 text-slate-700">
                        <div className="font-semibold text-slate-900">
                          {selectedOrder.customer?.name ||
                            selectedOrder.contact?.name ||
                            selectedOrder.shipping_address?.name ||
                            "Guest Customer"}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>
                            {selectedOrder.customer?.phone ||
                              selectedOrder.contact?.phone ||
                              selectedOrder.shipping_address?.phone ||
                              "—"}
                          </span>
                        </div>
                        {selectedOrder.customer?.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{selectedOrder.customer.email}</span>
                          </div>
                        )}
                        {selectedOrder.customer?.account_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[10px] font-bold uppercase">
                            {selectedOrder.customer.account_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delivery & Shipping Address */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Shipping Address & Zone
                      </span>
                      <div className="space-y-1 text-slate-700">
                        {selectedOrder.shipping_address ? (
                          <>
                            <div className="font-medium">
                              {selectedOrder.shipping_address.line1}
                              {selectedOrder.shipping_address.line2 ? `, ${selectedOrder.shipping_address.line2}` : ""}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {selectedOrder.shipping_address.district
                                ? `District: ${selectedOrder.shipping_address.district}`
                                : ""}
                              {selectedOrder.shipping_address.division
                                ? `, Division: ${selectedOrder.shipping_address.division}`
                                : ""}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 italic">No shipping address recorded.</div>
                        )}

                        {selectedOrder.delivery?.zone && (
                          <div className="pt-1 text-[11px] text-[#FF5B00] font-semibold flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />
                            <span>
                              {selectedOrder.delivery.zone} ({selectedOrder.delivery.days_min || 1}-
                              {selectedOrder.delivery.days_max || 3} business days)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Financial Totals & Payment Summary */}
                  <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold">
                        ৳ {poishaToTaka(selectedOrder.totals?.subtotal || 0).toFixed(2)}
                      </span>
                    </div>

                    {selectedOrder.totals?.vat ? (
                      <div className="flex justify-between text-slate-600">
                        <span>VAT (Government Tax):</span>
                        <span className="font-mono font-semibold">
                          ৳ {poishaToTaka(selectedOrder.totals.vat).toFixed(2)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex justify-between text-slate-600">
                      <span>Shipping / Delivery Fee:</span>
                      <span className="font-mono font-semibold">
                        ৳ {poishaToTaka(selectedOrder.totals?.shipping || 0).toFixed(2)}
                      </span>
                    </div>

                    {selectedOrder.totals?.discount ? (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount Applied:</span>
                        <span className="font-mono">
                          - ৳ {poishaToTaka(selectedOrder.totals.discount).toFixed(2)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                      <span>Grand Total:</span>
                      <span className="text-[#FF5B00] font-mono text-base">
                        ৳ {poishaToTaka(selectedOrder.totals?.grand_total || selectedOrder.grand_total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 5. Order History Timeline */}
                  {selectedOrder.history && selectedOrder.history.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Audit Trail & History Timeline
                      </h4>
                      <div className="p-3 bg-slate-50 rounded-xl divide-y divide-slate-100">
                        {selectedOrder.history.map((h, i) => (
                          <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between">
                            <div>
                              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                                {h.from ? `${h.from} → ${h.to}` : `Placed as ${h.to}`}
                              </span>
                              {h.note && <p className="text-slate-500 text-[11px] mt-0.5">{h.note}</p>}
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-[10px] block">
                                {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {h.by && <span className="text-slate-500 text-[10px] italic">by {h.by}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Order ID #{selectedOrder?.id}
              </span>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
