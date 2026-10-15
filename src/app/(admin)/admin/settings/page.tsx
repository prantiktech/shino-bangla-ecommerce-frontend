import React from "react";
import { getAdminSettingsAction, StoreSettings } from "@/app/(admin)/actions/settings";
import { SettingsForm } from "./_components/SettingsForm";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata = {
  title: "Store Settings | Admin Portal",
};

export default async function AdminSettingsPage() {
  const access = await guardAdminPage("/admin/settings");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminSettingsAction();
  const settings: StoreSettings = res.success && res.data ? res.data : {
    store_name: "Nogod Bazar",
    store_phone: "+8801700000000",
    default_vat_rate_bp: 1500,
    vat_on_shipping: false,
    cod_enabled: true,
    bank_transfer_enabled: true,
    low_stock_threshold: 5,
    order_payment_timeout_minutes: 30,
  };

  return <SettingsForm initialSettings={settings} />;
}
