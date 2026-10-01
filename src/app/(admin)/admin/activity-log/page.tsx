import React from "react";
import { Metadata } from "next";
import { getActivityLogsAction } from "@/app/(admin)/actions/activity-log";
import { ActivityLogManagement } from "./_components/ActivityLogManagement";
import { ActivityLogFilters } from "@/types/activity-log";

export const metadata: Metadata = {
  title: "Audit & Activity Logs | Store Management",
  description: "Real-time audit trail of staff actions, security events, authentication attempts, and operational records.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminActivityLogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const filters: ActivityLogFilters = {
    log: typeof resolvedParams.log === "string" ? resolvedParams.log : undefined,
    event: typeof resolvedParams.event === "string" ? resolvedParams.event : undefined,
    causer_id: typeof resolvedParams.causer_id === "string" ? Number(resolvedParams.causer_id) : undefined,
    subject_type: typeof resolvedParams.subject_type === "string" ? resolvedParams.subject_type : undefined,
    subject_id: typeof resolvedParams.subject_id === "string" ? Number(resolvedParams.subject_id) : undefined,
    from: typeof resolvedParams.from === "string" ? resolvedParams.from : undefined,
    to: typeof resolvedParams.to === "string" ? resolvedParams.to : undefined,
    q: typeof resolvedParams.q === "string" ? resolvedParams.q : undefined,
    page: typeof resolvedParams.page === "string" ? Number(resolvedParams.page) : 1,
    per_page: typeof resolvedParams.per_page === "string" ? Number(resolvedParams.per_page) : 25,
  };

  const res = await getActivityLogsAction(filters);
  const data = res.success && res.data ? res.data : { data: [] };

  return <ActivityLogManagement initialData={data} initialFilters={filters} />;
}
