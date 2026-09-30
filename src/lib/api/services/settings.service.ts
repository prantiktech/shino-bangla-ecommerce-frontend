import { apiClient } from "../client";
import { API_ENDPOINTS } from "../config";
import { ApiResponse, StoreSettings } from "../types";

export const settingsService = {
  /**
   * Fetch public store settings (store name, contact, payment methods)
   */
  async getSettings(): Promise<StoreSettings> {
    const res = await apiClient.get<ApiResponse<StoreSettings>>(API_ENDPOINTS.SETTINGS, {
      skipAuth: true
    });
    return res.data;
  }
};
