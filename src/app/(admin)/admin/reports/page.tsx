import type { Metadata } from "next";
import { getAdminReportExportsAction, getAdminReportTypesAction } from "@/app/(admin)/actions/reports";
import { ReportsWorkspace } from "./_components/ReportsWorkspace";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Reports | Admin Portal" };

export default async function AdminReportsPage() {
  const access = await guardAdminPage("/admin/reports");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const [types, exportsRes] = await Promise.all([getAdminReportTypesAction(), getAdminReportExportsAction()]);
  return (
    <ReportsWorkspace
      types={types.success ? types.data ?? [] : []}
      initialExports={exportsRes.success ? exportsRes.data.data : []}
      initialError={types.success ? null : types.error.message}
    />
  );
}
