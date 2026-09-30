import { apiClient } from "../client";
import { API_ENDPOINTS } from "../config";
import { ApiCategory, ApiResponse } from "../types";

export const categoriesService = {
  /**
   * Fetch complete category tree with product counts
   */
  async getCategories(): Promise<ApiCategory[]> {
    const res = await apiClient.get<ApiResponse<ApiCategory[]>>(API_ENDPOINTS.CATEGORIES);
    return res.data || [];
  },

  /**
   * Fetch single category details and breadcrumbs
   */
  async getCategoryBySlug(slug: string): Promise<ApiCategory> {
    const res = await apiClient.get<ApiResponse<ApiCategory>>(API_ENDPOINTS.CATEGORY_BY_SLUG(slug));
    return res.data;
  }
};
