import { apiClient } from "../client";
import { API_ENDPOINTS } from "../config";
import { ApiProduct, ApiResponse, PaginatedResponse, ProductFilterParams } from "../types";

export const productsService = {
  /**
   * Fetch paginated products catalog with combinable filters & sorts
   */
  async getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<ApiProduct>> {
    return apiClient.get<PaginatedResponse<ApiProduct>>(API_ENDPOINTS.PRODUCTS, {
      params: params as Record<string, any>
    });
  },

  /**
   * Fetch single product by slug
   */
  async getProductBySlug(slug: string): Promise<ApiProduct> {
    const res = await apiClient.get<ApiResponse<ApiProduct>>(API_ENDPOINTS.PRODUCT_BY_SLUG(slug));
    return res.data;
  },

  /**
   * Fetch related products for product page
   */
  async getRelatedProducts(slug: string): Promise<ApiProduct[]> {
    const res = await apiClient.get<ApiResponse<ApiProduct[]>>(API_ENDPOINTS.PRODUCT_RELATED(slug));
    return res.data || [];
  },

  /**
   * Fetch featured / best selling products
   */
  async getFeaturedProducts(flag: ProductFilterParams["flag"] = "featured", limit = 8): Promise<ApiProduct[]> {
    const res = await this.getProducts({ flag, per_page: limit });
    return res.data || [];
  }
};
