"use server";

import { serverGet } from "@/lib/api-client/server";
import { adminRequest, adminVoid } from "./_request";

export type ZoneType = "inside_city" | "outside_city" | "custom";
export type RateBasis = "flat" | "weight" | "order_value";

export interface ShippingRate {
  id?: number;
  range_from: number;
  range_to: number | null;
  charge: number;
  per_extra_kg: number | null;
}

export interface ShippingZone {
  id: number;
  name: string;
  type: ZoneType;
  rate_basis: RateBasis;
  free_above: number | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  locations: { id: number; name: string }[];
  rates: ShippingRate[];
}

export interface ShippingZonePayload {
  name?: string;
  type?: ZoneType;
  rate_basis?: RateBasis;
  free_above?: number | null;
  delivery_days_min?: number | null;
  delivery_days_max?: number | null;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
  location_ids?: number[];
  rates?: Omit<ShippingRate, "id">[];
}

export interface LocationOption {
  id: number;
  name: string;
  type?: string;
  parent_id?: number | null;
}

export async function getAdminShippingZonesAction() {
  return adminRequest<ShippingZone[]>("GET", "GET_ADMIN_SHIPPING_ZONES", "Failed to load shipping zones");
}

export async function getAdminShippingZoneAction(id: number) {
  return adminRequest<ShippingZone>("GET", "GET_ADMIN_SHIPPING_ZONE", "Failed to load zone", { pathParams: { id } });
}

export async function createAdminShippingZoneAction(payload: ShippingZonePayload) {
  return adminRequest<ShippingZone>("POST", "CREATE_ADMIN_SHIPPING_ZONE", "Failed to create zone", { body: payload });
}

/** PUT /admin/shipping-zones/{shippingZone} — sending `rates` replaces them */
export async function updateAdminShippingZoneAction(id: number, payload: ShippingZonePayload) {
  return adminRequest<ShippingZone>("PUT", "UPDATE_ADMIN_SHIPPING_ZONE", "Failed to update zone", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminShippingZoneAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_SHIPPING_ZONE", "Failed to delete zone", { pathParams: { id } });
}

/**
 * Public GET /locations — divisions, then each division's districts (by `parent_id`).
 * Returned flat so a zone can be tied to any division or district.
 */
export async function getLocationOptionsAction(): Promise<LocationOption[]> {
  const load = async (parentId?: number): Promise<LocationOption[]> => {
    try {
      const res = await serverGet<{ data?: unknown; meta?: Record<string, unknown> } & Record<string, unknown>>("GET_LOCATIONS", {
        params: parentId ? { parent_id: parentId } : undefined,
        next: { revalidate: 86400 },
      });
      if (!res.success) return [];
      const raw = res.data?.data ?? res.data ?? [];
      type RawLocation = { id: number; name: string; level?: string; type?: string; parent_id?: number | null };
      return (Array.isArray(raw) ? (raw as RawLocation[]) : []).map((n) => ({
        id: Number(n.id),
        name: String(n.name),
        type: n.level ?? n.type,
        parent_id: n.parent_id ?? null,
      }));
    } catch {
      return [];
    }
  };

  const divisions = await load();
  const districts = await Promise.all(divisions.map((d) => load(d.id)));
  return [...divisions, ...districts.flat()];
}
