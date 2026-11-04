"use server";

import { cookies, headers } from "next/headers";
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
  /** 6-digit code from `POST /orders/phone-code`, when the shop verifies order numbers. */
  phone_code?: string;
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

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:.]+$/i;

/**
 * The shopper's own IP address. Orders are placed from this server, so the API would otherwise only see
 * the server's address; `customer_ip` feeds its fraud checks and the "Block IP" rule.
 * Trusts the first X-Forwarded-For hop, as set by the reverse proxy in front of Next.js.
 */
async function getCustomerIp(): Promise<string | undefined> {
  try {
    const h = await headers();
    const candidate = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim().replace(/^::ffff:/, "");
    if (IPV4.test(candidate) || (candidate.includes(":") && IPV6.test(candidate))) return candidate;
  } catch {
    /* outside a request */
  }
  return undefined;
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

export interface ShippingRate {
  from: number;
  to: number | null;
  charge: number;
  per_extra_kg: number | null;
}

export interface ShippingZone {
  id: number;
  name: string;
  type: string;
  rate_basis: string;
  free_above?: number | null;
  delivery_days_min: number;
  delivery_days_max: number;
  districts: string[];
  rates: ShippingRate[];
}

/**
 * Fetch delivery zones, charges and estimated days.
 * Endpoint: GET /api/v1/shipping/zones
 */
export async function getShippingZonesAction(): Promise<ActionResponse<ShippingZone[]>> {
  try {
    const res = await serverGet<any>("GET_SHIPPING_ZONES");
    if (res.success && res.data) {
      const zones = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: zones };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load shipping zones") : "Failed to load shipping zones",
        code: "GET_SHIPPING_ZONES_FAILED",
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
    const { items: _, ...rest } = payload;
    const customerIp = await getCustomerIp();
    const apiPayload = customerIp ? { ...rest, customer_ip: customerIp } : rest;

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
        // Keep the API's code and field errors so the form can react (e.g. a missing phone_code).
        code: (!res.success && res.error?.code) || "PLACE_ORDER_FAILED",
        status: !res.success ? res.error?.status : undefined,
        fields: !res.success ? res.error?.fields : undefined,
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
  /** 6-digit code from `POST /orders/phone-code`, when the shop verifies order numbers. */
  phone_code?: string;
}

/**
 * Fetch instant Buy Now quote for a specific variant & quantity, including delivery to district_id
 * Endpoint: POST /api/v1/buy-now/quote
 */
export async function buyNowQuoteAction(
  params: BuyNowQuoteParams
): Promise<ActionResponse<CheckoutQuoteResponse>> {
  try {
    const variantId = Number(params.variant_id);
    if (!variantId || variantId <= 0 || isNaN(variantId)) {
      return {
        success: false,
        error: {
          message: "Please select a valid product variant.",
          code: "INVALID_VARIANT_ID",
        },
      };
    }

    const body: Record<string, any> = {
      variant_id: variantId,
      quantity: Math.max(1, Number(params.quantity) || 1),
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
    const variantId = Number(payload.variant_id);
    if (!variantId || variantId <= 0 || isNaN(variantId)) {
      return {
        success: false,
        error: {
          message: "Please select a valid product variant before placing your order.",
          code: "INVALID_VARIANT_ID",
        },
      };
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `buynow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const customerIp = await getCustomerIp();
    const res = await serverPost<any>("BUY_NOW", customerIp ? { ...payload, customer_ip: customerIp } : payload, {
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
        // Keep the API's code and field errors so the form can react (e.g. a missing phone_code).
        code: (!res.success && res.error?.code) || "BUY_NOW_FAILED",
        status: !res.success ? res.error?.status : undefined,
        fields: !res.success ? res.error?.fields : undefined,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export interface OrderPhoneCodeResponse {
  /** false when the shop does not ask for a code: the order can be placed directly. */
  required: boolean;
  message: string;
  /** Some APIs say how long to wait before asking again. */
  retry_after?: number;
  expires_in?: number;
}

/**
 * Send the code that proves an order's mobile number.
 * Endpoint: POST /api/v1/orders/phone-code
 */
export async function requestOrderPhoneCodeAction(phone: string): Promise<ActionResponse<OrderPhoneCodeResponse>> {
  try {
    const clean = phone.replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, "");
    if (!/^01[3-9]\d{8}$/.test(clean)) {
      return {
        success: false,
        error: { message: "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).", code: "INVALID_PHONE" },
      };
    }
    // Never resend automatically: each attempt texts the customer.
    const res = await serverPost<{ data?: OrderPhoneCodeResponse } & OrderPhoneCodeResponse>("ORDER_PHONE_CODE", { phone: clean }, { retries: 0 });
    if (res.success && res.data) {
      const data = (res.data.data ?? res.data) as OrderPhoneCodeResponse;
      return { success: true, data: { ...data, required: Boolean(data.required) } };
    }
    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Could not send the code" : "Could not send the code",
        code: !res.success ? res.error?.code || "PHONE_CODE_FAILED" : "PHONE_CODE_FAILED",
        status: !res.success ? res.error?.status : undefined,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export interface SaveIncompleteOrderPayload {
  source: "cart" | "buy_now";
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  items: Array<{ variant_id: number; quantity: number }>;
}

/**
 * Save or update an incomplete order (abandoned cart / buy-now draft).
 * Endpoint: POST /api/v1/incomplete-orders
 */
export async function saveIncompleteOrderAction(
  payload: SaveIncompleteOrderPayload
): Promise<ActionResponse<{ id: number; status: string }>> {
  try {
    const validItems = (payload.items || []).filter(
      (i) => Number(i.variant_id) > 0 && Number(i.quantity) > 0
    );
    if (validItems.length === 0) {
      return {
        success: false,
        error: { message: "No valid items to record.", code: "EMPTY_ITEMS" },
      };
    }

    const body: Record<string, unknown> = {
      source: payload.source,
      items: validItems.map((i) => ({
        variant_id: Number(i.variant_id),
        quantity: Number(i.quantity),
      })),
    };
    if (payload.name?.trim()) body.name = payload.name.trim();
    if (payload.phone?.trim()) body.phone = payload.phone.trim();
    if (payload.email?.trim()) body.email = payload.email.trim();
    if (payload.address?.trim()) body.address = payload.address.trim();
    if (payload.note?.trim()) body.note = payload.note.trim();

    const res = await serverPost<any>("SAVE_INCOMPLETE_ORDER", body, { retries: 0 });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to save incomplete order" : "Failed to save incomplete order",
        code: "INCOMPLETE_ORDER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
