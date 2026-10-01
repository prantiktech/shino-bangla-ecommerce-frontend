import type { Metadata } from "next";
import { getAdminPurchasesAction } from "@/app/(admin)/actions/purchases";
import { PurchasesManagement } from "./_components/PurchasesManagement";

export const metadata: Metadata = { title: "Purchases | Admin Portal" };

export default async function AdminPurchasesPage() {
  const res = await getAdminPurchasesAction();
  return (
    <PurchasesManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
