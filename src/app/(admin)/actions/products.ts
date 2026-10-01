"use server";

import { serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export type ProductStatus = "draft" | "active" | "hidden";
export type ProductFlag = "featured" | "trending" | "new_arrival" | "best_seller";

export interface MediaRef {
  id: number;
  url: string;
  alt?: string | null;
}

/** Row in GET /admin/products */
export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  status: ProductStatus;
  sku: string | null;
  min_price: number;
  max_price: number;
  in_stock: boolean;
  stock_total: number;
  variants_count: number;
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  brand: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  image: MediaRef | null;
  updated_at: string;
}

export interface AdminVariant {
  id?: number;
  sku: string;
  is_default?: boolean;
  value?: string | null;
  unit?: string | null;
  label?: string | null;
  price: number;
  discount_price?: number | null;
  cost_price?: number | null;
  stock?: number;
  low_stock_threshold?: number | null;
  min_order_qty?: number;
  max_order_qty?: number | null;
  weight_grams?: number | null;
  is_active?: boolean;
  image?: MediaRef | null;
  image_id?: number | null;
}

/** GET /admin/products/{product} */
export interface AdminProductDetail {
  id: number;
  name: string;
  slug: string;
  status: ProductStatus;
  brand_id: number | null;
  category_id: number;
  brand: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  short_description: string | null;
  description: string | null;
  specifications: { key: string; value: string }[];
  video_url: string | null;
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  tags: string[];
  option_type_id: number | null;
  option_name: string | null;
  variants: AdminVariant[];
  main_image: MediaRef | null;
  gallery: MediaRef[];
  links: {
    related: { id: number; name: string }[];
    cross_sell: { id: number; name: string }[];
    upsell: { id: number; name: string }[];
  };
  min_price: number;
  max_price: number;
  in_stock: boolean;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProductPayload {
  name?: string;
  slug?: string | null;
  brand_id?: number | null;
  category_id?: number;
  short_description?: string | null;
  description?: string | null;
  specifications?: { key: string; value: string }[] | null;
  video_url?: string | null;
  status?: ProductStatus;
  is_featured?: boolean;
  is_trending?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  tags?: string[];
  main_image_id?: number | null;
  gallery_image_ids?: number[];
  option_type_id?: number | null;
  variants?: Omit<AdminVariant, "image" | "label" | "is_default">[];
}

export interface BulkProductPayload {
  action: "status" | "flag" | "price" | "stock" | "delete";
  ids: number[];
  status?: ProductStatus;
  flag?: ProductFlag;
  mode?: "set" | "add" | "increase_percent" | "decrease_percent" | "increase_amount" | "decrease_amount";
  value?: boolean | number;
}

export interface ProductImport {
  id: number;
  status: "pending" | "processing" | "completed" | "failed" | string;
  file: string;
  total_rows: number | null;
  products_created: number | null;
  products_updated: number | null;
  rows_failed: number | null;
  errors: { row?: number; message?: string; errors?: string[] }[] | string[];
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface BulkImageResult {
  file: string;
  status: "attached" | "skipped" | "failed" | string;
  message?: string;
}

/** GET /admin/products — filters: status, q, brand_id, category_id, stock, flag, sort */
export async function getAdminProductsAction(params?: QueryParams) {
  return adminList<AdminProductListItem>("GET_ADMIN_PRODUCTS", "Failed to load products", params);
}

/** GET /admin/products/{product} */
export async function getAdminProductAction(id: number) {
  return adminRequest<AdminProductDetail>("GET", "GET_ADMIN_PRODUCT", "Failed to load product", {
    pathParams: { id },
  });
}

/** POST /admin/products */
export async function createAdminProductAction(payload: AdminProductPayload) {
  return adminRequest<AdminProductDetail>("POST", "CREATE_ADMIN_PRODUCT", "Failed to create product", {
    body: payload,
  });
}

/** PUT /admin/products/{product} — `variants` replaces the whole set */
export async function updateAdminProductAction(id: number, payload: AdminProductPayload) {
  return adminRequest<AdminProductDetail>("PUT", "UPDATE_ADMIN_PRODUCT", "Failed to update product", {
    pathParams: { id },
    body: payload,
  });
}

/** PATCH /admin/products/{product}/status */
export async function updateAdminProductStatusAction(id: number, status: ProductStatus) {
  return adminRequest<AdminProductDetail>("PATCH", "UPDATE_ADMIN_PRODUCT_STATUS", "Failed to change status", {
    pathParams: { id },
    body: { status },
  });
}

/** POST /admin/products/{product}/duplicate — copies into a new draft */
export async function duplicateAdminProductAction(id: number) {
  return adminRequest<AdminProductDetail>("POST", "DUPLICATE_ADMIN_PRODUCT", "Failed to duplicate product", {
    pathParams: { id },
  });
}

/** PUT /admin/products/{product}/links */
export async function updateAdminProductLinksAction(
  id: number,
  links: { related: number[]; cross_sell: number[]; upsell: number[] }
) {
  return adminRequest<AdminProductDetail>("PUT", "LINK_ADMIN_PRODUCT", "Failed to save linked products", {
    pathParams: { id },
    body: links,
  });
}

/** DELETE /admin/products/{product} */
export async function deleteAdminProductAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_PRODUCT", "Failed to delete product", { pathParams: { id } });
}

/** POST /admin/products/bulk — one change to up to 500 products */
export async function bulkAdminProductsAction(payload: BulkProductPayload) {
  return adminRequest<{ action: string; products: number }>("POST", "BULK_ADMIN_PRODUCTS", "Bulk update failed", {
    body: payload,
  });
}

/** POST /admin/products/images/bulk — files matched to SKUs by file name */
export async function bulkUploadProductImagesAction(formData: FormData): Promise<ActionResponse<BulkImageResult[]>> {
  try {
    const res = await serverPost<{ data?: unknown } & Record<string, unknown>>("/admin/products/images/bulk", formData, { timeout: 120000 });
    if (!res.success) {
      return { success: false, error: { message: res.error?.message || "Image upload failed", code: "BULK_IMAGES_FAILED" } };
    }
    const data = res.data?.data ?? res.data;
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    return handleActionError(error);
  }
}

/** POST /admin/product-imports — spreadsheet import, runs in the background */
export async function importAdminProductsAction(formData: FormData): Promise<ActionResponse<ProductImport>> {
  try {
    const res = await serverPost<{ data?: unknown } & Record<string, unknown>>("/admin/product-imports", formData, { timeout: 120000 });
    if (!res.success) {
      return { success: false, error: { message: res.error?.message || "Import failed", code: "IMPORT_FAILED" } };
    }
    return { success: true, data: (res.data?.data ?? res.data) as ProductImport };
  } catch (error) {
    return handleActionError(error);
  }
}

/** GET /admin/product-imports/{productImport} */
export async function getAdminProductImportAction(id: number) {
  return adminRequest<ProductImport>("GET", "/admin/product-imports/:id", "Failed to load import status", {
    pathParams: { id },
  });
}
