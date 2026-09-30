"use server";

import { serverGet, serverPost, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface CustomerReview {
  id: number;
  product_id: number;
  product_name?: string;
  rating: number;
  review?: string;
  created_at: string;
}

export async function getMyReviewsAction(): Promise<ActionResponse<CustomerReview[]>> {
  try {
    const res = await serverGet<any>("GET_MY_REVIEWS");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load reviews") : "Failed to load reviews",
        code: "GET_REVIEWS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function submitProductReviewAction(
  slug: string,
  payload: { rating: number; review?: string; order_item_id?: number }
): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>("SUBMIT_PRODUCT_REVIEW", payload, {
      pathParams: { slug },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to submit review") : "Failed to submit review",
        code: "SUBMIT_REVIEW_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteMyReviewAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_MY_REVIEW", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete review") : "Failed to delete review",
        code: "DELETE_REVIEW_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
