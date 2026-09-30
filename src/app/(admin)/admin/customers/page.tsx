import React from "react";
import { Users, Search, Mail, Phone } from "lucide-react";
import { getAdminCustomersAction } from "@/app/(admin)/actions/customers";

export const metadata = {
  title: "Admin Customers | Store Management",
};

export default async function AdminCustomersPage() {
  const res = await getAdminCustomersAction();
  const customers = res.success ? (Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered customer accounts, contact details, and account status.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Orders</th>
                <th className="px-5 py-3.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-400">#{c.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{c.orders_count ?? 0}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
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
