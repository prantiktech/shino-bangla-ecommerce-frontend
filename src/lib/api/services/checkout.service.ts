import { apiClient } from "../client";
import { API_ENDPOINTS } from "../config";
import { ApiResponse, CheckoutPayload, Order, ShippingLocation, ShippingMethod } from "../types";

export const checkoutService = {
  /**
   * Fetch available shipping locations/districts
   */
  async getLocations(): Promise<ShippingLocation[]> {
    const res = await apiClient.get<ApiResponse<ShippingLocation[]>>(API_ENDPOINTS.CHECKOUT_LOCATIONS);
    return res.data || [];
  },

  /**
   * Fetch shipping delivery methods & rates
   */
  async getShippingMethods(locationId?: number): Promise<ShippingMethod[]> {
    const res = await apiClient.get<ApiResponse<ShippingMethod[]>>(
      API_ENDPOINTS.CHECKOUT_SHIPPING_METHODS,
      {
        params: locationId ? { location_id: locationId } : undefined
      }
    );
    return res.data || [];
  },

  /**
   * Place an order with safe idempotency key to prevent double charging
   */
  async placeOrder(payload: CheckoutPayload, idempotencyKey?: string): Promise<Order> {
    const key = idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `order_${Date.now()}`);

    const res = await apiClient.post<ApiResponse<Order>>(API_ENDPOINTS.CHECKOUT, payload, {
      headers: {
        "Idempotency-Key": key
      }
    });

    return res.data;
  }
};
