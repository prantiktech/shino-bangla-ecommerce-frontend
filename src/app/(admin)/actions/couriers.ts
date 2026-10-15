"use server";

import { adminList, adminRequest } from "./_request";
import type {
  AvailableCourier,
  CourierAccount,
  CourierArea,
  CourierKey,
  CourierStore,
  CourierUpdatePayload,
} from "@/types/admin-orders";

/** Calls that reach the courier's own servers: allow for their timeout and never resend automatically. */
const COURIER_CALL = { timeout: 45000, retries: 0 } as const;

/** GET /admin/couriers — all three couriers, keys masked (`couriers.view`). */
export async function getAdminCouriersAction() {
  return adminList<CourierAccount>("GET_ADMIN_COURIERS", "Failed to load couriers");
}

/** PUT /admin/couriers/{courier} — on/off, test mode, keys, pickup store (`couriers.update`). */
export async function updateAdminCourierAction(courier: CourierKey, payload: CourierUpdatePayload) {
  return adminRequest<CourierAccount>("PUT", "UPDATE_ADMIN_COURIER", "Failed to save the courier", {
    pathParams: { courier },
    body: payload,
  });
}

/** POST /admin/couriers/{courier}/check — one harmless request with the saved keys. */
export async function checkAdminCourierAction(courier: CourierKey) {
  return adminRequest<{ courier: CourierKey; is_sandbox: boolean; message: string }>(
    "POST",
    "CHECK_ADMIN_COURIER",
    "The courier did not accept the keys",
    { pathParams: { courier }, ...COURIER_CALL }
  );
}

/** GET /admin/couriers/{courier}/stores — pickup stores for Pathao and RedX (empty for Steadfast). */
export async function getAdminCourierStoresAction(courier: CourierKey) {
  return adminList<CourierStore>("GET_ADMIN_COURIER_STORES", "Failed to load pickup stores", undefined, { courier }, COURIER_CALL);
}

/** GET /admin/couriers/available — couriers switched on and fully set up (`orders.fulfil`). */
export async function getAdminAvailableCouriersAction() {
  return adminList<AvailableCourier>("GET_ADMIN_AVAILABLE_COURIERS", "Failed to load couriers");
}

/**
 * GET /admin/couriers/{courier}/areas — Pathao: cities, then `city_id` zones, then `zone_id` areas;
 * RedX: areas matching `q`. Lists are cached by the API for a day.
 */
export async function getAdminCourierAreasAction(
  courier: CourierKey,
  params: { city_id?: number; zone_id?: number; q?: string } = {}
) {
  return adminList<CourierArea>("GET_ADMIN_COURIER_AREAS", "Failed to load the courier's places", params, { courier }, COURIER_CALL);
}
