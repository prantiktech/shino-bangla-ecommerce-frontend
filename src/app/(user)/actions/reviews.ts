"use server";

import { cookies } from "next/headers";
import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { API_BASE_URL } from "@/lib/api/config";

export interface ReviewableItem {
  order_number: string;
  order_id: number;
  delivered_at: string;
  product_id: number;
  name: string;
  slug: string;
  image?: string | null;
}

export interface CustomerReview {
  id: number;
  rating: number;
  comment?: string | null;
  photos?: string[];
  is_edited: boolean;
  created_at: string;
  status: "pending" | "approved" | "rejected" | string;
  rejection_reason?: string | null;
  product: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface SubmitReviewPayload {
  product_id: number;
  order_id: number;
  rating: number;
  comment?: string;
  photo_ids?: number[];
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

/**
 * Fetch delivered items awaiting customer review
 * Requires: Bearer token
 */
export async function getReviewableItemsAction(): Promise<ActionResponse<ReviewableItem[]>> {
  try {
    const res = await serverGet<any>("GET_REVIEWABLE_ITEMS");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load reviewable items") : "Failed to load reviewable items",
        code: "GET_REVIEWABLE_ITEMS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch list of reviews submitted by this customer
 * Requires: Bearer token
 */
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
        message: !res.success ? (res.error?.message || "Failed to load customer reviews") : "Failed to load customer reviews",
        code: "GET_REVIEWS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Submit a new product review (held for admin moderation)
 * Requires: Bearer token
 */
export async function submitReviewAction(payload: SubmitReviewPayload): Promise<ActionResponse<CustomerReview>> {
  try {
    const body: any = {
      product_id: Number(payload.product_id),
      order_id: Number(payload.order_id),
      rating: Number(payload.rating),
    };
    if (payload.comment) body.comment = payload.comment.trim();
    if (payload.photo_ids && payload.photo_ids.length > 0) body.photo_ids = payload.photo_ids;

    const res = await serverPost<any>("SUBMIT_REVIEW", body);
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

/**
 * Update a review while it is still pending admin approval
 * Requires: Bearer token
 */
export async function updateReviewAction(
  id: number | string,
  payload: UpdateReviewPayload
): Promise<ActionResponse<CustomerReview>> {
  try {
    const body: any = {};
    if (payload.rating !== undefined) body.rating = Number(payload.rating);
    if (payload.comment !== undefined) body.comment = payload.comment.trim();

    const res = await serverPut<any>("UPDATE_MY_REVIEW", body, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update review") : "Failed to update review",
        code: "UPDATE_REVIEW_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Delete / take back a customer review
 * Requires: Bearer token
 */
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

export interface PublicReview {
  id: number;
  rating: number;
  comment?: string | null;
  customer_name?: string;
  verified_purchase?: boolean;
  created_at: string;
  photos?: string[];
}

/**
 * Fetch public approved customer reviews for a single product
 * Endpoint: GET /api/v1/products/{slug}/reviews
 */
export async function getProductReviewsAction(
  slug: string,
  page: number = 1
): Promise<ActionResponse<{ reviews: PublicReview[]; total: number }>> {
  try {
    const res = await serverGet<any>("GET_PRODUCT_REVIEWS", {
      pathParams: { slug },
      params: { page, per_page: 10 },
    });

    if (res.success && res.data) {
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      const total = res.data.meta?.total || list.length;
      return {
        success: true,
        data: {
          reviews: list,
          total,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load product reviews") : "Failed to load reviews",
        code: "GET_PRODUCT_REVIEWS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export interface ReviewPhotoUploadResult {
  id: number;
  url: string;
  sizes: {
    thumb: string;
    card: string;
    full: string;
  };
  width?: number;
  height?: number;
  alt?: string | null;
}

/**
 * Upload a photo to attach to a review.
 * Endpoint: POST /api/v1/me/reviews/photos
 * Requires: Bearer token, multipart/form-data
 */
export async function uploadReviewPhotoAction(
  formData: FormData
): Promise<ActionResponse<ReviewPhotoUploadResult>> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("customer_token")?.value ||
      cookieStore.get("token")?.value;

    if (!token) {
      return {
        success: false,
        error: {
          message: "You must be signed in to upload review photos.",
          code: "UNAUTHENTICATED",
        },
      };
    }

    const file = formData.get("file") || formData.get("photo");
    if (!file) {
      return {
        success: false,
        error: {
          message: "Please choose an image file to upload.",
          code: "MISSING_FILE",
        },
      };
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/me/reviews/photos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: outgoingFormData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: {
          message: data.message || "Failed to upload photo",
          code: data.code || "UPLOAD_FAILED",
        },
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return handleActionError(error);
  }
}


