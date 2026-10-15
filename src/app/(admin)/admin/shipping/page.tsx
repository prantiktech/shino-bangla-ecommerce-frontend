import type { Metadata } from "next";
import { getAdminShippingZonesAction, getLocationOptionsAction } from "@/app/(admin)/actions/shipping";
import { ShippingManagement } from "./_components/ShippingManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Shipping Zones | Admin Portal" };

export default async function AdminShippingPage() {
  const access = await guardAdminPage("/admin/shipping");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const [zones, locations] = await Promise.all([getAdminShippingZonesAction(), getLocationOptionsAction()]);
  return (
    <ShippingManagement
      initial={zones.success ? zones.data ?? [] : []}
      locations={locations}
      initialError={zones.success ? null : zones.error.message}
    />
  );
}
