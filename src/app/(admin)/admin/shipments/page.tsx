import type { Metadata } from "next";
import { getAdminOrdersAction } from "@/app/(admin)/actions/orders";
import { ScanStation } from "./_components/ScanStation";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Scan station | Admin Portal" };

export default async function AdminShipmentsPage() {
  const access = await guardAdminPage("/admin/shipments");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminOrdersAction({ status: "packed", per_page: 50 });
  return <ScanStation initialPacked={res.success ? res.data.data : []} initialError={res.success ? null : res.error.message} />;
}
