import type { Metadata } from "next";
import { getAdminCouriersAction } from "@/app/(admin)/actions/couriers";
import { CouriersManagement } from "./_components/CouriersManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Couriers | Admin Portal" };

export default async function AdminCouriersPage() {
  const access = await guardAdminPage("/admin/couriers");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminCouriersAction();
  return <CouriersManagement initial={res.success ? res.data.data : []} initialError={res.success ? null : res.error.message} />;
}
