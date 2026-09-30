"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface CheckoutAddressPayload {
  name: string;
  phone: string;
  line1: string;
  area?: string;
  district_id: number;
}

export interface PlaceOrderPayload {
  address_id?: number;
  address?: CheckoutAddressPayload;
  payment_method: "cod" | "bank_transfer" | "sslcommerz";
  note?: string;
}

export interface OrderPlacedResponse {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  gateway_url?: string | null;
}

export async function getCheckoutLocationsAction(): Promise<ActionResponse<any[]>> {
  try {
    const res = await serverGet<any>("GET_LOCATIONS");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load locations") : "Failed to load locations",
        code: "GET_LOCATIONS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCheckoutQuoteAction(params: {
  address_id?: number;
  district_id?: number;
}): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>("CHECKOUT_QUOTE", params);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to calculate quote") : "Failed to calculate quote",
        code: "CHECKOUT_QUOTE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function placeOrderAction(payload: PlaceOrderPayload): Promise<ActionResponse<OrderPlacedResponse>> {
  try {
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
        message: !res.success ? (res.error?.message || "Failed to place order") : "Failed to place order",
        code: "PLACE_ORDER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
