"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Order, User, formatPoisha } from "@/lib/api";
import {
  Package,
  LogOut,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  ShoppingBag
} from "lucide-react";

interface AccountDashboardProps {
  initialUser: User;
  initialOrders: Order[];
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  initialUser,
  initialOrders
}) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [orders] = useState<Order[]>(initialOrders);
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

  return (
    <div className="min-h-screen bg-gray-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#009cae] text-2xl font-black shadow-xs">
              {initialUser.name ? initialUser.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {initialUser.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Customer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                {initialUser.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {initialUser.email}
                  </span>
                )}
                {initialUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {initialUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Orders Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#009cae]" />
                  <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
                </div>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-[#009cae] hover:underline"
                >
                  Shop More
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">You haven&apos;t placed any orders yet.</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#009cae] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#008998] transition-colors"
                  >
                    <span>Start Shopping</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 mt-2">
                  {orders.map((order) => (
                    <div key={order.id} className="py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">#{order.order_number}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatPoisha(order.grand_total)}</div>
                        <span className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 mt-0.5">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Info & Support Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Account Summary</h3>
              <div className="text-xs space-y-2 text-gray-600">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span>Role:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {initialUser.roles?.[0] || "Customer"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span>Active Status:</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span>Phone Verified:</span>
                  <span className="font-semibold text-emerald-600">
                    {initialUser.phone_verified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-200/60 text-xs text-teal-950 space-y-2">
              <span className="font-bold block text-sm text-[#009cae]">Customer Support</span>
              <p className="text-gray-600">
                Need help with your order or shipping? Contact our dedicated support team anytime.
              </p>
              <div className="pt-1">
                <Link
                  href="/track-order"
                  className="font-bold text-[#009cae] hover:underline flex items-center gap-1"
                >
                  <span>Track an order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
