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
  author: { id: number; name: string } | null;
  product: { id: number; name: string; slug: string } | null;
  order_id: number | null;
  photos: { id: number; url: string }[];
  moderated_by: string | null;
  approved_at: string | null;
  created_at: string;
}

/** GET /admin/reviews — status (default pending), rating, product_id, is_hidden, is_featured, q */
export async function getAdminReviewsAction(params?: QueryParams) {
  return adminList<AdminReview>("GET_ADMIN_REVIEWS", "Failed to load reviews", params);
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

export async function updateAdminReviewAction(id: number, payload: { comment: string | null; rating?: number }) {
  return adminRequest<AdminReview>("PUT", "UPDATE_ADMIN_REVIEW", "Failed to update review", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminReviewAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_REVIEW", "Failed to delete review", { pathParams: { id } });
}
