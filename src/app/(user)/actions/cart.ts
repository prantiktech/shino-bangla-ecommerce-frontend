"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { cookies } from "next/headers";

export interface ApiCartItem {
  id: number;
  product_id: number;
  variant_id: number;
  name: string;
  sku: string;
  image?: string | null;
  price: number; // in poisha
  quantity: number;
  subtotal: number; // in poisha
  in_stock: boolean;
}

export interface ApiCart {
  items: ApiCartItem[];
  subtotal: number; // in poisha
  shipping_cost: number;
  discount: number;
  total: number; // in poisha
  coupon?: { code: string; discount_amount: number } | null;
  token?: string; // guest cart token
}

export async function getCartAction(locationId?: number): Promise<ActionResponse<ApiCart>> {
  try {
    const res = await serverGet<any>("GET_CART", {
      params: locationId ? { location_id: locationId } : undefined,
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      return { success: true, data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load cart") : "Failed to load cart",
        code: "GET_CART_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function addToCartAction(
  variantId: number,
  quantity: number = 1
): Promise<ActionResponse<ApiCart>> {
  try {
    const res = await serverPost<any>("ADD_CART_ITEM", {
      variant_id: variantId,
      quantity,
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      // If guest token returned in response, save into server cookie
      if (data.token) {
        try {
          const cookieStore = await cookies();
          cookieStore.set("cart_token", data.token, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            sameSite: "lax",
          });
        } catch {
          // ignore
        }
      }
      return { success: true, data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to add item to cart") : "Failed to add item",
        code: "ADD_CART_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCartItemAction(
  itemId: number,
  quantity: number
): Promise<ActionResponse<ApiCart>> {
  try {
    const res = await serverPut<any>("UPDATE_CART_ITEM", { quantity }, {
      pathParams: { id: itemId },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update item") : "Failed to update item",
        code: "UPDATE_CART_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function removeCartItemAction(itemId: number): Promise<ActionResponse<ApiCart>> {
  try {
    const res = await serverDelete<any>("REMOVE_CART_ITEM", {
      pathParams: { id: itemId },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to remove item") : "Failed to remove item",
        code: "REMOVE_CART_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function clearCartAction(): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("CLEAR_CART");
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to clear cart") : "Failed to clear cart",
        code: "CLEAR_CART_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
