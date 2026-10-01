"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export interface Coupon {
  id: number;
  code: string;
  type: "percent" | "fixed";
  /** basis points for `percent`, poisha for `fixed` */
  value: number;
  min_purchase: number | null;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  used_count: number;
  redemptions_count?: number;
  is_active: boolean;
  status: "active" | "inactive" | "scheduled" | "expired" | "used_up" | string;
  summary?: string;
  created_at: string;
}

export interface CouponPayload {
  code?: string;
  type?: "percent" | "fixed";
  value?: number;
  min_purchase?: number | null;
  max_discount?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  is_active?: boolean;
}

export interface FlashSaleItem {
  variant_id: number;
  sku?: string;
  product?: string;
  sale_price: number;
  usual_price?: number;
}

export interface FlashSale {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_running: boolean;
  items_count?: number;
  items?: FlashSaleItem[];
  created_at: string;
}

export interface FlashSalePayload {
  title?: string;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
  items?: { variant_id: number; sale_price: number }[];
}

/* ---------------- Coupons ---------------- */

/** GET /admin/coupons (q, status: active|scheduled|expired|used_up) */
export async function getAdminCouponsAction(params?: QueryParams) {
  return adminList<Coupon>("GET_ADMIN_COUPONS", "Failed to load coupons", params);
}

export async function getAdminCouponAction(id: number) {
  return adminRequest<Coupon>("GET", "GET_ADMIN_COUPON", "Failed to load coupon", { pathParams: { id } });
}

export async function createAdminCouponAction(payload: CouponPayload) {
  return adminRequest<Coupon>("POST", "CREATE_ADMIN_COUPON", "Failed to create coupon", { body: payload });
}

export async function updateAdminCouponAction(id: number, payload: CouponPayload) {
  return adminRequest<Coupon>("PUT", "UPDATE_ADMIN_COUPON", "Failed to update coupon", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminCouponAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_COUPON", "Failed to delete coupon", { pathParams: { id } });
}

/* ---------------- Flash sales ---------------- */

/** GET /admin/flash-sales (`running=1` for live ones) */
export async function getAdminFlashSalesAction(params?: QueryParams) {
  return adminList<FlashSale>("GET_ADMIN_FLASH_SALES", "Failed to load flash sales", params);
}

export async function getAdminFlashSaleAction(id: number) {
  return adminRequest<FlashSale>("GET", "GET_ADMIN_FLASH_SALE", "Failed to load flash sale", { pathParams: { id } });
}

export async function createAdminFlashSaleAction(payload: FlashSalePayload) {
  return adminRequest<FlashSale>("POST", "CREATE_ADMIN_FLASH_SALE", "Failed to create flash sale", { body: payload });
}

/** PUT /admin/flash-sales/{flashSale} — sending `items` replaces them */
export async function updateAdminFlashSaleAction(id: number, payload: FlashSalePayload) {
  return adminRequest<FlashSale>("PUT", "UPDATE_ADMIN_FLASH_SALE", "Failed to update flash sale", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminFlashSaleAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_FLASH_SALE", "Failed to delete flash sale", { pathParams: { id } });
}
