import type { Metadata } from "next";
import { getAdminReportExportsAction, getAdminReportTypesAction } from "@/app/(admin)/actions/reports";
import { ReportsWorkspace } from "./_components/ReportsWorkspace";

export const metadata: Metadata = { title: "Reports | Admin Portal" };

export default async function AdminReportsPage() {
  const [types, exportsRes] = await Promise.all([getAdminReportTypesAction(), getAdminReportExportsAction()]);
  return (
    <ReportsWorkspace
      types={types.success ? types.data ?? [] : []}
      initialExports={exportsRes.success ? exportsRes.data.data : []}
      initialError={types.success ? null : types.error.message}
    />
  );
}
