import type { Metadata } from "next";
import { getAdminBrandsAction } from "@/app/(admin)/actions/brands";
import { BrandsManagement } from "./_components/BrandsManagement";

export const metadata: Metadata = { title: "Brands | Admin Portal" };

export default async function AdminBrandsPage() {
  const res = await getAdminBrandsAction();
  return (
    <BrandsManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
