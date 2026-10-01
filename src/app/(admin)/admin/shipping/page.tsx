import type { Metadata } from "next";
import { getAdminShippingZonesAction, getLocationOptionsAction } from "@/app/(admin)/actions/shipping";
import { ShippingManagement } from "./_components/ShippingManagement";

export const metadata: Metadata = { title: "Shipping Zones | Admin Portal" };

export default async function AdminShippingPage() {
  const [zones, locations] = await Promise.all([getAdminShippingZonesAction(), getLocationOptionsAction()]);
  return (
    <ShippingManagement
      initial={zones.success ? zones.data ?? [] : []}
      locations={locations}
      initialError={zones.success ? null : zones.error.message}
    />
  );
}
