"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface ApiBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  product_count?: number;
  description?: string | null;
}

export async function getBrandsAction(): Promise<ActionResponse<ApiBrand[]>> {
  try {
    const res = await serverGet<any>("GET_BRANDS", {
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      const items = res.data.data || res.data;
      return { success: true, data: Array.isArray(items) ? items : [] };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load brands") : "Failed to load brands",
        code: "FETCH_BRANDS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getBrandBySlugAction(slug: string): Promise<ActionResponse<ApiBrand>> {
  try {
    const res = await serverGet<any>("GET_BRAND", {
      pathParams: { slug },
      next: { revalidate: 60 },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Brand not found") : "Brand not found",
        code: "FETCH_BRAND_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
