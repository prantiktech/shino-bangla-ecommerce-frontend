"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export interface AdminReview {
  id: number;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected" | string;
  is_hidden: boolean;
  is_featured: boolean;
  is_visible: boolean;
  rejection_reason: string | null;
  edited_by_shop: boolean;
  /** `store` when entered by staff under a given name, otherwise the customer's own review. */
  source?: "customer" | "store" | string;
  author_name?: string | null;
  reviewer_name?: string | null;
  created_by?: string | null;
  author: { id: number; name: string } | null;
  product: { id: number; name: string; slug: string } | null;
  order_id: number | null;
  photos: { id: number; url: string; sizes?: Partial<Record<string, string>> | null }[];
  moderated_by: string | null;
  approved_at: string | null;
  created_at: string;
}

/** GET /admin/reviews — status (default pending), source (customer|store), rating, product_id, is_hidden, is_featured, q */
export async function getAdminReviewsAction(params?: QueryParams) {
  return adminList<AdminReview>("GET_ADMIN_REVIEWS", "Failed to load reviews", params);
}

/** POST /admin/reviews — a review entered under a given name; published at once (`reviews.create`). */
export async function createAdminReviewAction(payload: {
  product_id: number;
  reviewer_name: string;
  rating: number;
  comment?: string | null;
  photo_ids?: number[];
}) {
  return adminRequest<AdminReview>("POST", "CREATE_ADMIN_REVIEW", "Failed to add the review", {
    body: {
      product_id: payload.product_id,
      reviewer_name: payload.reviewer_name.trim(),
      rating: payload.rating,
      comment: payload.comment?.trim() || null,
      ...(payload.photo_ids?.length ? { photo_ids: payload.photo_ids } : {}),
    },
  });
}

export async function getAdminReviewAction(id: number) {
  return adminRequest<AdminReview>("GET", "GET_ADMIN_REVIEW", "Failed to load review", { pathParams: { id } });
}

export async function approveAdminReviewAction(id: number) {
  return adminRequest<AdminReview>("POST", "APPROVE_ADMIN_REVIEW", "Failed to approve review", { pathParams: { id } });
}

export async function rejectAdminReviewAction(id: number, reason?: string | null) {
  return adminRequest<AdminReview>("POST", "REJECT_ADMIN_REVIEW", "Failed to reject review", {
    pathParams: { id },
    body: { reason: reason?.trim() || null },
  });
}

/** POST hides, DELETE un-hides (reversible take-down of a published review) */
export async function setAdminReviewHiddenAction(id: number, hidden: boolean) {
  return adminRequest<AdminReview>(hidden ? "POST" : "DELETE", hidden ? "HIDE_ADMIN_REVIEW" : "UNHIDE_ADMIN_REVIEW", "Failed to change visibility", {
    pathParams: { id },
  });
}

/** POST features on the home page, DELETE un-features */
export async function setAdminReviewFeaturedAction(id: number, featured: boolean) {
  return adminRequest<AdminReview>(
    featured ? "POST" : "DELETE",
    featured ? "FEATURE_ADMIN_REVIEW" : "UNFEATURE_ADMIN_REVIEW",
    "Failed to change featured state",
    { pathParams: { id } }
  );
}

/** PUT /admin/reviews/{id} — `reviewer_name` is accepted only on reviews entered by the shop. */
export async function updateAdminReviewAction(id: number, payload: { comment: string | null; rating?: number; reviewer_name?: string }) {
  return adminRequest<AdminReview>("PUT", "UPDATE_ADMIN_REVIEW", "Failed to update review", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminReviewAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_REVIEW", "Failed to delete review", { pathParams: { id } });
}
