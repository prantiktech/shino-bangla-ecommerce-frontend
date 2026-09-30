"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  product_count?: number;
  children?: ApiCategory[];
}

export interface CategoryDetail extends ApiCategory {
  breadcrumbs?: Array<{ id: number; name: string; slug: string }>;
  vat_rate_bp?: number;
  seo?: {
    title?: string;
    description?: string;
  };
}

export async function getCategoriesAction(): Promise<ActionResponse<ApiCategory[]>> {
  try {
    const res = await serverGet<any>("GET_CATEGORIES", {
      next: { revalidate: 60, tags: ["categories"] },
    });

    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to fetch categories") : "Failed to fetch categories",
        code: "FETCH_CATEGORIES_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCategoryBySlugAction(slug: string): Promise<ActionResponse<CategoryDetail>> {
  try {
    const res = await serverGet<any>("GET_CATEGORY", {
      pathParams: { slug },
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      const detail = res.data.data || res.data;
      return { success: true, data: detail };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to fetch category") : "Category not found",
        code: "FETCH_CATEGORY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
