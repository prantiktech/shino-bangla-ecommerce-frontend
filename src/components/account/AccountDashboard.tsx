"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, formatPoisha } from "@/lib/api";
import {
  Address,
  AddressInput,
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  getAddressesAction,
} from "@/app/(user)/actions/addresses";
import {
  OrderDetail,
  getOrderDetailAction,
  cancelOrderAction,
  getOrdersAction,
} from "@/app/(user)/actions/orders";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/app/(user)/actions/profile";
import {
  Package,
  MapPin,
  Home,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  KeyRound,
  User as UserIcon,
  Mail,
  Phone,
  ArrowRight,
  ShoppingBag,
  FileText,
  X,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Star,
  LogOut,
  RefreshCw,
  Building,
  RotateCcw,
  DollarSign,
  AlertOctagon,
} from "lucide-react";

interface AccountDashboardProps {
  initialUser: User;
  initialOrders: OrderDetail[];
  initialAddresses: Address[];
  locations: Array<{ id: number; name: string; district_name?: string; division?: string }>;
  initialWishlist?: any[];
  initialReviewables?: any[];
  initialReviews?: any[];
  defaultTab?: "orders" | "addresses" | "profile" | "overview";
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  initialUser,
  initialOrders,
  initialAddresses,
  locations,
  defaultTab = "orders",
}) => {
  const router = useRouter();
  const { logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile" | "overview">(defaultTab);

  // Orders State
  const [orders, setOrders] = useState<OrderDetail[]>(initialOrders);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [orderModalError, setOrderModalError] = useState<string | null>(null);

  // Cancel Order Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressModalError, setAddressModalError] = useState<string | null>(null);
  const [addressModalSuccess, setAddressModalSuccess] = useState<string | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  // Address Form State
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrName, setAddrName] = useState(initialUser.name || "");
  const [addrPhone, setAddrPhone] = useState(initialUser.phone || "");
  const [addrDistrictId, setAddrDistrictId] = useState<number>(() => {
    // Default to Dhaka if available or first location
    const dhaka = locations.find((l) => l.district_name === "Dhaka" || l.name.includes("Dhaka"));
    return dhaka ? dhaka.id : locations[0]?.id || 21;
  });
  const [addrArea, setAddrArea] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrPostcode, setAddrPostcode] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState(initialUser.name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Logout State
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Open Add Address Modal
  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddrLabel("Home");
    setAddrName(initialUser.name || "");
    setAddrPhone(initialUser.phone || "");
    const dhaka = locations.find((l) => l.district_name === "Dhaka" || l.name.includes("Dhaka"));
    setAddrDistrictId(dhaka ? dhaka.id : locations[0]?.id || 21);
    setAddrArea("");
    setAddrLine1("");
    setAddrLine2("");
    setAddrPostcode("");
    setAddrIsDefault(addresses.length === 0);
    setAddressModalError(null);
    setAddressModalSuccess(null);
    setIsAddressModalOpen(true);
  };

  // Open Edit Address Modal
  const openEditAddressModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || "Home");
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrDistrictId(addr.district_id);
    setAddrArea(addr.area || "");
    setAddrLine1(addr.line1 || addr.address_line || "");
    setAddrLine2(addr.line2 || "");
    setAddrPostcode(addr.postcode || "");
    setAddrIsDefault(Boolean(addr.is_default_shipping || addr.is_default));
    setAddressModalError(null);
    setAddressModalSuccess(null);
    setIsAddressModalOpen(true);
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim()) {
      setAddressModalError("Please enter recipient name");
      return;
    }
    if (!addrPhone.trim()) {
      setAddressModalError("Please enter phone number");
      return;
    }
    if (!addrLine1.trim()) {
      setAddressModalError("Please enter address street / house line");
      return;
    }
    if (!addrDistrictId) {
      setAddressModalError("Please select a district");
      return;
    }

    setIsSavingAddress(true);
    setAddressModalError(null);
    setAddressModalSuccess(null);

    const payload: AddressInput = {
      label: addrLabel,
      name: addrName.trim(),
      phone: addrPhone.trim(),
      district_id: Number(addrDistrictId),
      area: addrArea.trim() || undefined,
      line1: addrLine1.trim(),
      line2: addrLine2.trim() || undefined,
      postcode: addrPostcode.trim() || undefined,
      is_default_shipping: addrIsDefault,
      is_default: addrIsDefault,
    };

    try {
      if (editingAddressId) {
        const res = await updateAddressAction(editingAddressId, payload);
        if (!res.success) {
          setAddressModalError(res.error?.message || "Failed to update address");
        } else {
          setAddressModalSuccess("Address updated successfully!");
          // Refresh list
          const fresh = await getAddressesAction();
          if (fresh.success && fresh.data) {
            setAddresses(fresh.data);
          }
          setTimeout(() => setIsAddressModalOpen(false), 900);
        }
      } else {
        const res = await createAddressAction(payload);
        if (!res.success) {
          setAddressModalError(res.error?.message || "Failed to save address");
        } else {
          setAddressModalSuccess("Address added successfully!");
          // Refresh list
          const fresh = await getAddressesAction();
          if (fresh.success && fresh.data) {
            setAddresses(fresh.data);
          }
          setTimeout(() => setIsAddressModalOpen(false), 900);
        }
      }
    } catch {
      setAddressModalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Set Address as Default
  const handleSetDefault = async (addrId: number) => {
    setSettingDefaultId(addrId);
    try {
      const res = await setDefaultAddressAction(addrId);
      if (res.success) {
        const fresh = await getAddressesAction();
        if (fresh.success && fresh.data) {
          setAddresses(fresh.data);
        }
      }
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addrId: number) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setDeletingAddressId(addrId);
    try {
      const res = await deleteAddressAction(addrId);
      if (!res.success) {
        alert(res.error?.message || "Failed to delete address");
      } else {
        setAddresses((prev) => prev.filter((a) => a.id !== addrId));
      }
    } finally {
      setDeletingAddressId(null);
    }
  };

  // View Order Details Modal
  const handleViewOrderDetail = async (orderNumber: string) => {
    setIsLoadingDetail(true);
    setOrderModalError(null);
    setSelectedOrder(null);
    try {
      const res = await getOrderDetailAction(orderNumber);
      if (!res.success) {
        setOrderModalError(res.error?.message || "Failed to load order details");
      } else {
        setSelectedOrder(res.data);
      }
    } catch {
      setOrderModalError("Could not retrieve order details. Please check your network.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Cancel Order Submission
  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await cancelOrderAction(orderToCancel, cancelReason.trim());
      if (!res.success) {
        setCancelError(res.error?.message || "Failed to cancel order");
      } else {
        setIsCancelModalOpen(false);
        setOrderToCancel(null);
        setCancelReason("");
        // Refresh orders list and selected order
        const fresh = await getOrdersAction();
        if (fresh.success && fresh.data) {
          setOrders(fresh.data);
        }
        if (selectedOrder && (selectedOrder.order_number === orderToCancel || selectedOrder.number === orderToCancel)) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: "cancelled", can_cancel: false } : null));
        }
      }
    } catch {
      setCancelError("An error occurred while cancelling your order.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Profile Name Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileError("Name cannot be empty.");
      return;
    }
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await updateProfileAction({ name: profileName.trim() });
      if (!res.success) {
        setProfileError(res.error?.message || "Failed to update profile");
      } else {
        setProfileSuccess("Profile updated successfully!");
        router.refresh();
      }
    } catch {
      setProfileError("Could not update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await changePasswordAction({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      if (!res.success) {
        setPasswordError(res.error?.message || "Failed to change password");
      } else {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Could not change password. Please check your credentials.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status?.toLowerCase() === orderFilter.toLowerCase();
  });

  // Status Badge Helper matching backend OrderSummaryResource
  const getStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : "";
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    if (s === "shipped") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3 h-3" /> Shipped
        </span>
      );
    }
    if (s === "packed") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Package className="w-3 h-3" /> Packed
        </span>
      );
    }
    if (s === "processing") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> Processing
        </span>
      );
    }
    if (s === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          <Clock className="w-3 h-3" /> Pending Confirmation
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <X className="w-3 h-3" /> Cancelled
        </span>
      );
    }
    if (s === "returned") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <RotateCcw className="w-3 h-3" /> Returned
        </span>
      );
    }
    if (s === "refunded") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
          <DollarSign className="w-3 h-3" /> Refunded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
        <Clock className="w-3 h-3" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Customer Profile Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-[#009cae] flex items-center justify-center text-2xl font-black shadow-xs">
              {initialUser.name ? initialUser.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {initialUser.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Customer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5 font-medium">
                {initialUser.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {initialUser.email}
                  </span>
                )}
                {initialUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {initialUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/90 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "orders"
                ? "bg-[#009cae] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === "orders" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "addresses"
                ? "bg-[#009cae] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === "addresses" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {addresses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "profile"
                ? "bg-[#009cae] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Security</span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-[#009cae] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Overview</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MY ORDERS                                               */}
        {/* ============================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Filter Sub-nav */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 mr-1">Status:</span>
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "confirmed", label: "Confirmed" },
                  { key: "processing", label: "Processing" },
                  { key: "packed", label: "Packed" },
                  { key: "shipped", label: "Shipped" },
                  { key: "delivered", label: "Delivered" },
                  { key: "cancelled", label: "Cancelled" },
                  { key: "returned", label: "Returned" },
                  { key: "refunded", label: "Refunded" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOrderFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs capitalize transition-colors cursor-pointer ${
                      orderFilter === f.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const res = await getOrdersAction();
                    if (res.success && res.data) {
                      setOrders(res.data);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Refresh orders list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link
                  href="/products"
                  className="text-xs font-bold text-[#009cae] hover:underline flex items-center gap-1"
                >
                  <span>Browse Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center space-y-4 border border-slate-200/90">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {orderFilter === "all"
                      ? "You haven't placed any hardware or fastener orders yet. Browse our inventory to get started!"
                      : `No orders matching status "${orderFilter}".`}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009cae] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#008998] transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start Shopping</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, idx) => {
                  const orderNum = order.number || order.order_number || `#${order.id || idx + 1}`;
                  const orderDate = order.placed_at || order.created_at;
                  const grandTotal =
                    order.grand_total ||
                    order.totals?.grand_total ||
                    order.total_amount ||
                    0;

                  return (
                    <div
                      key={orderNum}
                      className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-slate-900 font-mono">
                              #{orderNum}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>
                              Placed on {orderDate ? new Date(orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              Payment: {order.payment_method_label || order.payment_method || "COD"} (
                              <span className="font-semibold">{order.payment_status || "unpaid"}</span>)
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-xs text-slate-500 font-medium">Grand Total</div>
                          <div className="text-lg font-black text-slate-900">
                            {formatPoisha(grandTotal)}
                          </div>
                        </div>
                      </div>

                      {/* Line Item Previews */}
                      {order.preview && order.preview.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Items ({order.preview.reduce((acc, p) => acc + (p.quantity || 1), 0)})
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {order.preview.map((item, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 font-bold">
                                    <Package className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 truncate" title={item.name}>
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    {item.label && (
                                      <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                        {item.label}
                                      </span>
                                    )}
                                    <span className="font-semibold text-slate-800">Qty: {item.quantity}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/orders/${encodeURIComponent(orderNum)}`}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Full Details</span>
                          </Link>

                          <a
                            href={`/api/orders/${orderNum}/invoice`}
                            download
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Invoice (PDF)</span>
                          </a>

                          <Link
                            href={`/track-order?number=${orderNum}`}
                            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#009cae] border border-teal-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track</span>
                          </Link>
                        </div>

                        {order.can_cancel && (
                          <button
                            onClick={() => {
                              setOrderToCancel(orderNum);
                              setCancelReason("");
                              setCancelError(null);
                              setIsCancelModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SAVED ADDRESSES                                         */}
        {/* ============================================================== */}
        {activeTab === "addresses" && (
          <div className="space-y-4">
            {/* Header / Add Button */}
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Address Book</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your shipping & billing destinations for fast 1-click checkout.
                </p>
              </div>

              <button
                onClick={openAddAddressModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009cae] hover:bg-[#008998] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {/* Address Cards Grid */}
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center space-y-4 border border-slate-200/90">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No Saved Addresses</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    You haven&apos;t added any addresses yet. Add your home, office, or site address to streamline order delivery!
                  </p>
                </div>
                <button
                  onClick={openAddAddressModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009cae] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#008998] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isDefault = Boolean(addr.is_default_shipping || addr.is_default);
                  const districtName =
                    typeof addr.district === "object"
                      ? addr.district?.name
                      : addr.district ||
                        locations.find((l) => l.id === addr.district_id)?.district_name ||
                        "District";

                  return (
                    <div
                      key={addr.id}
                      className={`relative bg-white rounded-2xl p-6 border transition-all space-y-4 ${
                        isDefault
                          ? "border-[#009cae] shadow-xs ring-1 ring-[#009cae]/30"
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      {/* Top Card Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                            {addr.label?.toLowerCase() === "office" ? (
                              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <Home className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            {addr.label || "Home"}
                          </span>

                          {isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#009cae] border border-teal-200 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-[#009cae]" />
                              Default Shipping
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditAddressModal(addr)}
                            title="Edit Address"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            disabled={deletingAddressId === addr.id}
                            title="Delete Address"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Recipient Details */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="font-bold text-slate-900 text-sm">
                          {addr.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{addr.phone}</span>
                        </div>
                        <div className="text-slate-600 leading-relaxed pt-1">
                          <div>{addr.line1 || addr.address_line}</div>
                          {addr.line2 && <div className="text-slate-500">{addr.line2}</div>}
                          <div className="text-slate-500 font-medium">
                            {[addr.area, districtName, addr.postcode ? `Postcode: ${addr.postcode}` : null]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                      </div>

                      {/* Default Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {!isDefault ? (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            disabled={settingDefaultId === addr.id}
                            className="text-xs font-bold text-[#009cae] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>
                              {settingDefaultId === addr.id ? "Setting..." : "Set as Default Shipping"}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Primary Delivery Address
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROFILE & SECURITY                                      */}
        {/* ============================================================== */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Update Profile Name */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-teal-50 text-[#009cae]">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">Update your customer display name</p>
                </div>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={initialUser.email || ""}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">Email cannot be edited directly.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    disabled
                    value={initialUser.phone || ""}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">Phone number verified on account registration.</p>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-2.5 bg-[#009cae] hover:bg-[#008998] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isUpdatingProfile ? "Saving Profile..." : "Save Profile Details"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-teal-50 text-[#009cae]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Security & Password</h3>
                  <p className="text-xs text-slate-500">Ensure your account uses a secure password</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: OVERVIEW                                                */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Total Orders</span>
                    <Package className="w-4 h-4 text-[#009cae]" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {orders.length}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Delivered</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {orders.filter((o) => o.status?.toLowerCase() === "delivered").length}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Saved Addresses</span>
                    <MapPin className="w-4 h-4 text-[#009cae]" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {addresses.length}
                  </div>
                </div>
              </div>

              {/* Latest Order Snapshot */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#009cae]" />
                    <span>Most Recent Order</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-[#009cae] hover:underline"
                  >
                    View All Orders
                  </button>
                </div>

                {orders[0] ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 font-mono">
                          #{orders[0].number || orders[0].order_number}
                        </span>
                        <span className="ml-2 text-slate-400">
                          {orders[0].placed_at ? new Date(orders[0].placed_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <div>{getStatusBadge(orders[0].status)}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-slate-500">Order Amount</span>
                      <span className="font-black text-slate-900">
                        {formatPoisha(orders[0].grand_total || orders[0].totals?.grand_total || orders[0].total_amount || 0)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => handleViewOrderDetail(orders[0].number || orders[0].order_number || "")}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                      >
                        Inspect Order Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4">No order history available yet.</p>
                )}
              </div>
            </div>

            {/* Account Summary Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/90 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Account Details</h3>
                <div className="text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Role:</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {initialUser.roles?.[0] || "Customer"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Active Status:</span>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Phone Verified:</span>
                    <span className="font-semibold text-emerald-600">
                      {initialUser.phone_verified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Member Since:</span>
                    <span className="font-semibold text-slate-900">
                      {initialUser.created_at ? new Date(initialUser.created_at).toLocaleDateString() : "2026"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dedicated Support Card */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-200/70 text-xs text-teal-950 space-y-2">
                <span className="font-bold block text-sm text-[#009cae]">Order Support & Tracking</span>
                <p className="text-slate-600">
                  Have questions about bulk fastener delivery, custom bolt specifications, or return policy?
                </p>
                <div className="pt-2 flex flex-col gap-1.5">
                  <Link
                    href="/track-order"
                    className="font-bold text-[#009cae] hover:underline flex items-center gap-1"
                  >
                    <span>Track with Order Number & Phone</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>Contact Customer Care</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =================================================================== */}
      {/* MODAL 1: ADD / EDIT ADDRESS                                         */}
      {/* =================================================================== */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-[#009cae]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Used for calculating accurate courier delivery charges
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Inside Modal */}
            {addressModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addressModalError}</span>
              </div>
            )}
            {addressModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{addressModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Address Label Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Address Label</label>
                <div className="flex items-center gap-2">
                  {["Home", "Office", "Warehouse", "Site"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddrLabel(lbl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        addrLabel === lbl
                          ? "bg-[#009cae] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Other"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#009cae] focus:outline-none"
                  />
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder="e.g. Rafi Ahmed"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>
              </div>

              {/* District Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">District *</label>
                <select
                  required
                  value={addrDistrictId}
                  onChange={(e) => setAddrDistrictId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Select your district to apply the correct shipping rate.
                </p>
              </div>

              {/* Area / Neighborhood */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Area / Neighborhood</label>
                <input
                  type="text"
                  value={addrArea}
                  onChange={(e) => setAddrArea(e.target.value)}
                  placeholder="e.g. Motijheel C/A, Dhanmondi, Agrabad"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                />
              </div>

              {/* Street Address Line 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Street Address (House & Road) *</label>
                <input
                  type="text"
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="e.g. Suite 9, 12/A Motijheel Road"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                />
              </div>

              {/* Line 2 & Postcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Floor / Apartment (Optional)</label>
                  <input
                    type="text"
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    placeholder="e.g. 4th Floor, Flat 4B"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Postcode (Optional)</label>
                  <input
                    type="text"
                    value={addrPostcode}
                    onChange={(e) => setAddrPostcode(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009cae]"
                  />
                </div>
              </div>

              {/* Set Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#009cae] rounded-sm focus:ring-[#009cae]"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Set as default shipping address
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-6 py-2.5 rounded-xl bg-[#009cae] hover:bg-[#008998] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSavingAddress ? "Saving Address..." : editingAddressId ? "Save Changes" : "Create Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: FULL ORDER DETAILS                                         */}
      {/* =================================================================== */}
      {(isLoadingDetail || selectedOrder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            {isLoadingDetail ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#009cae] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading order breakdown...</p>
              </div>
            ) : selectedOrder ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 font-mono">
                        #{selectedOrder.number || selectedOrder.order_number}
                      </h3>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <p className="text-xs text-slate-500">
                      Placed on {selectedOrder.placed_at ? new Date(selectedOrder.placed_at).toLocaleString() : "Recent"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {orderModalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{orderModalError}</span>
                  </div>
                )}

                {/* Timeline if available */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Tracking Progress
                    </h4>
                    <div className="space-y-2 pt-1">
                      {selectedOrder.timeline.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-[#009cae] mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold text-slate-900 capitalize">{step.status}</span>
                            {step.note && <span className="text-slate-500 ml-2">— {step.note}</span>}
                            <span className="text-[11px] text-slate-400 block">
                              {new Date(step.at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ordered Items Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Purchased Items ({selectedOrder.items?.length || 0})
                  </h4>
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                    {selectedOrder.items?.map((item, iIdx) => (
                      <div key={iIdx} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">
                            {item.name || item.product_name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            {item.label && <span>Var: {item.label}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right font-black text-slate-900 shrink-0">
                          {formatPoisha(item.line_total || (item.unit_price ? item.unit_price * item.quantity : 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Breakdown */}
                {selectedOrder.totals && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">
                        {formatPoisha(selectedOrder.totals.subtotal)}
                      </span>
                    </div>
                    {selectedOrder.totals.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-{formatPoisha(selectedOrder.totals.discount)}</span>
                      </div>
                    )}
                    {selectedOrder.totals.vat > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>VAT</span>
                        <span className="font-semibold text-slate-900">
                          {formatPoisha(selectedOrder.totals.vat)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping Fee ({selectedOrder.delivery?.zone || "Courier"})</span>
                      <span className="font-semibold text-slate-900">
                        {typeof selectedOrder.totals.shipping === "number"
                          ? formatPoisha(selectedOrder.totals.shipping)
                          : !isNaN(Number(selectedOrder.totals.shipping))
                          ? formatPoisha(Number(selectedOrder.totals.shipping))
                          : selectedOrder.totals.shipping || "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                      <span>Grand Total</span>
                      <span>{formatPoisha(selectedOrder.totals.grand_total)}</span>
                    </div>
                  </div>
                )}

                {/* Shipping & Billing Address Info */}
                {selectedOrder.shipping_address && (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-600">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#009cae]" />
                      <span>Shipping Destination</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {selectedOrder.shipping_address.name} ({selectedOrder.shipping_address.phone})
                    </div>
                    <div>{selectedOrder.shipping_address.line1}</div>
                    <div>
                      {[selectedOrder.shipping_address.area, selectedOrder.shipping_address.district]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/orders/${selectedOrder.number || selectedOrder.order_number}/invoice`}
                      download
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Invoice PDF</span>
                    </a>
                  </div>

                  {selectedOrder.can_cancel && (
                    <button
                      onClick={() => {
                        setOrderToCancel(selectedOrder.number || selectedOrder.order_number || null);
                        setCancelReason("");
                        setCancelError(null);
                        setIsCancelModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                    >
                      Cancel This Order
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: CANCEL ORDER CONFIRMATION                                  */}
      {/* =================================================================== */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Cancel Order #{orderToCancel}</span>
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {cancelError}
              </div>
            )}

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Cancellation Policy:</span> You can cancel an order only if the shop has not started packing. Once packing has started, stock is committed and items may already be in transit.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Cancellation Reason (Optional)</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered duplicate, need to change delivery address"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
