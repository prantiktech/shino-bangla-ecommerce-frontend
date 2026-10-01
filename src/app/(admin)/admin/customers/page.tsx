import type { Metadata } from "next";
import { getAdminCustomersAction } from "@/app/(admin)/actions/customers";
import { CustomersManagement } from "./_components/CustomersManagement";

export const metadata: Metadata = { title: "Customers | Admin Portal" };

export default async function AdminCustomersPage() {
  const res = await getAdminCustomersAction();
  return (
    <CustomersManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
