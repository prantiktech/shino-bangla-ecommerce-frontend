import { apiClient } from "../client";
import { API_ENDPOINTS, STORAGE_KEYS } from "../config";
import { ApiCart, ApiResponse } from "../types";

export interface AddToCartPayload {
  product_id?: number;
  quantity: number;
  variant_id?: number | null;
  options?: Record<string, string>;
}

export const cartService = {
  /**
   * Save guest cart token to localStorage and cookie
   */
  saveCartToken(token: string): void {
    if (typeof window !== "undefined" && token) {
      localStorage.setItem(STORAGE_KEYS.CART_TOKEN, token);
      localStorage.setItem("cart_token", token);
      document.cookie = `cart_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
    }
  },

  /**
   * Clear guest cart token from localStorage and cookie
   */
  clearCartToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CART_TOKEN);
      localStorage.removeItem("cart_token");
      document.cookie = "cart_token=; path=/; max-age=0; SameSite=Lax";
    }
  },

  /**
   * Fetch current cart (guest or logged-in)
   */
  async getCart(locationId?: number): Promise<ApiCart> {
    const res = await apiClient.get<ApiResponse<ApiCart>>(API_ENDPOINTS.CART, {
      params: locationId ? { location_id: locationId } : undefined
    });
    if (res?.data?.token) {
      this.saveCartToken(res.data.token);
    }
    return res?.data || res;
  },

  /**
   * Add item to cart matching POST /cart/items
   */
  async addItem(payload: AddToCartPayload): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINTS.CART_ITEMS, {
      variant_id: payload.variant_id || payload.product_id,
      quantity: payload.quantity || 1
    });

    const token = res?.data?.token || (res as any)?.token;
    if (token) {
      this.saveCartToken(token);
    }
    return res?.data || res;
  },

  /**
   * Update item quantity matching PATCH /cart/items/{item}
   */
  async updateItem(itemId: number, quantity: number): Promise<any> {
    const res = await apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.CART_ITEM_BY_ID(itemId), {
      quantity
    });
    return res?.data || res;
  },

  /**
   * Remove item from cart matching DELETE /cart/items/{item}
   */
  async removeItem(itemId: number): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.CART_ITEM_BY_ID(itemId));
    return res?.data || res;
  },

  /**
   * Move item to saved for later matching POST /cart/items/{item}/save-for-later
   */
  async saveForLater(itemId: number): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINTS.CART_ITEM_SAVE_FOR_LATER(itemId));
    return res?.data || res;
  },

  /**
   * Move item back to cart matching POST /cart/items/{item}/move-to-cart
   */
  async moveToCart(itemId: number): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINTS.CART_ITEM_MOVE_TO_CART(itemId));
    return res?.data || res;
  },

  /**
   * Apply promotional coupon matching PUT /cart/coupon
   */
  async applyCoupon(code: string, locationId?: number): Promise<any> {
    const res = await apiClient.put<ApiResponse<any>>(
      API_ENDPOINTS.CART_COUPON,
      { code },
      { params: locationId ? { location_id: locationId } : undefined }
    );
    return res?.data || res;
  },

  /**
   * Remove coupon matching DELETE /cart/coupon
   */
  async removeCoupon(locationId?: number): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(
      API_ENDPOINTS.CART_COUPON,
      { params: locationId ? { location_id: locationId } : undefined }
    );
    return res?.data || res;
  },

  /**
   * Claim guest cart on login matching POST /cart/claim
   * Sends Authorization: Bearer <token> AND X-Cart-Token: <guest_token>
   */
  async claimCart(): Promise<any> {
    if (typeof window === "undefined") return null;
    const guestCartToken =
      localStorage.getItem(STORAGE_KEYS.CART_TOKEN) ||
      document.cookie.split("; ").find((r) => r.startsWith("cart_token="))?.split("=")[1];

    if (!guestCartToken) return null;

    try {
      const res = await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.CART_CLAIM,
        undefined,
        {
          headers: {
            "X-Cart-Token": decodeURIComponent(guestCartToken)
          }
        }
      );
      this.clearCartToken();
      return res?.data || res;
    } catch {
      return null;
    }
  }
};
