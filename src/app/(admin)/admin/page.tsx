import React from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Users,
  Clock,
  Truck,
  CheckCheck
} from "lucide-react";
import { getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { getAdminDashboardAction } from "@/app/(admin)/actions/dashboard";
import { poishaToTaka } from "@/lib/utils/money";

export const metadata = {
  title: "Admin Dashboard | Store Management",
};

export default async function AdminDashboardPage() {
  const [dashboardRes, productsRes, categoriesRes] = await Promise.all([
    getAdminDashboardAction(),
    getProductsAction({ per_page: 5 }),
    getCategoriesAction(),
  ]);

  const dashData = dashboardRes.success && dashboardRes.data ? dashboardRes.data : null;
  const totals = dashData?.totals || {};
  const today = dashData?.today || {};
  const ordersByStatus = dashData?.orders_by_status || {};

  const totalProducts = productsRes.success ? productsRes.data.total : 0;
  const recentProducts = productsRes.success ? productsRes.data.items : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];
  const totalCategories = categories.length;

  const totalGrossRevenue = totals.gross || totals.revenue || 0;
  const totalOrdersCount = totals.orders || 0;
  const todayOrdersCount = today.orders || 0;
  const newCustomersCount = totals.new_customers || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time storefront sales, catalogue metrics, and operational health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Package className="w-4 h-4" />
            Manage Products
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Manage Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ৳ {poishaToTaka(totalGrossRevenue).toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> All-time Sales
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalOrdersCount}</div>
            <span className="text-[11px] text-[#FF5B00] font-semibold mt-1 inline-flex items-center gap-1">
              {todayOrdersCount} placed today
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF5B00] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active SKUs</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalProducts}</div>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-flex items-center gap-1">
              {totalCategories} categories live
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Accounts</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{newCustomersCount}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> API Connected
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Orders Breakdown Strip */}
      {dashData && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Orders Status Funnel</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Pending</span>
              <div className="text-xl font-black text-amber-900 mt-0.5">{ordersByStatus.pending || 0}</div>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Confirmed</span>
              <div className="text-xl font-black text-blue-900 mt-0.5">{ordersByStatus.confirmed || 0}</div>
            </div>
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Processing</span>
              <div className="text-xl font-black text-indigo-900 mt-0.5">{ordersByStatus.processing || 0}</div>
            </div>
            <div className="p-3 bg-cyan-50/70 border border-cyan-200/80 rounded-xl text-center">
              <span className="text-[10px] font-bold text-cyan-700 uppercase">Shipped</span>
              <div className="text-xl font-black text-cyan-900 mt-0.5">{ordersByStatus.shipped || 0}</div>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Delivered</span>
              <div className="text-xl font-black text-emerald-900 mt-0.5">{ordersByStatus.delivered || 0}</div>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Cancelled</span>
              <div className="text-xl font-black text-rose-900 mt-0.5">{ordersByStatus.cancelled || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Recent Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Products</h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#FF5B00] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Price (Taka)</th>
                  <th className="px-5 py-3">Stock Status</th>
                  <th className="px-5 py-3">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="px-5 py-3">৳ {poishaToTaka(p.price.min).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        {p.in_stock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.is_featured && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-[#FF5B00] rounded text-[10px] font-bold">
                              Featured
                            </span>
                          )}
                          {p.is_best_seller && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                              Best Seller
                            </span>
                          )}
                          {p.is_new_arrival && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories List (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Categories</h2>
            <Link
              href="/admin/categories"
              className="text-xs font-bold text-[#FF5B00] hover:underline flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5 divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">{cat.name}</span>
                  <div className="text-[11px] text-slate-400">/{cat.slug}</div>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                  {cat.product_count ?? 0} items
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
