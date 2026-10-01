"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function getAdminOrdersAction(params?: Record<string, any>): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_ORDERS", { params });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load admin orders") : "Failed to load orders",
        code: "GET_ADMIN_ORDERS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAdminOrderAction(id: number | string): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_ORDER", {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Order not found") : "Order not found",
        code: "ORDER_NOT_FOUND",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAdminOrderStatusAction(
  id: number | string,
  status: string,
  note?: string
): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>(
      "UPDATE_ADMIN_ORDER_STATUS",
      { status, note: note || undefined },
      { pathParams: { id } }
    );
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update order status") : "Update failed",
        code: "UPDATE_STATUS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markAdminOrderPaidAction(
  id: number | string,
  note?: string
): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>(
      "UPDATE_ADMIN_ORDER_PAYMENT",
      { note: note || undefined },
      { pathParams: { id } }
    );
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to record payment") : "Payment record failed",
        code: "RECORD_PAYMENT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
