"use server";

import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api/config";

const CART_COOKIE_NAME = "cart_token";
const CUSTOMER_COOKIE_NAME = "customer_token";

async function getCartRequestHeaders(): Promise<{
  headers: Record<string, string>;
  isGuest: boolean;
  cartToken?: string;
  authToken?: string;
}> {
  const cookieStore = await cookies();
  const authToken =
    cookieStore.get(CUSTOMER_COOKIE_NAME)?.value ||
    cookieStore.get("token")?.value;
  const cartToken = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (authToken) {
    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      isGuest: false,
      authToken,
      cartToken,
    };
  }

  return {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(cartToken ? { "X-Cart-Token": cartToken } : {}),
    },
    isGuest: true,
    cartToken,
  };
}

function buildUrl(path: string, locationId?: number): string {
  const baseUrl = `${API_BASE_URL}${path}`;
  if (locationId) {
    return `${baseUrl}?location_id=${locationId}`;
  }
  return baseUrl;
}

/**
 * Fetch the user's or guest's current cart.
 * GET /api/v1/cart
 */
export async function getCartAction(
  locationId?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { headers, isGuest } = await getCartRequestHeaders();
    const url = buildUrl(API_ENDPOINTS.CART, locationId);

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to fetch cart" };
    }

    // Save token if guest received a token
    const token = data?.data?.token || data?.token;
    if (isGuest && token) {
      const cookieStore = await cookies();
      cookieStore.set(CART_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return { success: true, data: data?.data || data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while fetching cart" };
  }
}

/**
 * Add an item to the API cart.
 * POST /api/v1/cart/items
 * - Authenticated: uses Bearer token
 * - Guest: uses X-Cart-Token; saves returned token in cookie
 */
export async function apiAddCartItemAction(
  variantId: number,
  quantity: number = 1,
  locationId?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { headers, isGuest, cartToken } = await getCartRequestHeaders();
    const url = buildUrl(API_ENDPOINTS.CART_ITEMS, locationId);
    const body = JSON.stringify({ variant_id: variantId, quantity });

    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to add item to cart" };
    }

    // Save guest cart token returned on first call
    const newToken = data?.data?.token || data?.token;
    if (isGuest && newToken && !cartToken) {
      const cookieStore = await cookies();
      cookieStore.set(CART_COOKIE_NAME, newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return { success: true, data: data?.data || data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while adding to cart" };
  }
}

/**
 * Update the quantity of an item in the API cart by its cart-item ID.
 * PATCH /api/v1/cart/items/{item}
 */
export async function apiUpdateCartItemAction(
  cartItemId: number,
  quantity: number,
  locationId?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { headers } = await getCartRequestHeaders();
    const url = buildUrl(API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId), locationId);

    const res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ quantity }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to update cart item" };
    }

    return { success: true, data: data?.data || data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while updating cart" };
  }
}

/**
 * Remove an item from the API cart by its cart-item ID.
 * DELETE /api/v1/cart/items/{item}
 */
export async function apiRemoveCartItemAction(
  cartItemId: number,
  locationId?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { headers } = await getCartRequestHeaders();
    const url = buildUrl(API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId), locationId);

    const res = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    if (res.status === 204) {
      return { success: true };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to remove cart item" };
    }

    return { success: true, data: data?.data || data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while removing cart item" };
  }
}

/**
 * Apply a coupon code to the cart.
 * PUT /api/v1/cart/coupon
 * Body: { code: string }
 */
export async function applyCouponAction(
  code: string,
  locationId?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { headers } = await getCartRequestHeaders();
    const url = buildUrl(API_ENDPOINTS.CART_COUPON, locationId);

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ code: code.trim() }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || "Invalid coupon code" };
    }

    return { success: true, data: data?.data || data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while applying coupon" };
  }
}

/**
 * Remove an applied coupon from the cart.
 * DELETE /api/v1/cart/coupon
 */
export async function removeCouponAction(
  locationId?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { headers } = await getCartRequestHeaders();
    const url = buildUrl(API_ENDPOINTS.CART_COUPON, locationId);

    const res = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to remove coupon" };
    }

    return { success: true, data: data?.data || data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while removing coupon" };
  }
}

