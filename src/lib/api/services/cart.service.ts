import { apiClient } from "../client";
import { API_ENDPOINTS, STORAGE_KEYS } from "../config";
import { ApiCart, ApiResponse } from "../types";

export interface AddToCartPayload {
  product_id: number;
  quantity: number;
  variant_id?: number | null;
  options?: Record<string, string>;
}

export const cartService = {
  /**
   * Save guest cart token to localStorage
   */
  saveCartToken(token: string): void {
    if (typeof window !== "undefined" && token) {
      localStorage.setItem(STORAGE_KEYS.CART_TOKEN, token);
    }
  },

  /**
   * Clear guest cart token from localStorage
   */
  clearCartToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CART_TOKEN);
    }
  },

  /**
   * Fetch current cart (guest or logged-in)
   */
  async getCart(locationId?: number): Promise<ApiCart> {
    const res = await apiClient.get<ApiResponse<ApiCart>>(API_ENDPOINTS.CART, {
      params: locationId ? { location_id: locationId } : undefined
    });
    if (res.data?.token) {
      this.saveCartToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Add item to cart
   */
  async addItem(payload: AddToCartPayload): Promise<ApiCart> {
    const res = await apiClient.post<ApiResponse<ApiCart>>(API_ENDPOINTS.CART_ITEMS, payload);
    if (res.data?.token) {
      this.saveCartToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Update item quantity in cart
   */
  async updateItem(itemId: number, quantity: number): Promise<ApiCart> {
    const res = await apiClient.put<ApiResponse<ApiCart>>(API_ENDPOINTS.CART_ITEM_BY_ID(itemId), {
      quantity
    });
    return res.data;
  },

  /**
   * Remove item from cart
   */
  async removeItem(itemId: number): Promise<ApiCart> {
    const res = await apiClient.delete<ApiResponse<ApiCart>>(API_ENDPOINTS.CART_ITEM_BY_ID(itemId));
    return res.data;
  },

  /**
   * Apply promotional coupon
   */
  async applyCoupon(code: string): Promise<ApiCart> {
    const res = await apiClient.post<ApiResponse<ApiCart>>(API_ENDPOINTS.CART_COUPON, { code });
    return res.data;
  },

  /**
   * Remove coupon
   */
  async removeCoupon(): Promise<ApiCart> {
    const res = await apiClient.delete<ApiResponse<ApiCart>>(API_ENDPOINTS.CART_COUPON);
    return res.data;
  },

  /**
   * Claim guest cart on login: merges guest items into customer account
   */
  async claimCart(): Promise<ApiCart | null> {
    if (typeof window === "undefined") return null;
    const guestCartToken = localStorage.getItem(STORAGE_KEYS.CART_TOKEN);
    if (!guestCartToken) return null;

    try {
      const res = await apiClient.post<ApiResponse<ApiCart>>(API_ENDPOINTS.CART_CLAIM, {
        token: guestCartToken
      });
      // Once claimed, remove guest cart token
      this.clearCartToken();
      return res.data;
    } catch {
      return null;
    }
  }
};
