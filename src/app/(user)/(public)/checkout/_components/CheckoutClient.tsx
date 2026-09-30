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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import {
  placeOrderAction,
  getCheckoutQuoteAction,
  PlaceOrderPayload,
  OrderPlacedResponse,
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

  // Address Selection
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    initialAddresses.find((a) => a.is_default)?.id || initialAddresses[0]?.id || null
  );
  const [useNewAddress, setUseNewAddress] = useState(initialAddresses.length === 0);

  // New Address Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [area, setArea] = useState("");
  const [districtId, setDistrictId] = useState<number>(locations[0]?.id || 1);

  // Payment & Options
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer" | "sslcommerz">("cod");
  const [note, setNote] = useState("");

  // Calculation & State
  const [shippingFee, setShippingFee] = useState<number>(10000); // ৳100 standard
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderPlacedResponse | null>(null);

  // Fetch delivery quote when address/district changes
  useEffect(() => {
    async function updateQuote() {
      try {
        const payload = useNewAddress || !selectedAddressId
          ? { district_id: districtId }
          : { address_id: selectedAddressId };
        const res = await getCheckoutQuoteAction(payload);
        if (res.success && res.data?.totals?.shipping_fee) {
          setShippingFee(res.data.totals.shipping_fee);
        }
      } catch {
        // fallback to standard fee
      }
    }
    updateQuote();
  }, [selectedAddressId, districtId, useNewAddress]);

  const totalAmount = subtotal + shippingFee / 100;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const payload: PlaceOrderPayload = {
        payment_method: paymentMethod,
        note: note.trim() || undefined,
      };

      if (!useNewAddress && selectedAddressId) {
        payload.address_id = selectedAddressId;
      } else {
        if (!name.trim() || !phone.trim() || !line1.trim()) {
          setError("Please complete all required shipping address fields.");
          setIsPending(false);
          return;
        }
        payload.address = {
          name: name.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          area: area.trim() || undefined,
          district_id: Number(districtId),
        };
      }

      const res = await placeOrderAction(payload);
      if (res.success && res.data) {
        setPlacedOrder(res.data);
        clearCart();
        try {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        setError(!res.success ? (res.error?.message || "Failed to place order. Please try again.") : "Failed to place order.");
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
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Your order has been recorded in our system. Our support team will confirm shortly.
          </p>
        </div>

        <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">Order Number</span>
            <span className="text-sm font-mono font-bold text-slate-900">
              #{placedOrder.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">Total Amount</span>
            <span className="text-sm font-bold text-[#FF5B00]">
              ৳ {(placedOrder.total_amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">Payment Method</span>
            <span className="text-xs font-bold text-slate-700 uppercase">
              {placedOrder.payment_method.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Initial Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700">
              {placedOrder.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/account"
            className="w-full sm:w-auto px-6 py-3 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            View in My Account
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5B00] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">
          Add safety gear or hardware products to your cart before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all"
        >
          Browse Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Secure Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your delivery details and choose a payment method.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Address & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#FF5B00]" />
                <h2 className="text-sm font-bold text-slate-900">Delivery Address</h2>
              </div>
              {initialAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                  className="text-xs font-semibold text-[#FF5B00] hover:underline cursor-pointer"
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
                      placeholder="e.g. Dhanmondi, Gulshan"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="House 12, Road 4, Flat 3B"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-[#FF5B00]" />
              <h2 className="text-sm font-bold text-slate-900">Payment Option</h2>
            </div>

            <div className="space-y-3">
              <label
                className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === "cod"
                    ? "border-[#FF5B00] bg-orange-50/20 ring-1 ring-[#FF5B00]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="text-[#FF5B00] focus:ring-[#FF5B00]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Pay in cash upon physical receipt and inspection of products.
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === "bank_transfer"
                    ? "border-[#FF5B00] bg-orange-50/20 ring-1 ring-[#FF5B00]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                    className="text-[#FF5B00] focus:ring-[#FF5B00]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Bank Transfer
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Transfer directly to our commercial bank account.
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-2">
            <label className="text-xs font-bold text-slate-900">Order Instructions (Optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ring bell, deliver after 2 PM..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] resize-none"
            />
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5 sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary ({cart.length} items)
            </h2>

            {/* Item list */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                    <Image
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {item.product.title}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Qty: {item.quantity} × {formatPrice(item.product.price)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Estimated Shipping
                </span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(shippingFee / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Payable</span>
                <span className="text-[#FF5B00] text-base">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe & idempotent checkout with instant confirmation.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Placing Order..." : `Confirm Order (${formatPrice(totalAmount)})`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
