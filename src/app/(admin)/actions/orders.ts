"use server";

import { adminList, adminRequest, QueryParams } from "./_request";
import type {
  AdminOrderDetail,
  AdminOrderRow,
  OrdersSummary,
  ShipmentBookingPayload,
  ShipmentScanPayload,
  ShipmentScanResult,
} from "@/types/admin-orders";

/** Couriers can take a few seconds to answer; never resend a booking automatically. */
const COURIER_CALL = { timeout: 60000, retries: 0 } as const;

/**
 * GET /admin/orders — paginated; filters: status, payment_status, payment_method, source,
 * courier, q, product, customer_id, zone_id, from, to (YYYY-MM-DD), page, per_page.
 */
export async function getAdminOrdersAction(params?: QueryParams) {
  return adminList<AdminOrderRow>("GET_ADMIN_ORDERS", "Failed to load orders", params);
}

/** GET /admin/orders/summary — counts per step and payment status, sales total and average for a period. */
export async function getAdminOrdersSummaryAction(params?: { from?: string; to?: string }) {
  return adminRequest<OrdersSummary>("GET", "GET_ADMIN_ORDERS_SUMMARY", "Failed to load the order summary", { params });
}

export async function getAdminOrderAction(id: number | string) {
  return adminRequest<AdminOrderDetail>("GET", "GET_ADMIN_ORDER", "Order not found", { pathParams: { id } });
}

export async function updateAdminOrderStatusAction(id: number | string, status: string, note?: string) {
  return adminRequest<AdminOrderDetail>("POST", "UPDATE_ADMIN_ORDER_STATUS", "Failed to update the order status", {
    pathParams: { id },
    body: { status, note: note?.trim() || null },
  });
}

/** POST /admin/orders/{id}/payment — mark paid or unpaid, at any time; marking paid confirms a pending order. */
export async function setAdminOrderPaymentAction(id: number | string, paymentStatus: "paid" | "unpaid", note?: string) {
  return adminRequest<AdminOrderDetail>("POST", "UPDATE_ADMIN_ORDER_PAYMENT", "Failed to update the payment", {
    pathParams: { id },
    body: { payment_status: paymentStatus, note: note?.trim() || null },
  });
}

/* ------------------------------------------------------------------ */
/* Shipping with a courier                                            */
/* ------------------------------------------------------------------ */

/** POST /admin/orders/{id}/shipment — book a packed order; answers with the whole order, now Shipped. */
export async function bookAdminOrderShipmentAction(id: number, payload: ShipmentBookingPayload) {
  return adminRequest<AdminOrderDetail>("POST", "BOOK_ADMIN_ORDER_SHIPMENT", "The courier booking failed", {
    pathParams: { id },
    body: payload,
    ...COURIER_CALL,
  });
}

/** POST /admin/orders/{id}/shipment/sync — ask the courier where the parcel is now. */
export async function syncAdminOrderShipmentAction(id: number) {
  return adminRequest<AdminOrderDetail>("POST", "SYNC_ADMIN_ORDER_SHIPMENT", "Could not get an update from the courier", {
    pathParams: { id },
    ...COURIER_CALL,
  });
}

/**
 * POST /admin/shipments/scan — ship a packed order from its invoice barcode.
 * Leave `courier` out to ship by hand. Pathao/RedX may answer `needs_area`.
 */
export async function scanAdminShipmentAction(payload: ShipmentScanPayload) {
  return adminRequest<ShipmentScanResult>("POST", "SCAN_ADMIN_SHIPMENT", "The scan could not be processed", {
    body: payload,
    ...COURIER_CALL,
  });
}

/** POST /admin/returns/scan — a shipped or delivered order becomes Returned. */
export async function scanAdminReturnAction(payload: { number: string; note?: string }) {
  return adminRequest<AdminOrderDetail>("POST", "SCAN_ADMIN_RETURN", "The return could not be recorded", {
    body: { number: payload.number, note: payload.note?.trim() || null },
    retries: 0,
  });
}
