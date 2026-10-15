import type { Metadata } from "next";
import { getAdminCustomersAction } from "@/app/(admin)/actions/customers";
import { CustomersManagement } from "./_components/CustomersManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Customers | Admin Portal" };

export default async function AdminCustomersPage() {
  const access = await guardAdminPage("/admin/customers");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminCustomersAction();
  return (
    <CustomersManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
