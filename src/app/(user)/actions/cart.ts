"use server";

import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api/config";

const CART_COOKIE_NAME = "cart_token";
const CUSTOMER_COOKIE_NAME = "customer_token";

function getAuthHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getGuestHeaders(cartToken?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(cartToken ? { "X-Cart-Token": cartToken } : {}),
  };
}

/**
 * Add an item to the API cart.
 * - Authenticated: uses Bearer token
 * - Guest: uses X-Cart-Token; saves returned token in cookie
 */
export async function apiAddCartItemAction(
  variantId: number,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const authToken =
    cookieStore.get(CUSTOMER_COOKIE_NAME)?.value ||
    cookieStore.get("token")?.value;

  try {
    const body = JSON.stringify({ variant_id: variantId, quantity });

    if (authToken) {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART_ITEMS}`, {
        method: "POST",
        headers: getAuthHeaders(authToken),
        body,
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.message || "Failed to add item to cart" };
      }
      return { success: true };
    } else {
      // Guest flow
      const cartToken = cookieStore.get(CART_COOKIE_NAME)?.value;
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART_ITEMS}`, {
        method: "POST",
        headers: getGuestHeaders(cartToken),
        body,
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.message || "Failed to add item to cart" };
      }
      // Save guest cart token returned on first call
      const newToken = data?.data?.token || data?.token;
      if (newToken && !cartToken) {
        cookieStore.set(CART_COOKIE_NAME, newToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      return { success: true };
    }
  } catch {
    return { success: false, error: "Network error while adding to cart" };
  }
}

/**
 * Update the quantity of an item in the API cart by its cart-item ID.
 */
export async function apiUpdateCartItemAction(
  cartItemId: number,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const authToken =
    cookieStore.get(CUSTOMER_COOKIE_NAME)?.value ||
    cookieStore.get("token")?.value;

  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId)}`;
    const headers = authToken
      ? getAuthHeaders(authToken)
      : getGuestHeaders(cookieStore.get(CART_COOKIE_NAME)?.value);

    const res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ quantity }),
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to update cart item" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error while updating cart" };
  }
}

/**
 * Remove an item from the API cart by its cart-item ID.
 */
export async function apiRemoveCartItemAction(
  cartItemId: number
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const authToken =
    cookieStore.get(CUSTOMER_COOKIE_NAME)?.value ||
    cookieStore.get("token")?.value;

  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId)}`;
    const headers = authToken
      ? getAuthHeaders(authToken)
      : getGuestHeaders(cookieStore.get(CART_COOKIE_NAME)?.value);

    const res = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to remove cart item" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error while removing cart item" };
  }
}
