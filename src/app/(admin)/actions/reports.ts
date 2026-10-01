"use server";

import { adminList, adminRequest, QueryParams } from "./_request";

export interface ReportType {
  type: string;
  label: string;
  dated: boolean;
}

export interface ReportColumn {
  key: string;
  label: string;
  type?: "date" | "money" | "integer" | "number" | "string" | "percent" | string;
}

export interface ReportResult {
  type: string;
  label: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  totals: Record<string, number> | null;
  range?: { from: string; to: string } | null;
}

export interface ReportExport {
  id: number;
  type: string;
  format: "xlsx" | "csv" | "pdf";
  status: "queued" | "processing" | "ready" | "failed" | null | string;
  row_count: number | null;
  size_bytes: number | null;
  error: string | null;
  is_downloadable: boolean;
  requested_by?: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/** GET /admin/reports */
export async function getAdminReportTypesAction() {
  return adminRequest<ReportType[]>("GET", "GET_ADMIN_REPORTS", "Failed to load report list");
}

/** GET /admin/reports/{type} — from, to (YYYY-MM-DD), status */
export async function getAdminReportAction(type: string, params?: QueryParams) {
  if (!/^[a-z_]+$/.test(type)) {
    return { success: false as const, error: { message: "Unknown report", code: "BAD_REPORT" } };
  }
  return adminRequest<ReportResult>("GET", "/admin/reports/:type", "Failed to run report", {
    pathParams: { type },
    params,
  });
}

/** POST /admin/reports/{type}/exports — queued file export */
export async function requestAdminReportExportAction(
  type: string,
  payload: { format: "xlsx" | "csv" | "pdf"; from?: string; to?: string; status?: string }
) {
  if (!/^[a-z_]+$/.test(type)) {
    return { success: false as const, error: { message: "Unknown report", code: "BAD_REPORT" } };
  }
  return adminRequest<ReportExport>("POST", "/admin/reports/:type/exports", "Failed to request export", {
    pathParams: { type },
    body: payload,
  });
}

/** GET /admin/report-exports */
export async function getAdminReportExportsAction(params?: QueryParams) {
  return adminList<ReportExport>("/admin/report-exports", "Failed to load exports", params);
}
