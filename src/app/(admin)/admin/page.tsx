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
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { getAdminDashboardAction } from "@/app/(admin)/actions/dashboard";
import { poishaToTaka } from "@/lib/utils/money";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata = {
  title: "Dashboard | Admin Portal",
};

export default async function AdminDashboardPage() {
  const access = await guardAdminPage("/admin");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const [dashboardRes, productsRes, categoriesRes] = await Promise.all([
    getAdminDashboardAction({ limit: 6 }),
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

  const topProducts = (Array.isArray(dashData?.top_products) ? dashData.top_products : []) as {
    product_id: number;
    name: string;
    slug?: string;
    image?: string | null;
    quantity: number;
    revenue: number;
  }[];
  const topDistricts = (Array.isArray(dashData?.top_districts) ? dashData.top_districts : []) as {
    district_id: number;
    name: string;
    division?: string | null;
    orders: number;
    sales: number;
    share: number;
  }[];
  const statusTiles = [
    { key: "pending", label: "Pending", tone: "bg-amber-50/70 border-amber-200/80 text-amber-800" },
    { key: "confirmed", label: "Confirmed", tone: "bg-blue-50/70 border-blue-200/80 text-blue-800" },
    { key: "processing", label: "Processing", tone: "bg-indigo-50/70 border-indigo-200/80 text-indigo-800" },
    { key: "packed", label: "Packed", tone: "bg-violet-50/70 border-violet-200/80 text-violet-800" },
    { key: "on_hold", label: "On hold", tone: "bg-slate-50 border-slate-200 text-slate-700" },
    { key: "shipped", label: "Shipped", tone: "bg-cyan-50/70 border-cyan-200/80 text-cyan-800" },
    { key: "delivered", label: "Delivered", tone: "bg-emerald-50/70 border-emerald-200/80 text-emerald-800" },
    { key: "cancelled", label: "Cancelled", tone: "bg-rose-50/70 border-rose-200/80 text-rose-800" },
    { key: "returned", label: "Returned", tone: "bg-rose-50/70 border-rose-200/80 text-rose-800" },
  ];

  // Work waiting for staff, each linked to the screen where it is handled.
  const attention = (dashData?.needs_attention || {}) as Record<string, number | undefined>;
  const attentionItems = [
    { key: "pending_orders", label: "Orders to confirm", href: "/admin/orders?status=pending" },
    { key: "processing_orders", label: "Orders processing", href: "/admin/orders?status=processing" },
    { key: "on_hold_orders", label: "Orders on hold", href: "/admin/orders?status=on_hold" },
    { key: "pending_reviews", label: "Reviews to moderate", href: "/admin/reviews" },
    { key: "unread_messages", label: "Unread messages", href: "/admin/messages" },
    { key: "new_business_applications", label: "New business applications", href: "/admin/business-applications" },
    { key: "out_of_stock", label: "Out of stock", href: "/admin/inventory" },
  ].filter((i) => Number(attention[i.key] ?? 0) > 0);

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

      {attentionItems.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4" /> Needs attention
          </h2>
          <div className="flex flex-wrap gap-2">
            {attentionItems.map((i) => (
              <Link
                key={i.key}
                href={i.href}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold ring-1 ring-amber-200 transition-colors"
              >
                <span className="tabular-nums font-black">{attention[i.key]}</span> {i.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Orders by status, each linking to that tab of the orders list */}
      {dashData && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Orders by status</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {statusTiles.map((t) => (
              <Link
                key={t.key}
                href={`/admin/orders?status=${t.key}`}
                className={`p-3 border rounded-xl text-center hover:shadow-xs transition-shadow ${t.tone}`}
              >
                <span className="text-[10px] font-bold uppercase">{t.label}</span>
                <div className="text-xl font-black mt-0.5 tabular-nums">{ordersByStatus[t.key] || 0}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(topProducts.length > 0 || topDistricts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Top products</h2>
              {dashData?.range && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {dashData.range.from} to {dashData.range.to}
                </p>
              )}
            </div>
            {topProducts.length === 0 ? (
              <p className="p-5 text-xs text-slate-400">No sales in this period.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topProducts.map((p, i) => (
                  <li key={p.product_id} className="px-5 py-3 flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-slate-400 tabular-nums">{i + 1}</span>
                    <span className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      {p.slug ? (
                        <Link href={`/products/${p.slug}`} target="_blank" className="block text-xs font-semibold text-slate-900 truncate hover:text-[#FF5B00]">
                          {p.name}
                        </Link>
                      ) : (
                        <span className="block text-xs font-semibold text-slate-900 truncate">{p.name}</span>
                      )}
                      <span className="block text-[11px] text-slate-500">{p.quantity} sold</span>
                    </span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">৳ {poishaToTaka(p.revenue).toLocaleString("en-BD")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Top districts</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Where orders are delivered</p>
            </div>
            {topDistricts.length === 0 ? (
              <p className="p-5 text-xs text-slate-400">No orders in this period.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topDistricts.map((d) => (
                  <li key={d.district_id} className="px-5 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-900">
                        {d.name}
                        {d.division && <span className="font-normal text-slate-400"> · {d.division}</span>}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {d.orders} order{d.orders === 1 ? "" : "s"} · <span className="font-bold text-slate-900">৳ {poishaToTaka(d.sales).toLocaleString("en-BD")}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" title={`${d.share}% of sales`}>
                      <div className="h-full rounded-full bg-[#FF5B00]" style={{ width: `${Math.min(100, Math.max(0, Number(d.share) || 0))}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
