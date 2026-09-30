"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface OrderItem {
  id: number;
  product_name: string;
  variant_label?: string;
  quantity: number;
  price: number; // in poisha
  subtotal: number; // in poisha
}

export interface OrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number; // in poisha
  shipping_fee: number; // in poisha
  discount_amount: number; // in poisha
  items: OrderItem[];
  shipping_address: any;
  created_at: string;
}

export async function getOrdersAction(): Promise<ActionResponse<OrderDetail[]>> {
  try {
    const res = await serverGet<any>("GET_ORDERS");
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
