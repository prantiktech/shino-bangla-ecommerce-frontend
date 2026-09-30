"use client";

import React, { useState } from "react";
import { StoreSettings, updateAdminSettingsAction } from "@/app/(admin)/actions/settings";
import { Settings, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  initialSettings: StoreSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const res = await updateAdminSettingsAction(settings);
      if (res.success) {
        setSuccess("Store settings updated successfully!");
        router.refresh();
      } else {
        setError(res.error.message || "Failed to update settings");
      }
    } catch {
      setError("An unexpected error occurred while saving settings.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Store Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global store configuration, tax rates, checkout rules, and payment timeouts.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
        {/* Basic Store Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            General Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Store Name</label>
              <input
                type="text"
                required
                value={settings.store_name || ""}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Store Phone (Customer Support)</label>
              <input
                type="text"
                required
                value={settings.store_phone || ""}
                onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
              />
            </div>
          </div>
        </div>

        {/* VAT & Inventory */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Tax & Inventory Rules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default VAT Rate (bp)</label>
              <input
                type="number"
                value={settings.default_vat_rate_bp || 1500}
                onChange={(e) => setSettings({ ...settings, default_vat_rate_bp: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
              />
              <span className="text-[10px] text-slate-400">1500 bp = 15%</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={settings.low_stock_threshold || 5}
                onChange={(e) => setSettings({ ...settings, low_stock_threshold: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Payment Timeout (Minutes)</label>
              <input
                type="number"
                value={settings.order_payment_timeout_minutes || 30}
                onChange={(e) => setSettings({ ...settings, order_payment_timeout_minutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Payment & Checkout Methods
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cod_enabled}
                onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.checked })}
                className="w-4 h-4 text-[#FF5B00] rounded border-slate-300 focus:ring-[#FF5B00]"
              />
              Cash on Delivery (COD)
            </label>

            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bank_transfer_enabled}
                onChange={(e) => setSettings({ ...settings, bank_transfer_enabled: e.target.checked })}
                className="w-4 h-4 text-[#FF5B00] rounded border-slate-300 focus:ring-[#FF5B00]"
              />
              Bank Transfer Enabled
            </label>

            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vat_on_shipping}
                onChange={(e) => setSettings({ ...settings, vat_on_shipping: e.target.checked })}
                className="w-4 h-4 text-[#FF5B00] rounded border-slate-300 focus:ring-[#FF5B00]"
              />
              Apply VAT on Shipping
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
