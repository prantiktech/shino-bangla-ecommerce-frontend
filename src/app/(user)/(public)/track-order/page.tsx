"use client";

import React, { useState } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Truck, Search, CheckCircle2, Clock, PackageCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [trackingResult, setTrackingResult] = useState<boolean>(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setTrackingResult(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      <Breadcrumb
        items={[
          { label: "Pages", href: "/track-order" },
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
            Enter your 8-digit Order ID and contact number to check live shipping status.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/90 shadow-sm mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Order ID / Tracking Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TH-89241"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01800123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#FF5B00] hover:bg-[#E64E00] text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-2"
            >
              <Search className="w-4 h-4" />
              <span>Track Now</span>
            </Button>
          </form>
        </div>

        {/* Tracking Status Display */}
        {trackingResult && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order Status</span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Order #{orderNumber.toUpperCase()}
                </h3>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                Out for Delivery
              </span>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Order Confirmed & Packed</h4>
                  <p className="text-[11px] text-gray-500">Dhaka Central Toy House Warehouse</p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10 shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Handed Over to Courier</h4>
                  <p className="text-[11px] text-gray-500">Steadfast Express Logistics</p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-[#FF5B00] text-white flex items-center justify-center z-10 shrink-0 animate-pulse">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#FF5B00]">Out for Delivery</h4>
                  <p className="text-[11px] text-gray-500">Courier rider is heading to your delivery address</p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center z-10 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400">Delivered</h4>
                  <p className="text-[11px] text-gray-400">Estimated delivery: Today by 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
