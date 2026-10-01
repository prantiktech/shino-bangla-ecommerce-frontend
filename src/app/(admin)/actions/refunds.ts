"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { adminRequest } from "./_request";

export interface Refund {
  id: number;
  amount: number;
  reason: string | null;
  status?: string;
  gateway_ref?: string | null;
  refunded_by?: string | null;
  created_at: string;
}

/** GET /admin/orders/{order}/refunds — refunds made plus what is still refundable */
export async function getAdminOrderRefundsAction(
  orderId: number | string
): Promise<ActionResponse<{ refunds: Refund[]; refundable: number }>> {
  try {
    const res = await serverGet<{ data?: unknown; meta?: Record<string, unknown> } & Record<string, unknown>>("GET_ADMIN_ORDER_REFUNDS", { pathParams: { id: orderId }, cache: "no-store" });
    if (!res.success) {
      return { success: false, error: { message: res.error?.message || "Failed to load refunds", code: "REFUNDS_FAILED" } };
    }
    return {
      success: true,
      data: {
        refunds: Array.isArray(res.data?.data) ? res.data.data : [],
        refundable: Number(res.data?.meta?.refundable ?? 0),
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/** POST /admin/orders/{order}/refunds — `amount` in poisha; omit for the full refundable amount */
export async function createAdminOrderRefundAction(orderId: number | string, reason: string, amount?: number) {
  return adminRequest<Refund>("POST", "CREATE_ADMIN_ORDER_REFUND", "Refund failed", {
    pathParams: { id: orderId },
    body: amount ? { amount, reason } : { reason },
  });
}
