"use server";

import { serverGet, serverPost, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  brand?: { id: number; name: string } | null;
  price?: {
    min: number;
    max: number;
    compare_at?: number | null;
    discount_percent?: number | null;
  };
  has_options?: boolean;
  in_stock?: boolean;
  rating?: {
    average: number;
    count: number;
  };
  is_featured?: boolean;
  is_trending?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
}

export async function getWishlistAction(): Promise<ActionResponse<WishlistProduct[]>> {
  try {
    const res = await serverGet<any>("GET_WISHLIST");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load wishlist") : "Failed to load wishlist",
        code: "GET_WISHLIST_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function addToWishlistAction(productId: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverPost<any>("ADD_WISHLIST", { product_id: Number(productId) });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to add to wishlist") : "Failed to add to wishlist",
        code: "ADD_WISHLIST_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function removeFromWishlistAction(productId: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("REMOVE_WISHLIST", {
      pathParams: { id: productId },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to remove from wishlist") : "Failed to remove from wishlist",
        code: "REMOVE_WISHLIST_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRecentlyViewedAction(): Promise<ActionResponse<WishlistProduct[]>> {
  try {
    const res = await serverGet<any>("GET_RECENTLY_VIEWED");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load recently viewed") : "Failed to load recently viewed",
        code: "GET_RECENTLY_VIEWED_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
