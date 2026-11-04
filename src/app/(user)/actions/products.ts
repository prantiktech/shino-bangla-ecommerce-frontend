"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { ImageLike } from "@/lib/utils/image";
import { ApiCategory } from "./categories";
import { ApiBrand } from "./brands";

export interface ApiProductPrice {
  min: number; // in integer poisha
  max: number; // in integer poisha
  compare_at?: number | null;
  discount_percent?: number | null;
}

export interface ApiProductVariant {
  id: number;
  sku: string;
  is_default: boolean;
  value: string;
  label: string;
  image?: ImageLike;
  price: number; // integer poisha
  compare_at?: number | null;
  discount_percent?: number | null;
  in_stock: boolean;
  low_stock?: boolean;
  min_qty?: number;
  max_qty?: number | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  image?: ImageLike;
  main_image?: ImageLike;
  gallery?: ImageLike[];
  brand?: { id: number; name: string; slug: string; logo?: ImageLike } | null;
  category?: { id: number; name: string; slug: string } | null;
  breadcrumbs?: Array<{ id: number; name: string; slug: string }>;
  price: ApiProductPrice;
  has_options?: boolean;
  in_stock: boolean;
  rating?: { average: number; count: number };
  is_featured?: boolean;
  is_trending?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  short_description?: string;
  description?: string;
  specifications?: Array<{ key: string; value: string }>;
  tags?: string[];
  variants?: ApiProductVariant[];
  option?: { id: number; name: string };
  vat_rate_bp?: number;
  seo?: { title?: string; description?: string; keywords?: string | null };
}

export interface ProductsPaginationData {
  items: ApiProduct[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
}

export interface HomeBanner {
  id: number;
  title?: string | null;
  subtitle?: string | null;
  button_label?: string | null;
  link_url?: string | null;
  image?: ImageLike;
  mobile_image?: ImageLike;
}

export interface HomeReview {
  id: number;
  rating: number;
  title?: string | null;
  body: string;
  customer_name: string;
  product?: { name: string; slug: string } | null;
  created_at: string;
}

export interface HomeSection {
  id: number;
  type:
    | "slider"
    | "offer_banners"
    | "categories"
    | "brands"
    | "flash_sale"
    | "featured"
    | "trending"
    | "new_arrivals"
    | "popular"
    | "best_sellers"
    | "custom"
    | "category"
    | "featured_reviews"
    | "newsletter"
    | string;
  title: string;
  subtitle?: string | null;
  layout?: "carousel" | "grid" | string;
  view_all_url?: string | null;
  ends_at?: string | null;
  banners?: HomeBanner[];
  categories?: ApiCategory[];
  brands?: ApiBrand[];
  products?: ApiProduct[];
  reviews?: HomeReview[];
}

export interface HomeData {
  sections: HomeSection[];
  generated_at?: string;
}

/**
 * Server Action to fetch products matching GET /api/v1/products
 */
export async function getProductsAction(
  params?: Record<string, any>
): Promise<ActionResponse<ProductsPaginationData>> {
  try {
    const res = await serverGet<any>("GET_PRODUCTS", {
      params,
      next: { revalidate: 30 },
    });

    if (res.success && res.data) {
      const rawData = res.data;
      const items: ApiProduct[] = Array.isArray(rawData.data) ? rawData.data : [];
      const meta = rawData.meta || {};

      return {
        success: true,
        data: {
          items,
          total: meta.total !== undefined ? meta.total : items.length,
          currentPage: meta.current_page || 1,
          lastPage: meta.last_page || 1,
          perPage: meta.per_page || 12,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load products") : "Failed to load products",
        code: "FETCH_PRODUCTS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action to fetch single product by slug matching GET /api/v1/products/:slug
 */
export async function getProductBySlugAction(
  slug: string
): Promise<ActionResponse<ApiProduct>> {
  try {
    const res = await serverGet<any>("GET_PRODUCT", {
      pathParams: { slug },
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      const item = res.data.data || res.data;
      return { success: true, data: item };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Product not found") : "Product not found",
        code: "FETCH_PRODUCT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action to fetch home page sections matching GET /api/v1/home
 */
export async function getHomeSectionsAction(): Promise<ActionResponse<HomeData>> {
  try {
    const res = await serverGet<any>("GET_HOME", {
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      const homeData = res.data.data || res.data;
      return {
        success: true,
        data: {
          sections: homeData.sections || [],
          generated_at: homeData.generated_at,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load home sections") : "Failed to load home sections",
        code: "FETCH_HOME_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action to fetch product facets for the filter sidebar matching GET /api/v1/products/facets
 */
export async function getProductFacetsAction(
  params?: Record<string, any>
): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_PRODUCT_FACETS", {
      params,
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to fetch facets") : "Failed to fetch facets",
        code: "FETCH_FACETS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action to search suggestions matching GET /api/v1/products/suggest?q=...
 */
export async function getProductSuggestAction(
  query: string
): Promise<ActionResponse<{ products: ApiProduct[]; categories: any[]; brands: any[] }>> {
  try {
    const res = await serverGet<any>("GET_PRODUCT_SUGGEST", {
      params: { q: query },
    });

    if (res.success && res.data) {
      const d = res.data.data || res.data;
      return {
        success: true,
        data: {
          products: d.products || [],
          categories: d.categories || [],
          brands: d.brands || [],
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "No suggestions") : "No suggestions",
        code: "SUGGEST_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action to fetch related products matching GET /api/v1/products/:slug/related
 */
export async function getRelatedProductsAction(
  slug: string,
  type: "related" | "cross_sell" | "upsell" = "related"
): Promise<ActionResponse<ApiProduct[]>> {
  try {
    const res = await serverGet<any>("GET_PRODUCT_RELATED", {
      pathParams: { slug },
      params: { type },
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      const items = res.data.data || res.data;
      return { success: true, data: Array.isArray(items) ? items : [] };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load related products") : "Failed to load related products",
        code: "FETCH_RELATED_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export interface ReviewItem {
  id: number;
  rating: number;
  title?: string;
  body: string;
  customer_name: string;
  is_verified_purchase?: boolean;
  photos?: ImageLike[];
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
}

export interface ReviewsResponseData {
  reviews: ReviewItem[];
  summary?: {
    average: number;
    count: number;
    stars?: Record<string, number>;
  };
}

