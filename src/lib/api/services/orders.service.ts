import { apiClient } from "../client";
import { API_ENDPOINTS } from "../config";
import { ApiResponse, Order, PaginatedResponse } from "../types";

export const ordersService = {
  /**
   * Fetch customer order history
   */
  async getMyOrders(page = 1): Promise<PaginatedResponse<Order>> {
    return apiClient.get<PaginatedResponse<Order>>(API_ENDPOINTS.MY_ORDERS, {
      params: { page }
    });
  },

  /**
   * Fetch single order details
   */
  async getOrderDetails(orderNumber: string): Promise<Order> {
    const res = await apiClient.get<ApiResponse<Order>>(API_ENDPOINTS.ORDER_BY_NUMBER(orderNumber));
    return res.data;
  },

  /**
   * Public order tracking by order number and phone
   */
  async trackOrder(orderNumber: string, phone: string): Promise<Order> {
    const res = await apiClient.post<ApiResponse<Order>>(API_ENDPOINTS.TRACK_ORDER, {
      order_number: orderNumber,
      phone
    });
    return res.data;
  }
};
