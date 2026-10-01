"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Truck,
  CreditCard,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Receipt,
  User,
  Phone,
  Mail,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { formatPoisha, takaToPoisha, poishaToTaka } from "@/lib/utils/money";
import {
  buyNowQuoteAction,
  buyNowAction,
  getCheckoutLocationsAction,
  CheckoutQuoteResponse,
  OrderPlacedResponse,
  BuyNowPayload,
} from "@/app/(user)/actions/checkout";
import { getAddressesAction, Address } from "@/app/(user)/actions/addresses";
import { getProductBySlugAction, ApiProductVariant } from "@/app/(user)/actions/products";

export interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId?: number;
  productSlug?: string;
  productTitle: string;
  productImage?: string | null;
  initialQuantity?: number;
  initialPrice?: number;
  variantLabel?: string | null;
  sku?: string | null;
  variants?: ApiProductVariant[];
  optionName?: string | null;
}

export function BuyNowModal({
  isOpen,
  onClose,
  variantId,
  productSlug,
  productTitle,
  productImage,
  initialQuantity = 1,
  initialPrice = 0,
  variantLabel,
  sku,
  variants,
  optionName,
}: BuyNowModalProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // State
  const [quantity, setQuantity] = useState(initialQuantity);
  const [activeVariantId, setActiveVariantId] = useState<number>(variantId || 0);
  const [resolvedVariants, setResolvedVariants] = useState<ApiProductVariant[]>(variants || []);
  const [resolvedOptionName, setResolvedOptionName] = useState<string | null>(optionName || null);
  const [selectedVariant, setSelectedVariant] = useState<ApiProductVariant | null>(null);
  const [variantLoading, setVariantLoading] = useState(false);

  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [districtId, setDistrictId] = useState<number>(21); // Default to Dhaka (21)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Address inputs
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [area, setArea] = useState("");
  const [postcode, setPostcode] = useState("");

  // Billing address
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingLine1, setBillingLine1] = useState("");
  const [billingDistrictId, setBillingDistrictId] = useState<number>(21);

  // Coupon & Quote
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [note, setNote] = useState("");

  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderPlacedResponse | null>(null);

  // Initialize/Resolve variant and quantity when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setQuantity(initialQuantity || 1);
    setPlacedOrder(null);
    setOrderError(null);

    // If variants were provided via props directly
    if (variants && variants.length > 0) {
      setResolvedVariants(variants);
      if (optionName) setResolvedOptionName(optionName);

      const targetId = variantId && variantId > 0
        ? variantId
        : (variants.find((v) => v.is_default) || variants[0])?.id || 0;

      setActiveVariantId(targetId);
      const chosen = variants.find((v) => v.id === targetId) || variants[0] || null;
      setSelectedVariant(chosen);
      return;
    }

    // If a valid variantId was provided directly
    if (variantId && variantId > 0) {
      setActiveVariantId(variantId);
    }

    // If productSlug is present, fetch the full product details to get variants
    if (productSlug) {
      setVariantLoading(true);
      getProductBySlugAction(productSlug)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            const apiVariants = res.data.variants || [];
            setResolvedVariants(apiVariants);
            if (res.data.option?.name) {
              setResolvedOptionName(res.data.option.name);
            }

            const currentValid = apiVariants.some((v) => v.id === variantId);
            const chosen = currentValid
              ? apiVariants.find((v) => v.id === variantId)
              : (apiVariants.find((v) => v.is_default) || apiVariants[0]);

            if (chosen) {
              setActiveVariantId(chosen.id);
              setSelectedVariant(chosen);
            }
          }
        })
        .catch(() => {
          // ignore
        })
        .finally(() => {
          if (isMounted) setVariantLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, variantId, productSlug, variants, optionName, initialQuantity]);

  // Load locations and user addresses
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadData() {
      try {
        const locRes = await getCheckoutLocationsAction();
        if (isMounted && locRes.success && locRes.data) {
          setLocations(locRes.data);
          if (locRes.data.length > 0 && !districtId) {
            setDistrictId(locRes.data[0].id);
          }
        }
      } catch {
        // ignore
      }

      if (isAuthenticated) {
        try {
          const addrRes = await getAddressesAction();
          if (isMounted && addrRes.success && addrRes.data && addrRes.data.length > 0) {
            setSavedAddresses(addrRes.data);
            const def = addrRes.data.find((a) => a.is_default_shipping || a.is_default) || addrRes.data[0];
            setSelectedAddressId(def.id);
            setDistrictId(def.district_id || 21);
            setUseNewAddress(false);
          } else if (isMounted) {
            setUseNewAddress(true);
          }
        } catch {
          if (isMounted) setUseNewAddress(true);
        }
      } else {
        if (isMounted) setUseNewAddress(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated]);

  // Pre-fill user details
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setPhone((prev) => prev || user.phone || "");
      setEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  // Update district when a saved address is chosen
  const handleSelectSavedAddress = (addrId: number) => {
    setSelectedAddressId(addrId);
    setUseNewAddress(false);
    const addr = savedAddresses.find((a) => a.id === addrId);
    if (addr && addr.district_id) {
      setDistrictId(addr.district_id);
    }
  };

  // Fetch Quote when activeVariantId, quantity, districtId, or appliedCoupon changes
  useEffect(() => {
    if (!isOpen || !activeVariantId || activeVariantId <= 0) return;

    let isCancelled = false;

    async function fetchBuyNowQuote() {
      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const res = await buyNowQuoteAction({
          variant_id: activeVariantId,
          quantity: quantity,
          district_id: districtId,
          coupon_code: appliedCoupon || undefined,
        });

        if (!isCancelled) {
          if (res.success && res.data) {
            setQuote(res.data);
            // Default to first valid payment method if current is not in list
            if (
              res.data.payment_methods &&
              res.data.payment_methods.length > 0 &&
              !res.data.payment_methods.some((pm) => pm.method === paymentMethod)
            ) {
              setPaymentMethod(res.data.payment_methods[0].method);
            }
          } else {
            setQuoteError(!res.success ? (res.error?.message || "Failed to calculate quote") : "Failed quote");
          }
        }
      } catch {
        if (!isCancelled) {
          setQuoteError("Unable to calculate delivery quote for selected district.");
        }
      } finally {
        if (!isCancelled) {
          setQuoteLoading(false);
        }
      }
    }

    fetchBuyNowQuote();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, activeVariantId, quantity, districtId, appliedCoupon]);

  // Calculations in poisha
  const currentVariantPricePoisha = selectedVariant?.price
    ? selectedVariant.price
    : initialPrice
    ? takaToPoisha(initialPrice)
    : 0;
  const rawSubtotal = currentVariantPricePoisha ? currentVariantPricePoisha * quantity : 0;
  const subtotalPoisha = quote?.totals?.subtotal ?? rawSubtotal;
  const discountPoisha = quote?.totals?.discount ?? 0;
  const vatPoisha = quote?.totals?.vat ?? 0;
  const shippingChargePoisha = quote?.totals?.shipping
    ? Number(quote.totals.shipping)
    : quote?.shipping?.charge ?? 6000;
  const grandTotalPoisha = quote?.totals?.grand_total ?? (subtotalPoisha - discountPoisha + vatPoisha + shippingChargePoisha);

  // Available payment methods
  const paymentMethods = quote?.payment_methods && quote.payment_methods.length > 0
    ? quote.payment_methods
    : [
        { method: "cod", label: "Cash on delivery", is_online: false },
        { method: "bank_transfer", label: "Bank transfer", is_online: false },
        { method: "sslcommerz", label: "Online payment", is_online: true },
      ];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      setAppliedCoupon(couponCode.trim());
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon("");
  };

  // Submit Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (!activeVariantId || activeVariantId <= 0) {
      setOrderError("Please select a product variant before confirming your order.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: BuyNowPayload = {
        variant_id: Number(activeVariantId),
        quantity: Number(quantity),
        payment_method: paymentMethod,
        note: note.trim() || undefined,
        coupon_code: appliedCoupon || undefined,
      };

      if (!useNewAddress && selectedAddressId) {
        payload.address_id = selectedAddressId;
      } else {
        if (!name.trim() || !phone.trim() || !line1.trim()) {
          setOrderError("Please complete your delivery name, phone, and address.");
          setIsSubmitting(false);
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

        payload.name = name.trim();
        payload.phone = phone.trim();
        if (email.trim()) payload.email = email.trim();
        payload.address = shippingAddr;

        if (sameAsShipping) {
          payload.billing_address = shippingAddr;
        }
      }

      if (!sameAsShipping) {
        if (!billingName.trim() || !billingPhone.trim() || !billingLine1.trim()) {
          setOrderError("Please complete all required billing address fields.");
          setIsSubmitting(false);
          return;
        }
        payload.billing_address = {
          name: billingName.trim(),
          phone: billingPhone.trim(),
          line1: billingLine1.trim(),
          district_id: Number(billingDistrictId),
        };
      }

      const res = await buyNowAction(payload);

      if (res.success && res.data) {
        // If online payment gateway URL returned, redirect immediately
        if (res.data.gateway_url) {
          window.location.href = res.data.gateway_url;
          return;
        }

        setPlacedOrder(res.data);
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        setOrderError(
          !res.success
            ? res.error?.message || "Failed to place your Buy Now order. Please try again."
            : "Failed to place your Buy Now order."
        );
      }
    } catch {
      setOrderError("A network error occurred. Please verify your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-100/70 text-primary flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Instant Buy Now
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Direct item checkout with instant delivery quote
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {placedOrder ? (
          /* Confirmation Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200">
                Order Confirmed
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Thank you for your order!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your order{" "}
                <span className="font-bold text-slate-900">
                  {placedOrder.number}
                </span>{" "}
                has been placed successfully. A confirmation has been dispatched.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order Number:</span>
                <span className="font-bold text-slate-900">{placedOrder.number}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-black text-primary">
                  {formatPoisha(placedOrder.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {placedOrder.payment_method_label || placedOrder.payment_method}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="font-semibold text-emerald-600 uppercase text-[10px]">
                  {placedOrder.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/orders/${placedOrder.number}`}
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
              >
                Track & View Order
              </Link>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Order Form */
          <form onSubmit={handlePlaceOrder} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
            {orderError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Product Snapshot & Quantity */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 relative overflow-hidden shrink-0">
                    <Image
                      src={selectedVariant?.image || productImage || "/placeholder.svg"}
                      alt={productTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {productTitle}
                    </h4>
                    {(selectedVariant?.label || selectedVariant?.value || variantLabel) && (
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Variant: {selectedVariant?.label || selectedVariant?.value || variantLabel}
                      </span>
                    )}
                    {(selectedVariant?.sku || sku) && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        SKU: {selectedVariant?.sku || sku}
                      </span>
                    )}
                    <span className="text-xs font-black text-primary block mt-0.5">
                      {formatPoisha(
                        selectedVariant?.price
                          ? selectedVariant.price
                          : quote?.items?.[0]?.unit_price
                          ? quote.items[0].unit_price
                          : initialPrice
                          ? takaToPoisha(initialPrice)
                          : 0
                      )}
                    </span>
                  </div>
                </div>

                {/* Quantity Counter */}
                <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Variant Selector Pills if product has multiple variants */}
              {resolvedVariants.length > 1 && (
                <div className="p-3 bg-brand-50/50 border border-brand-200/70 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <span>Choose {resolvedOptionName || "Variant"}:</span>
                    </span>
                    {selectedVariant && (
                      <span className="text-[11px] font-semibold text-primary">
                        {selectedVariant.label || selectedVariant.value}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resolvedVariants.map((v) => {
                      const isSelected = activeVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setActiveVariantId(v.id);
                            setSelectedVariant(v);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs scale-[1.02]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          } ${!v.in_stock ? "opacity-50 line-through" : ""}`}
                        >
                          <span>{v.label || v.value || `Variant #${v.id}`}</span>
                          {v.price && (
                            <span className={`text-[10px] ${isSelected ? "text-brand-100" : "text-slate-500"}`}>
                              ৳{poishaToTaka(v.price).toFixed(0)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Address Selection or Entry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Delivery Destination</span>
                </div>
                {isAuthenticated && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    {useNewAddress ? "Use Saved Address" : "+ Enter New Address"}
                  </button>
                )}
              </div>

              {/* Saved Addresses list */}
              {isAuthenticated && savedAddresses.length > 0 && !useNewAddress ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const dName = typeof addr.district === "object" ? addr.district?.name : addr.district;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-brand-50/20 ring-1 ring-primary"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{addr.name}</span>
                          {addr.is_default_shipping && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-100 text-primary rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{addr.line1}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {dName || "District"} • {addr.phone}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* New Address Fields */
                <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Delivery District *</label>
                      <select
                        value={districtId}
                        onChange={(e) => setDistrictId(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Email (Optional)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Delivery Street Address *</label>
                    <input
                      type="text"
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="House / Flat / Road / Area"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live Financial Breakdown & Quote */}
            <div className="p-4 bg-brand-50/20 border border-brand-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-brand-100/60 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Receipt className="w-3.5 h-3.5 text-primary" />
                  <span>Item & Delivery Quote</span>
                </div>
                {quoteLoading ? (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" /> Calculating...
                  </span>
                ) : quote?.shipping ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {quote.shipping.zone_name} • {quote.shipping.delivery_days_min}-{quote.shipping.delivery_days_max} days
                  </span>
                ) : null}
              </div>

              {/* Coupon Row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary bg-white uppercase placeholder:normal-case"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal ({quantity} {quantity > 1 ? "items" : "item"})</span>
                  <span className="font-semibold text-slate-900">{formatPoisha(subtotalPoisha)}</span>
                </div>

                {discountPoisha > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1 font-medium">
                      <Tag className="w-3 h-3" />
                      Discount Applied
                    </span>
                    <span className="font-bold">-{formatPoisha(discountPoisha)}</span>
                  </div>
                )}

                {vatPoisha > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT</span>
                    <span className="font-semibold text-slate-900">{formatPoisha(vatPoisha)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    Delivery Fee
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatPoisha(shippingChargePoisha)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-sm font-black text-slate-900 pt-2 border-t border-brand-200/60">
                  <span>Grand Total</span>
                  <span className="text-primary text-base font-black">
                    {formatPoisha(grandTotalPoisha)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span>Ways of Paying on Offer</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {paymentMethods.map((pm) => (
                  <label
                    key={pm.method}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      paymentMethod === pm.method
                        ? "border-primary bg-brand-50/20 ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="radio"
                        name="buynow_payment"
                        value={pm.method}
                        checked={paymentMethod === pm.method}
                        onChange={() => setPaymentMethod(pm.method)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="font-bold text-slate-900 line-clamp-1">{pm.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {pm.is_online ? "Cards / Mobile Banking" : "Pay upon receipt"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Special Delivery Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Call before delivery, deliver in afternoon"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || quoteLoading || variantLoading || !activeVariantId || activeVariantId <= 0}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : variantLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading options...</span>
                  </>
                ) : quoteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating delivery...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay {formatPoisha(grandTotalPoisha)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
