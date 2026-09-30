"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface CouponItem {
  id: number;
  code: string;
  type: "fixed" | "percent";
  value: number; // poisha or basis points
  min_spend?: number; // poisha
  max_discount?: number; // poisha
  usage_limit?: number;
  used_count: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
}

export async function getAdminCouponsAction(): Promise<ActionResponse<CouponItem[]>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_COUPONS");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load coupons") : "Failed to load coupons",
        code: "GET_COUPONS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createAdminCouponAction(payload: any): Promise<ActionResponse<CouponItem>> {
  try {
    const res = await serverPost<any>("CREATE_ADMIN_COUPON", payload);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to create coupon") : "Failed to create coupon",
        code: "CREATE_COUPON_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAdminCouponAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_COUPON", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete coupon") : "Failed to delete coupon",
        code: "DELETE_COUPON_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
