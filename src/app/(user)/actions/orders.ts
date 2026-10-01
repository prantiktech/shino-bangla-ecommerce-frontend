"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface OrderItem {
  id?: number;
  product_id?: number;
  variant_id?: number;
  name?: string;
  product_name?: string;
  label?: string;
  variant_label?: string;
  sku?: string;
  image?: string | null;
  quantity: number;
  price?: number;
  unit_price?: number; // in poisha
  discount?: number;
  vat_rate_bp?: number;
  vat?: number;
  subtotal?: number;
  line_total?: number; // in poisha
}

export interface OrderTimelineItem {
  status: string;
  note?: string | null;
  at: string;
}

export interface OrderContact {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderDelivery {
  zone?: string;
  days_min?: number;
  days_max?: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  vat: number;
  shipping: number | string;
  grand_total: number;
}

export interface OrderDetail {
  id?: number;
  number?: string;
  order_number?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_method_label?: string;
  source?: string;
  contact?: OrderContact;
  shipping_address?: any;
  billing_address?: any;
  delivery?: OrderDelivery;
  items?: OrderItem[];
  preview?: Array<{ name: string; label?: string; image?: string | null; quantity: number }>;
  totals?: OrderTotals;
  coupon_code?: string | null;
  currency?: string;
  note?: string | null;
  can_cancel?: boolean;
  payment_expires_at?: string | null;
  placed_at?: string;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  timeline?: OrderTimelineItem[];
  created_at?: string;
  // Fallbacks
  total_amount?: number;
  grand_total?: number;
  item_count?: number;
  shipping_fee?: number;
  discount_amount?: number;
}

export async function getOrdersAction(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<ActionResponse<OrderDetail[]>> {
  try {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.per_page) cleanParams.per_page = params.per_page;
      if (params.status && params.status !== "all") cleanParams.status = params.status;
    }

    const res = await serverGet<any>("GET_ORDERS", {
      params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
    });
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load orders") : "Failed to load orders",
        code: "GET_ORDERS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getOrderDetailAction(orderNumber: string): Promise<ActionResponse<OrderDetail>> {
  try {
    const res = await serverGet<any>("GET_ORDER", {
      pathParams: { orderNumber },
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

export async function trackOrderAction(
  orderNumber: string,
  phone: string
): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("TRACK_ORDER", {
      params: {
        number: orderNumber.trim(),
        phone: phone.trim(),
      },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Order not found. Please check order number and phone.") : "Order not found",
        code: "TRACK_ORDER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Cancel an order the shop has not started packing.
 * Anything later has to be asked for: the stock is already committed and it may be on its way.
 * Endpoint: POST /api/v1/me/orders/{number}/cancel
 */
export async function cancelOrderAction(
  orderNumber: string,
  reason?: string
): Promise<ActionResponse<OrderDetail>> {
  try {
    const res = await serverPost<any>(
      "CANCEL_ORDER",
      { reason: reason?.trim() || undefined },
      {
        pathParams: { orderNumber: orderNumber.trim() },
      }
    );

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      return { success: true, data };
    }

    return {
      success: false,
      error: {
        message:
          !res.success && res.error
            ? res.error.message ||
              "Cannot cancel order. The shop has already started packing or dispatched this order; the stock is committed."
            : "Failed to cancel order.",
        code: res.success ? "CANCEL_ORDER_FAILED" : res.error?.code || "CANCEL_ORDER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function checkoutAction(payload: any): Promise<ActionResponse<OrderDetail>> {
  try {
    const idempotencyKey = crypto.randomUUID();
    const res = await serverPost<any>("CHECKOUT", payload, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Checkout failed") : "Checkout failed",
        code: "CHECKOUT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Start or retry an online payment for an order.
 * POST /api/v1/orders/{number}/pay
 * Returns { gateway_url: string }
 */
export async function payOrderAction(
  orderNumber: string,
  phone?: string
): Promise<ActionResponse<{ gateway_url: string }>> {
  try {
    const payload = phone?.trim() ? { phone: phone.trim() } : {};
    const res = await serverPost<any>(
      "ORDER_PAY",
      payload,
      {
        pathParams: {
          number: orderNumber.trim(),
          orderNumber: orderNumber.trim(),
        },
      }
    );

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message:
          !res.success && res.error?.message
            ? res.error.message
            : "Payment initiation failed or order is no longer payable online.",
        code: res.success ? "PAYMENT_FAILED" : res.error?.code || "PAYMENT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Helper to get the authenticated download URL for an order invoice.
 * GET /api/orders/[orderNumber]/invoice
 */
export async function getOrderInvoiceUrlAction(
  orderNumber: string
): Promise<{ success: boolean; url: string }> {
  return {
    success: true,
    url: `/api/orders/${encodeURIComponent(orderNumber)}/invoice`,
  };
}

