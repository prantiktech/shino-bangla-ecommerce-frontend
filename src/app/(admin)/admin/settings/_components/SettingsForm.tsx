"use client";

import React, { useRef, useState } from "react";
import { Banknote, ImageIcon, Receipt, Settings, ShieldCheck, Store, Upload } from "lucide-react";
import { StoreSettings, updateAdminSettingsAction } from "@/app/(admin)/actions/settings";
import { StoreAsset, uploadStoreAssetAction } from "@/app/(admin)/actions/settings-assets";
import {
  Button,
  Card,
  Field,
  Input,
  NoticeBanner,
  PageHeader,
  Spinner,
  Textarea,
  Toggle,
  useNotice,
} from "@/app/(admin)/components/ui";
import { bpToPercent, percentToBp } from "@/app/(admin)/components/format";

const ASSETS: { key: StoreAsset; field: keyof StoreSettings; label: string; hint: string }[] = [
  { key: "logo", field: "logo_url", label: "Store logo", hint: "Your brand logo file. PNG, JPG or WebP, up to 2 MB." },
  { key: "favicon", field: "favicon_url", label: "Favicon", hint: "Browser tab icon. Square PNG or ICO." },
  { key: "invoice-logo", field: "invoice_logo_url", label: "Invoice logo", hint: "Printed on PDF invoices." },
];

function AssetUploader({
  asset,
  url,
  label,
  hint,
  onUploaded,
  onError,
}: {
  asset: StoreAsset;
  url: string | null | undefined;
  label: string;
  hint: string;
  onUploaded: (s: StoreSettings) => void;
  onError: (m: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return onError(`${label} must be 2 MB or smaller.`);
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadStoreAssetAction(asset, fd);
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (!res.success) return onError(res.error.message);
    onUploaded(res.data);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="w-16 h-16 rounded-xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center overflow-hidden shrink-0">
        {busy ? (
          <Spinner />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="max-w-full max-h-full object-contain" />
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-300" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <Button size="sm" variant="secondary" icon={Upload} disabled={busy} onClick={() => ref.current?.click()}>
        {url ? "Replace" : "Upload"}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/x-icon,.ico"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

export function SettingsForm({ initialSettings }: { initialSettings: StoreSettings }) {
  const [saved, setSaved] = useState<StoreSettings>(initialSettings);
  const [form, setForm] = useState({
    store_name: initialSettings.store_name ?? "",
    store_email: initialSettings.store_email ?? "",
    store_phone: initialSettings.store_phone ?? "",
    store_address: initialSettings.store_address ?? "",
    vat_percent: bpToPercent(initialSettings.default_vat_rate_bp ?? 0),
    vat_on_shipping: !!initialSettings.vat_on_shipping,
    low_stock_threshold: String(initialSettings.low_stock_threshold ?? 5),
    cod_enabled: !!initialSettings.cod_enabled,
    bank_transfer_enabled: !!initialSettings.bank_transfer_enabled,
    bank_transfer_instructions: initialSettings.bank_transfer_instructions ?? "",
    order_payment_timeout_minutes: String(initialSettings.order_payment_timeout_minutes ?? 30),
    order_phone_verification: !!initialSettings.order_phone_verification,
    order_confirmation_sms: !!initialSettings.order_confirmation_sms,
    duplicate_order_block: !!initialSettings.duplicate_order_block,
    duplicate_order_minutes: String(initialSettings.duplicate_order_minutes ?? 15),
    courier_protection: !!initialSettings.courier_protection,
    courier_min_success_rate: String(initialSettings.courier_min_success_rate ?? 50),
    courier_min_parcels: String(initialSettings.courier_min_parcels ?? 3),
  });
  const [saving, setSaving] = useState(false);
  const { notice, success, error, clear } = useNotice();

  type Form = typeof form;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store_name.trim()) return error("Store name is required.");
    if (form.store_email && !/^\S+@\S+\.\S+$/.test(form.store_email)) return error("Enter a valid store email.");
    const vat = percentToBp(form.vat_percent);
    if (vat === null || vat < 0 || vat > 10000) return error("VAT must be between 0% and 100%.");
    const timeout = Number(form.order_payment_timeout_minutes);
    if (!Number.isInteger(timeout) || timeout < 5 || timeout > 1440) return error("Payment timeout must be 5 to 1440 minutes.");
    const low = Number(form.low_stock_threshold);
    if (!Number.isInteger(low) || low < 0 || low > 100000) return error("Low stock threshold must be a whole number up to 100,000.");
    const dupMinutes = Number(form.duplicate_order_minutes);
    if (!Number.isInteger(dupMinutes) || dupMinutes < 1 || dupMinutes > 1440) return error("The duplicate-order window must be 1 to 1440 minutes.");
    const minRate = Number(form.courier_min_success_rate);
    if (!Number.isInteger(minRate) || minRate < 1 || minRate > 100) return error("The minimum success rate must be 1% to 100%.");
    const minParcels = Number(form.courier_min_parcels);
    if (!Number.isInteger(minParcels) || minParcels < 1 || minParcels > 100) return error("The minimum number of parcels must be 1 to 100.");
    setSaving(true);
    const res = await updateAdminSettingsAction({
      store_name: form.store_name.trim(),
      store_email: form.store_email.trim() || null,
      store_phone: form.store_phone.trim() || null,
      store_address: form.store_address.trim() || null,
      default_vat_rate_bp: vat,
      vat_on_shipping: form.vat_on_shipping,
      low_stock_threshold: low,
      cod_enabled: form.cod_enabled,
      bank_transfer_enabled: form.bank_transfer_enabled,
      bank_transfer_instructions: form.bank_transfer_instructions.trim() || null,
      order_payment_timeout_minutes: timeout,
      order_phone_verification: form.order_phone_verification,
      order_confirmation_sms: form.order_confirmation_sms,
      duplicate_order_block: form.duplicate_order_block,
      duplicate_order_minutes: dupMinutes,
      courier_protection: form.courier_protection,
      courier_min_success_rate: minRate,
      courier_min_parcels: minParcels,
    });
    setSaving(false);
    if (!res.success) return error(res.error.message);
    setSaved((s) => ({ ...s, ...res.data }));
    // The server may refuse a switch it cannot honour (e.g. SMS not configured); show what was actually saved.
    setForm((f) => ({
      ...f,
      order_phone_verification: res.data.order_phone_verification ?? f.order_phone_verification,
      order_confirmation_sms: res.data.order_confirmation_sms ?? f.order_confirmation_sms,
    }));
    success("Store settings saved.");
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-4xl">
      <PageHeader
        icon={Settings}
        title="Store settings"
        description="Store details, tax, stock alerts, payment methods and order protection."
        actions={
          <Button type="submit" loading={saving}>
            Save settings
          </Button>
        }
      />
      <NoticeBanner notice={notice} onClose={clear} />

      <Card className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-slate-400" />
          Store details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store name" required>
            <Input value={form.store_name} onChange={(e) => set("store_name", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Contact email">
            <Input type="email" value={form.store_email} onChange={(e) => set("store_email", e.target.value)} maxLength={255} />
          </Field>
          <Field label="Contact phone">
            <Input type="tel" value={form.store_phone} onChange={(e) => set("store_phone", e.target.value)} maxLength={32} />
          </Field>
          <Field label="Address" hint="Shown in the footer and on invoices.">
            <Textarea value={form.store_address} onChange={(e) => set("store_address", e.target.value)} rows={2} maxLength={500} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          Logo and icons
        </h2>
        <div className="divide-y divide-slate-100">
          {ASSETS.map((a) => (
            <div key={a.key} className="py-3 first:pt-0 last:pb-0">
              <AssetUploader
                asset={a.key}
                url={saved[a.field] as string | null | undefined}
                label={a.label}
                hint={a.hint}
                onUploaded={(s) => {
                  setSaved((prev) => ({ ...prev, ...s }));
                  success(`${a.label} updated.`);
                }}
                onError={error}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" />
          Tax and stock
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Field label="Default VAT rate" hint="Categories can override this.">
            <div className="relative">
              <Input type="number" min={0} max={100} step="0.01" value={form.vat_percent} onChange={(e) => set("vat_percent", e.target.value)} className="pr-8" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </Field>
          <Field label="Low stock alert at" hint="Products at or below this quantity are flagged.">
            <Input type="number" min={0} value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} />
          </Field>
          <Toggle checked={form.vat_on_shipping} onChange={(v) => set("vat_on_shipping", v)} label="Charge VAT on delivery" />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-slate-400" />
          Payments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Toggle checked={form.cod_enabled} onChange={(v) => set("cod_enabled", v)} label="Cash on delivery" description="Customers pay the courier." />
          <Toggle
            checked={form.bank_transfer_enabled}
            onChange={(v) => set("bank_transfer_enabled", v)}
            label="Bank transfer"
            description="Customers transfer before dispatch."
          />
        </div>
        {form.bank_transfer_enabled && (
          <Field label="Bank transfer instructions" hint="Shown to customers who choose bank transfer.">
            <Textarea
              value={form.bank_transfer_instructions}
              onChange={(e) => set("bank_transfer_instructions", e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Bank, account name, account number, branch and reference to use"
            />
          </Field>
        )}
        <Field label="Online payment timeout" hint="Unpaid online orders are cancelled after this many minutes (5–1440)." className="sm:w-64">
          <Input
            type="number"
            min={5}
            max={1440}
            value={form.order_payment_timeout_minutes}
            onChange={(e) => set("order_payment_timeout_minutes", e.target.value)}
          />
        </Field>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          Order protection
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Toggle
            checked={form.order_phone_verification}
            onChange={(v) => set("order_phone_verification", v)}
            label="Verify the mobile number"
            description="Customers enter a 6-digit SMS code before an order is accepted. Needs SMS set up on the server."
          />
          <Toggle
            checked={form.order_confirmation_sms}
            onChange={(v) => set("order_confirmation_sms", v)}
            label="Order confirmation SMS"
            description="Text the customer when an order is placed. Needs SMS set up on the server."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-4 border-t border-slate-100">
          <Toggle
            checked={form.duplicate_order_block}
            onChange={(v) => set("duplicate_order_block", v)}
            label="Block duplicate orders"
            description="Refuse a second order from the same number within a short window."
          />
          <Field label="Duplicate window (minutes)" hint="1 to 1440.">
            <Input
              type="number"
              min={1}
              max={1440}
              value={form.duplicate_order_minutes}
              disabled={!form.duplicate_order_block}
              onChange={(e) => set("duplicate_order_minutes", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pt-4 border-t border-slate-100">
          <Toggle
            checked={form.courier_protection}
            onChange={(v) => set("courier_protection", v)}
            label="Courier record protection"
            description="Refuse cash orders from numbers that rarely accept their parcels."
          />
          <Field label="Minimum success rate" hint="Delivered ÷ finished parcels, 1–100%.">
            <div className="relative">
              <Input
                type="number"
                min={1}
                max={100}
                value={form.courier_min_success_rate}
                disabled={!form.courier_protection}
                onChange={(e) => set("courier_min_success_rate", e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </Field>
          <Field label="Judge after" hint="Finished parcels before the rate counts (1–100).">
            <Input
              type="number"
              min={1}
              max={100}
              value={form.courier_min_parcels}
              disabled={!form.courier_protection}
              onChange={(e) => set("courier_min_parcels", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
