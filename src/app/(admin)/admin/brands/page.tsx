import type { Metadata } from "next";
import { getAdminBrandsAction } from "@/app/(admin)/actions/brands";
import { BrandsManagement } from "./_components/BrandsManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Brands | Admin Portal" };

export default async function AdminBrandsPage() {
  const access = await guardAdminPage("/admin/brands");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminBrandsAction();
  return (
    <BrandsManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
