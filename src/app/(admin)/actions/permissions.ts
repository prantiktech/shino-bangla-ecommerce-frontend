"use server";

import { adminRequest } from "./_request";

export interface PermissionGroup {
  page: string;
  label: string;
  permissions: { name: string; action: string; label: string }[];
}

/** GET /permissions — the permission catalogue, grouped by page */
export async function getAdminPermissionsAction() {
  return adminRequest<PermissionGroup[]>("GET", "GET_ADMIN_PERMISSIONS", "Failed to load permissions");
}
