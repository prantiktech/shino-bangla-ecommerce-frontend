import type { Metadata } from "next";
import { getAdminFlashSalesAction } from "@/app/(admin)/actions/discounts";
import { FlashSalesManagement } from "./_components/FlashSalesManagement";

export const metadata: Metadata = { title: "Flash Sales | Admin Portal" };

export default async function AdminFlashSalesPage() {
  const res = await getAdminFlashSalesAction();
  return (
    <FlashSalesManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
