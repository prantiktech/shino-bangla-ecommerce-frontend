"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";
import type { BusinessApplication, BusinessApplicationStatus } from "@/types/admin-orders";

/** GET /admin/business-applications — paginated; filters: status, q. `meta.counts.new` is the unread count. */
export async function getAdminBusinessApplicationsAction(params?: QueryParams) {
  return adminList<BusinessApplication>("GET_ADMIN_BUSINESS_APPLICATIONS", "Failed to load business applications", params);
}

/** GET /admin/business-applications/{id} — one application with its documents. */
export async function getAdminBusinessApplicationAction(id: number) {
  return adminRequest<BusinessApplication>("GET", "GET_ADMIN_BUSINESS_APPLICATION", "Failed to load the application", {
    pathParams: { id },
  });
}

/** PUT /admin/business-applications/{id} — status and internal note. */
export async function updateAdminBusinessApplicationAction(
  id: number,
  payload: { status?: BusinessApplicationStatus; admin_note?: string | null }
) {
  return adminRequest<BusinessApplication>("PUT", "UPDATE_ADMIN_BUSINESS_APPLICATION", "Failed to update the application", {
    pathParams: { id },
    body: payload,
  });
}

/** DELETE /admin/business-applications/{id} — its documents are erased too. */
export async function deleteAdminBusinessApplicationAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_BUSINESS_APPLICATION", "Failed to delete the application", { pathParams: { id } });
}
