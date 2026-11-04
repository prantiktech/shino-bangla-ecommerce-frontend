"use server";

import { adminList, adminRequest, QueryParams } from "./_request";
import type { IncompleteOrder, IncompleteOrderStatus } from "@/types/admin-orders";

/**
 * GET /admin/incomplete-orders
 * Filters: status ('incomplete' | 'recovered' | 'dismissed'), source ('cart' | 'buy_now'),
 * has_phone (1 | 0), q (search name/phone/email), page, per_page.
 */
export async function getAdminIncompleteOrdersAction(params?: QueryParams) {
  return adminList<IncompleteOrder>(
    "GET_ADMIN_INCOMPLETE_ORDERS",
    "Failed to load incomplete orders",
    params
  );
}

/**
 * GET /admin/incomplete-orders/{id}
 */
export async function getAdminIncompleteOrderAction(id: number | string) {
  return adminRequest<IncompleteOrder>(
    "GET",
    "GET_ADMIN_INCOMPLETE_ORDER",
    "Incomplete order not found",
    { pathParams: { id } }
  );
}

/**
 * PATCH /admin/incomplete-orders/{id}
 * Update `status` ('incomplete' | 'recovered' | 'dismissed') and/or `staff_note` (max 1000 chars).
 */
export async function updateAdminIncompleteOrderAction(
  id: number | string,
  payload: { status?: IncompleteOrderStatus; staff_note?: string | null }
) {
  return adminRequest<IncompleteOrder>(
    "PATCH",
    "UPDATE_ADMIN_INCOMPLETE_ORDER",
    "Failed to update incomplete order",
    {
      pathParams: { id },
      body: payload,
    }
  );
}
