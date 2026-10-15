import type { Metadata } from "next";
import { getAdminBusinessApplicationsAction } from "@/app/(admin)/actions/business-applications";
import { BusinessApplicationsManagement } from "./_components/BusinessApplicationsManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Business applications | Admin Portal" };

export default async function AdminBusinessApplicationsPage() {
  const access = await guardAdminPage("/admin/business-applications");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminBusinessApplicationsAction();
  return (
    <BusinessApplicationsManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
