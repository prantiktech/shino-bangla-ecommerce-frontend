import type { Metadata } from "next";
import { getAdminCouponsAction } from "@/app/(admin)/actions/discounts";
import { CouponsManagement } from "./_components/CouponsManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Coupons | Admin Portal" };

export default async function AdminCouponsPage() {
  const access = await guardAdminPage("/admin/coupons");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminCouponsAction();
  return (
    <CouponsManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
