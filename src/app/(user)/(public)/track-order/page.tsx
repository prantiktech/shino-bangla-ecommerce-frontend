"use client";

import React, { useState } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Truck, Search, CheckCircle2, Clock, PackageCheck, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOrderAction } from "@/app/(user)/actions/orders";
import { poishaToTaka } from "@/lib/utils/money";

interface TrackingData {
  order_number: string;
  status: string;
  placed_at: string;
  items: Array<{ name: string; quantity: number; unit_price: number }>;
  timeline: Array<{ status: string; note: string | null; created_at: string }>;
  totals?: { subtotal: number; shipping: number; total: number };
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;

    setError(null);
    setIsPending(true);

    try {
      const res = await trackOrderAction(orderNumber, phone);
      if (res.success && res.data) {
        setTrackingData(res.data);
      } else {
        setTrackingData(null);
        setError(!res.success ? (res.error?.message || "No order found matching this number and phone.") : "Order not found");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Track Order" },
        ]}
      />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-100/80 text-[#FF5B00] flex items-center justify-center mx-auto mb-3">
            <Truck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Enter your Order Number and Bangladeshi mobile phone to check live delivery status.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/90 shadow-sm mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Order Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 261001-X4V72"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-[#FF5B00] hover:bg-[#E64E00] text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isPending ? "Tracking..." : "Track Now"}</span>
            </Button>
          </form>
        </div>

        {/* Tracking Status Display */}
        {trackingData && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in-50 duration-300 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order Status</span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 font-mono">
                  #{trackingData.order_number}
                </h3>
              </div>
              <span className="px-3 py-1 bg-orange-50 text-[#FF5B00] border border-orange-200 text-xs font-bold rounded-full uppercase">
                {trackingData.status}
              </span>
            </div>

            {/* Order Items */}
            {trackingData.items && trackingData.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ordered Items</h4>
                <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-xl p-3">
                  {trackingData.items.map((item, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">
                        {item.name} <span className="text-gray-400">× {item.quantity}</span>
                      </span>
                      <span className="font-mono text-gray-900">
                        ৳ {poishaToTaka(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Order Timeline</h4>
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {trackingData.timeline && trackingData.timeline.length > 0 ? (
                  trackingData.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10 shrink-0 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-900 capitalize">{step.status}</h4>
                        {step.note && <p className="text-gray-600 mt-0.5">{step.note}</p>}
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          {new Date(step.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center z-10 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <h4 className="font-bold text-gray-900 capitalize">{trackingData.status}</h4>
                      <span className="text-[11px] text-gray-400 mt-0.5 block">
                        Placed: {new Date(trackingData.placed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
