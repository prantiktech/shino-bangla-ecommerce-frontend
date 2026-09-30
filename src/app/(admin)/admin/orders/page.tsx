import React from "react";
import { ShoppingBag, Search, Eye } from "lucide-react";
import { getAdminOrdersAction } from "@/app/(admin)/actions/orders";
import { poishaToTaka } from "@/lib/utils/money";

export const metadata = {
  title: "Admin Orders | Store Management",
};

export default async function AdminOrdersPage() {
  const res = await getAdminOrdersAction();
  const orders = res.success ? (Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer orders, payment status, and fulfillment workflow.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{o.order_number || `#${o.id}`}</td>
                    <td className="px-5 py-3.5">{o.customer_name || o.shipping_address?.full_name || "Guest"}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">৳ {poishaToTaka(o.total_amount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                        {o.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 uppercase">
                        {o.payment_status || "Unpaid"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
