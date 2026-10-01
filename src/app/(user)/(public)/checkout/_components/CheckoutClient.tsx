"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Building,
  Phone,
  User,
  Clock,
  RefreshCw,
  Tag,
  Receipt,
  Check,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPoisha, takaToPoisha } from "@/lib/utils/money";
import { formatPrice } from "@/lib/utils";
import {
  placeOrderAction,
  getCheckoutQuoteAction,
  PlaceOrderPayload,
  OrderPlacedResponse,
  CheckoutQuoteResponse,
} from "@/app/(user)/actions/checkout";
import { Address } from "@/app/(user)/actions/addresses";
import confetti from "canvas-confetti";

interface CheckoutClientProps {
  initialAddresses: Address[];
  locations: Array<{ id: number; name: string }>;
}

export function CheckoutClient({ initialAddresses, locations }: CheckoutClientProps) {
  const router = useRouter();
  const { cart, subtotal, clearCart } = useCart();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isLoading, isAuthenticated, router]);

  // Shipping Address Selection
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    initialAddresses.find((a) => a.is_default)?.id || initialAddresses[0]?.id || null
  );
  const [useNewAddress, setUseNewAddress] = useState(initialAddresses.length === 0);

  // New Shipping Address Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [area, setArea] = useState("");
  const [districtId, setDistrictId] = useState<number>(locations[0]?.id || 21);
  const [postcode, setPostcode] = useState("");

  // Billing Address Toggle & Fields
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingLine1, setBillingLine1] = useState("");
  const [billingLine2, setBillingLine2] = useState("");
  const [billingArea, setBillingArea] = useState("");
  const [billingDistrictId, setBillingDistrictId] = useState<number>(locations[0]?.id || 21);
  const [billingPostcode, setBillingPostcode] = useState("");

  // Auto-fill user profile info
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  // Payment & Options
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [note, setNote] = useState("");

  // Dynamic Quote State
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderPlacedResponse | null>(null);

  // Fetch checkout quote whenever address or district changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchQuote() {
      setQuoteLoading(true);
      try {
        const payload = useNewAddress || !selectedAddressId
          ? { district_id: districtId }
          : { address_id: selectedAddressId };

        const res = await getCheckoutQuoteAction(payload);
        if (!isCancelled && res.success && res.data) {
          setQuote(res.data);
          // If current payment method is not in offered payment methods, select the first available
          if (
            res.data.payment_methods &&
            res.data.payment_methods.length > 0 &&
            !res.data.payment_methods.some((pm) => pm.method === paymentMethod)
          ) {
            setPaymentMethod(res.data.payment_methods[0].method);
          }
        }
      } catch {
        // keep fallback values
      } finally {
        if (!isCancelled) setQuoteLoading(false);
      }
    }

    fetchQuote();

    return () => {
      isCancelled = true;
    };
  }, [selectedAddressId, districtId, useNewAddress]);

  // Derived financials in integer poisha
  const rawSubtotalPoisha = takaToPoisha(subtotal);
  const subtotalPoisha = quote?.totals?.subtotal ?? rawSubtotalPoisha;
  const discountPoisha = quote?.totals?.discount ?? 0;
  const vatPoisha = quote?.totals?.vat ?? 0;
  const shippingChargePoisha = quote?.totals?.shipping
    ? Number(quote.totals.shipping)
    : quote?.shipping?.charge ?? 6000;
  const grandTotalPoisha = quote?.totals?.grand_total ?? (subtotalPoisha - discountPoisha + vatPoisha + shippingChargePoisha);

  // Fallback payment methods if quote has not returned yet
  const availablePaymentMethods = quote?.payment_methods && quote.payment_methods.length > 0
    ? quote.payment_methods
    : [
        { method: "cod", label: "Cash on delivery", is_online: false },
        { method: "bank_transfer", label: "Bank transfer", is_online: false },
        { method: "sslcommerz", label: "Online payment (Cards / Mobile Banking)", is_online: true },
      ];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }

    setIsPending(true);

    try {
      const payload: PlaceOrderPayload = {
        payment_method: paymentMethod,
        note: note.trim() || undefined,
        items: cart
          .filter((i) => i.product.variantId)
          .map((i) => ({
            variant_id: i.product.variantId!,
            quantity: i.quantity,
          })),
      };

      // Shipping address specification
      if (!useNewAddress && selectedAddressId) {
        payload.address_id = selectedAddressId;
        if (sameAsShipping) {
          payload.billing_address_id = selectedAddressId;
        }
      } else {
        if (!name.trim() || !phone.trim() || !line1.trim()) {
          setError("Please complete all required shipping address fields.");
          setIsPending(false);
          return;
        }
        const shippingAddr = {
          name: name.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          area: area.trim() || undefined,
          district_id: Number(districtId),
          postcode: postcode.trim() || undefined,
        };
        payload.address = shippingAddr;
        if (sameAsShipping) {
          payload.billing_address = shippingAddr;
        }
      }

      // Billing address specification (if different)
      if (!sameAsShipping) {
        if (!billingName.trim() || !billingPhone.trim() || !billingLine1.trim()) {
          setError("Please complete all required billing address fields.");
          setIsPending(false);
          return;
        }
        payload.billing_address = {
          name: billingName.trim(),
          phone: billingPhone.trim(),
          line1: billingLine1.trim(),
          line2: billingLine2.trim() || undefined,
          area: billingArea.trim() || undefined,
          district_id: Number(billingDistrictId),
          postcode: billingPostcode.trim() || undefined,
        };
      }

      const res = await placeOrderAction(payload);
      if (res.success && res.data) {
        clearCart();

        // If online payment, redirect immediately to payment gateway
        if (res.data.gateway_url) {
          window.location.href = res.data.gateway_url;
          return;
        }

        setPlacedOrder(res.data);
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        setError(
          !res.success
            ? res.error?.message || "Failed to place order. Please review your details and try again."
            : "Failed to place order. Please review your details and try again."
        );
      }
    } catch {
      setError("An unexpected error occurred. Please verify your connection.");
    } finally {
      setIsPending(false);
    }
  };

  // If order was successfully placed, show Confirmation screen
  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Your order has been recorded in our system. You will receive an SMS and email notification shortly.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl text-left space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">Order Number</span>
            <span className="text-sm font-mono font-bold text-slate-900">
              #{placedOrder.number || placedOrder.order_number}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">Total Amount</span>
            <span className="text-sm font-bold text-[#FF5B00]">
              {formatPoisha(placedOrder.total_amount)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">Payment Method</span>
            <span className="text-xs font-bold text-slate-700 uppercase">
              {placedOrder.payment_method_label || placedOrder.payment_method.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">Payment Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
              {placedOrder.payment_status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Order Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              {placedOrder.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={`/orders/${placedOrder.number || placedOrder.order_number}`}
            className="w-full sm:w-auto px-6 py-3 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            View Order Details
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Checkout & Delivery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your items, choose your delivery destination, and confirm your payment method.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Address & Payment Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#FF5B00]" />
                <h2 className="text-sm font-bold text-slate-900">Delivery Address</h2>
              </div>
              {initialAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                  className="text-xs font-bold text-[#FF5B00] hover:underline cursor-pointer"
                >
                  {useNewAddress ? "Use Saved Address" : "+ New Address"}
                </button>
              )}
            </div>

            {/* Saved Addresses Selector */}
            {!useNewAddress && initialAddresses.length > 0 && (
              <div className="space-y-3">
                {initialAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? "border-[#FF5B00] bg-orange-50/20 ring-1 ring-[#FF5B00]"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="address_select"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-[#FF5B00] focus:ring-[#FF5B00]"
                      />
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{addr.name}</span>
                          <span className="font-mono text-slate-500">({addr.phone})</span>
                          {addr.is_default && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">{addr.address_line}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {(useNewAddress || initialAddresses.length === 0) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rafi Ahmed"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">District *</label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] bg-white"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Area / Thana</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Dhanmondi, Motijheel"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="House 12, Road 4"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Apartment / Unit (Optional)</label>
                    <input
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      placeholder="Flat 4B, 3rd Floor"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-1/2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Postcode (Optional)</label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="1205"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                  />
                </div>
              </div>
            )}

            {/* Same as Shipping checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="rounded text-[#FF5B00] focus:ring-[#FF5B00]"
                />
                <span>Billing address is the same as delivery address</span>
              </label>
            </div>

            {/* Separate Billing Address Fields */}
            {!sameAsShipping && (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Billing Address Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Billing Full Name *</label>
                    <input
                      type="text"
                      required={!sameAsShipping}
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Billing Phone *</label>
                    <input
                      type="tel"
                      required={!sameAsShipping}
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Billing District *</label>
                    <select
                      value={billingDistrictId}
                      onChange={(e) => setBillingDistrictId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] bg-white"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Billing Line 1 *</label>
                    <input
                      type="text"
                      required={!sameAsShipping}
                      value={billingLine1}
                      onChange={(e) => setBillingLine1(e.target.value)}
                      placeholder="Address line 1"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods On Offer */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#FF5B00]" />
                <h2 className="text-sm font-bold text-slate-900">Payment Method</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Ways of paying on offer</span>
            </div>

            <div className="space-y-3">
              {availablePaymentMethods.map((pm) => (
                <label
                  key={pm.method}
                  className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === pm.method
                      ? "border-[#FF5B00] bg-orange-50/20 ring-1 ring-[#FF5B00]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method_option"
                      value={pm.method}
                      checked={paymentMethod === pm.method}
                      onChange={() => setPaymentMethod(pm.method)}
                      className="text-[#FF5B00] focus:ring-[#FF5B00]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {pm.label}
                        </span>
                        {pm.is_online ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Instant Gateway
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Offline / COD
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pm.instructions ||
                          (pm.method === "cod"
                            ? "Pay physically in cash upon receiving and inspecting products."
                            : pm.method === "bank_transfer"
                            ? "Transfer directly to our commercial bank account."
                            : "Pay securely via bKash, Nagad, Visa, Mastercard, or internet banking.")}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Note */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-2">
            <label className="text-xs font-bold text-slate-900">Special Delivery Instructions (Optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ring doorbell, deliver after 2 PM, call before arriving..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] resize-none"
            />
          </div>
        </div>

        {/* Right Side: Quote Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#FF5B00]" />
                <h2 className="text-sm font-bold text-slate-900">Order Summary</h2>
              </div>
              {quoteLoading ? (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#FF5B00]" /> Calculating...
                </span>
              ) : quote?.shipping ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {quote.shipping.zone_name}
                </span>
              ) : null}
            </div>

            {/* Line items list */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 space-y-3">
              {(quote?.items && quote.items.length > 0 ? quote.items : cart).map((item: any, idx: number) => {
                const title = item.name || item.product?.title || "Product";
                const img = item.image || item.product?.image || "/placeholder.svg";
                const unitPrice = item.unit_price ? item.unit_price : takaToPoisha(item.product?.price || 0);
                const quantity = item.quantity || 1;
                const lineTotal = item.line_total ? item.line_total : unitPrice * quantity;

                return (
                  <div key={item.variant_id || item.product?.id || idx} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                      <Image
                        src={img}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Qty: {quantity}</span>
                        <span>×</span>
                        <span>{formatPoisha(unitPrice)}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {formatPoisha(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              {/* Lines Subtotal */}
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPoisha(subtotalPoisha)}</span>
              </div>

              {/* Discount (if applicable) */}
              {discountPoisha > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center gap-1 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Discount
                  </span>
                  <span className="font-bold">-{formatPoisha(discountPoisha)}</span>
                </div>
              )}

              {/* VAT (if applicable) */}
              {vatPoisha > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT</span>
                  <span className="font-semibold text-slate-900">{formatPoisha(vatPoisha)}</span>
                </div>
              )}

              {/* Delivery / Shipping Charge */}
              <div className="flex justify-between text-slate-600">
                <div className="space-y-0.5">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    Delivery Charge
                  </span>
                  {quote?.shipping && (
                    <span className="text-[10px] text-slate-400 block">
                      Estimated {quote.shipping.delivery_days_min} - {quote.shipping.delivery_days_max} business days
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-900">
                  {formatPoisha(shippingChargePoisha)}
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
                <div>
                  <span className="block">Total Payable</span>
                  <span className="text-[10px] text-slate-400 font-normal">All taxes & duties included</span>
                </div>
                <span className="text-[#FF5B00] text-lg font-black">
                  {formatPoisha(grandTotalPoisha)}
                </span>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe & idempotent checkout with instant confirmation.</span>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isPending || cart.length === 0}
              className="w-full py-3.5 px-4 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <span>Confirm Order ({formatPoisha(grandTotalPoisha)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
