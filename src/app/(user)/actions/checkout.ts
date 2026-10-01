"use server";

import { cookies } from "next/headers";
import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface CheckoutQuoteItem {
  variant_id: number;
  product_id: number;
  name: string;
  slug: string;
  label?: string | null;
  sku?: string | null;
  image?: string | null;
  quantity: number;
  unit_price: number;
  compare_at?: number | null;
  discount: number;
  vat_rate_bp: number;
  vat: number;
  line_total: number;
}

export interface CheckoutQuoteShipping {
  zone_id: number;
  zone_name: string;
  charge: number;
  free_applied: boolean;
  delivery_days_min: number;
  delivery_days_max: number;
}

export interface CheckoutQuoteTotals {
  subtotal: number;
  discount: number;
  vat: number;
  shipping: number | string;
  grand_total: number;
}

export interface CheckoutPaymentMethodOption {
  method: string;
  label: string;
  is_online: boolean;
  instructions?: string | null;
}

export interface CheckoutQuoteResponse {
  items: CheckoutQuoteItem[];
  coupon?: string | null;
  coupon_error?: string | null;
  shipping: CheckoutQuoteShipping;
  totals: CheckoutQuoteTotals;
  weight_grams?: number;
  payment_methods: CheckoutPaymentMethodOption[];
}

export interface CheckoutAddressPayload {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  area?: string;
  district_id: number;
  postcode?: string;
}

export interface PlaceOrderPayload {
  address_id?: number;
  billing_address_id?: number;
  address?: CheckoutAddressPayload;
  billing_address?: CheckoutAddressPayload;
  payment_method: string;
  note?: string;
  items?: Array<{ variant_id: number; quantity: number }>;
}

export interface OrderTimelineItem {
  status: string;
  note?: string | null;
  at: string;
}

export interface OrderPlacedResponse {
  id?: number;
  number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_method_label?: string;
  source?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  shipping_address?: any;
  billing_address?: any;
  delivery?: {
    zone?: string;
    days_min?: number;
    days_max?: number;
  };
  items?: any[];
  totals?: {
    subtotal: number;
    discount: number;
    vat: number;
    shipping: number | string;
    grand_total: number;
  };
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
  payment?: {
    tran_id?: string;
    gateway_url?: string;
    payment_url?: string;
    amount?: number;
    expires_at?: string;
  } | null;
  // Aliases for convenience
  order_number: string;
  total_amount: number;
  gateway_url?: string | null;
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

/**
 * Fetch checkout quote (lines, discount, VAT, delivery fee, grand total, and payment methods on offer)
 * Endpoint: POST /api/v1/checkout/quote
 */
export async function getCheckoutQuoteAction(params: {
  address_id?: number;
  district_id?: number;
}): Promise<ActionResponse<CheckoutQuoteResponse>> {
  try {
    const body: Record<string, any> = {};
    if (params.address_id) body.address_id = Number(params.address_id);
    if (params.district_id) body.district_id = Number(params.district_id);

    const res = await serverPost<any>("CHECKOUT_QUOTE", body);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to calculate checkout quote") : "Failed to calculate checkout quote",
        code: "CHECKOUT_QUOTE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Place order
 * Endpoint: POST /api/v1/checkout
 */
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
        number: orderData.number || orderData.order_number || `#${orderData.id || ""}`,
        order_number: orderData.number || orderData.order_number || `#${orderData.id || ""}`,
        total_amount: orderData.totals?.grand_total || orderData.total_amount || 0,
        gateway_url: paymentData?.gateway_url || paymentData?.payment_url || null,
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

export interface BuyNowQuoteParams {
  variant_id: number;
  quantity: number;
  district_id?: number;
  coupon_code?: string;
}

export interface BuyNowPayload {
  variant_id: number;
  quantity: number;
  name?: string;
  phone?: string;
  email?: string;
  address_id?: number;
  address?: CheckoutAddressPayload;
  billing_address?: CheckoutAddressPayload;
  coupon_code?: string;
  payment_method: string;
  note?: string;
}

/**
 * Fetch instant Buy Now quote for a specific variant & quantity, including delivery to district_id
 * Endpoint: POST /api/v1/buy-now/quote
 */
export async function buyNowQuoteAction(
  params: BuyNowQuoteParams
): Promise<ActionResponse<CheckoutQuoteResponse>> {
  try {
    const body: Record<string, any> = {
      variant_id: Number(params.variant_id),
      quantity: Number(params.quantity),
    };
    if (params.district_id) body.district_id = Number(params.district_id);
    if (params.coupon_code) body.coupon_code = params.coupon_code.trim();

    const res = await serverPost<any>("BUY_NOW_QUOTE", body);
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

/**
 * Place instant Buy Now order
 * Endpoint: POST /api/v1/buy-now
 */
export async function buyNowAction(
  payload: BuyNowPayload
): Promise<ActionResponse<OrderPlacedResponse>> {
  try {
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `buynow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const res = await serverPost<any>("BUY_NOW", payload, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    if (res.success && res.data) {
      const orderData = res.data.data || res.data;
      const paymentData = res.data.payment;
      const normalized: OrderPlacedResponse = {
        ...orderData,
        number: orderData.number || orderData.order_number || `#${orderData.id || ""}`,
        order_number: orderData.number || orderData.order_number || `#${orderData.id || ""}`,
        total_amount: orderData.totals?.grand_total || orderData.total_amount || 0,
        gateway_url: paymentData?.gateway_url || paymentData?.payment_url || null,
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

