"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export interface MediaRef {
  id: number;
  url: string;
  alt?: string | null;
}

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  sort_order?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  logo?: MediaRef | null;
  banner?: MediaRef | null;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminBrandPayload {
  name?: string;
  slug?: string | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  logo_image_id?: number | null;
  banner_image_id?: number | null;
}

/** GET /admin/brands (paginated, `q` to search) */
export async function getAdminBrandsAction(params?: QueryParams) {
  return adminList<AdminBrand>("GET_ADMIN_BRANDS", "Failed to load brands", { per_page: 100, ...params });
}

/** GET /admin/brands/{brand} */
export async function getAdminBrandAction(id: number) {
  return adminRequest<AdminBrand>("GET", "GET_ADMIN_BRAND", "Failed to load brand", { pathParams: { id } });
}

/** POST /admin/brands */
export async function createAdminBrandAction(payload: AdminBrandPayload) {
  return adminRequest<AdminBrand>("POST", "CREATE_ADMIN_BRAND", "Failed to create brand", { body: payload });
}

/** PUT /admin/brands/{brand} */
export async function updateAdminBrandAction(id: number, payload: AdminBrandPayload) {
  return adminRequest<AdminBrand>("PUT", "UPDATE_ADMIN_BRAND", "Failed to update brand", {
    pathParams: { id },
    body: payload,
  });
}

/** DELETE /admin/brands/{brand} (only when no product uses it) */
export async function deleteAdminBrandAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_BRAND", "Failed to delete brand", { pathParams: { id } });
}
