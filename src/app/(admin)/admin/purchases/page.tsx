import type { Metadata } from "next";
import { getAdminPurchasesAction } from "@/app/(admin)/actions/purchases";
import { PurchasesManagement } from "./_components/PurchasesManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Purchases | Admin Portal" };

export default async function AdminPurchasesPage() {
  const access = await guardAdminPage("/admin/purchases");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminPurchasesAction();
  return (
    <PurchasesManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
