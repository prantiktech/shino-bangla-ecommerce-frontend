"use server";

import { cookies } from "next/headers";
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
  items?: Array<{ variant_id: number; quantity: number }>;
}

export interface OrderPlacedResponse {
  id?: number;
  number?: string;
  order_number: string;
  total_amount: number;
  totals?: { grand_total: number };
  grand_total?: number;
  status: string;
  payment_status: string;
  payment_method: string;
  gateway_url?: string | null;
  payment?: {
    gateway: string;
    payment_url?: string | null;
  } | null;
}

export async function getCheckoutLocationsAction(): Promise<ActionResponse<any[]>> {
  try {
    const res = await serverGet<any>("GET_LOCATIONS");
    if (res.success && res.data) {
      const divisions = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      // Fetch all districts under each division in parallel
      const districtPromises = divisions.map((div: any) =>
        serverGet<any>("GET_LOCATIONS", { params: { parent_id: div.id } })
          .then((dRes) => {
            const list = dRes.success && dRes.data ? (Array.isArray(dRes.data.data) ? dRes.data.data : Array.isArray(dRes.data) ? dRes.data : []) : [];
            return list.map((item: any) => ({
              id: item.id,
              name: `${item.name} (${div.name})`,
              district_name: item.name,
              division: div.name,
            }));
          })
          .catch(() => [])
      );

      const districtGroups = await Promise.all(districtPromises);
      const allDistricts = districtGroups.flat();

      if (allDistricts.length > 0) {
        allDistricts.sort((a, b) =>
          a.district_name === "Dhaka"
            ? -1
            : b.district_name === "Dhaka"
            ? 1
            : a.district_name.localeCompare(b.district_name)
        );
        return { success: true, data: allDistricts };
      }

      return { success: true, data: divisions };
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
    const cookieStore = await cookies();
    const guestCartToken =
      cookieStore.get("cart_token")?.value ||
      cookieStore.get("shino_cart_token")?.value;

    // 1. If guest cart token exists in cookie, claim it into the authenticated user
    if (guestCartToken) {
      try {
        await serverPost("CLAIM_CART", undefined, {
          headers: {
            "X-Cart-Token": guestCartToken,
          },
        });
        cookieStore.delete("cart_token");
        cookieStore.delete("shino_cart_token");
      } catch {
        // ignore
      }
    }

    // 2. Verify if server cart has items. If empty and client provided items, sync them to backend!
    const cartRes = await serverGet<any>("GET_CART");
    const cartData = cartRes.success ? (cartRes.data?.data || cartRes.data) : null;
    const hasItems = cartData && Array.isArray(cartData.items) && cartData.items.length > 0;

    if (!hasItems && payload.items && payload.items.length > 0) {
      for (const item of payload.items) {
        if (item.variant_id && item.quantity > 0) {
          await serverPost("ADD_CART_ITEM", {
            variant_id: item.variant_id,
            quantity: item.quantity,
          }).catch(() => {});
        }
      }
    }

    // 3. Generate Idempotency-Key
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Strip client helper fields before sending to API
    const { items: _, ...apiPayload } = payload;

    const res = await serverPost<any>("CHECKOUT", apiPayload, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    if (res.success && res.data) {
      const orderData = res.data.data || res.data;
      const paymentData = res.data.payment;
      const normalized: OrderPlacedResponse = {
        ...orderData,
        order_number: orderData.order_number || orderData.number || `#${orderData.id || ""}`,
        total_amount: orderData.total_amount || orderData.totals?.grand_total || orderData.grand_total || 0,
        gateway_url: paymentData?.payment_url || null,
        payment: paymentData,
      };
      return { success: true, data: normalized };
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

export async function buyNowQuoteAction(params: {
  variant_id: number;
  quantity: number;
  district_id?: number;
  coupon_code?: string;
}): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>("BUY_NOW_QUOTE", params);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to get Buy Now quote") : "Failed quote",
        code: "BUY_NOW_QUOTE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function buyNowAction(payload: any): Promise<ActionResponse<OrderPlacedResponse>> {
  try {
    const res = await serverPost<any>("BUY_NOW", payload);
    if (res.success && res.data) {
      const orderData = res.data.data || res.data;
      const paymentData = res.data.payment;
      const normalized: OrderPlacedResponse = {
        ...orderData,
        order_number: orderData.order_number || orderData.number || `#${orderData.id || ""}`,
        total_amount: orderData.total_amount || orderData.totals?.grand_total || orderData.grand_total || 0,
        gateway_url: paymentData?.payment_url || null,
        payment: paymentData,
      };
      return { success: true, data: normalized };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to place Buy Now order") : "Buy now failed",
        code: "BUY_NOW_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
