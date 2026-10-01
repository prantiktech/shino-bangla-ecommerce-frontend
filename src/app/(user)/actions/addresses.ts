"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface DistrictInfo {
  id: number;
  name: string;
  bn_name?: string;
}

export interface DivisionInfo {
  id: number;
  name: string;
  bn_name?: string;
}

export interface Address {
  id: number;
  label?: string | null;
  name: string;
  phone: string;
  alternative_phone?: string;
  division_id?: number | null;
  district_id: number;
  division?: DivisionInfo | string | null;
  district?: DistrictInfo | string | null;
  area?: string | null;
  line1: string;
  line2?: string | null;
  postcode?: string | null;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
  // compatibility fields for older components / checkout
  address_line?: string;
  is_default?: boolean;
  type?: "home" | "office";
}

export type AddressInput = {
  label?: string | null;
  name: string;
  phone: string;
  district_id: number;
  division_id?: number | null;
  area?: string | null;
  line1: string;
  line2?: string | null;
  postcode?: string | null;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
  address_line?: string;
  is_default?: boolean;
  type?: "home" | "office";
};

function normalizeAddress(item: any): Address {
  const line1 = item.line1 || item.address_line || "";
  const districtName = typeof item.district === "object" ? item.district?.name : item.district;
  const fullSummary = [line1, item.line2, item.area, districtName].filter(Boolean).join(", ");

  return {
    ...item,
    id: item.id,
    label: item.label || (item.type === "office" ? "Office" : "Home"),
    name: item.name || "",
    phone: item.phone || "",
    line1,
    line2: item.line2 || null,
    area: item.area || null,
    district_id: Number(item.district_id),
    division_id: item.division_id ? Number(item.division_id) : null,
    district: item.district,
    division: item.division,
    postcode: item.postcode || null,
    is_default_shipping: Boolean(item.is_default_shipping ?? item.is_default),
    is_default_billing: Boolean(item.is_default_billing),
    address_line: item.address_line || fullSummary,
    is_default: Boolean(item.is_default ?? item.is_default_shipping),
  };
}

export async function getAddressesAction(): Promise<ActionResponse<Address[]>> {
  try {
    const res = await serverGet<any>("GET_ADDRESSES");
    if (res.success && res.data) {
      const raw = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const items = raw.map(normalizeAddress);
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load addresses") : "Failed to load addresses",
        code: "GET_ADDRESSES_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createAddressAction(payload: AddressInput): Promise<ActionResponse<Address>> {
  try {
    const backendPayload: any = {
      label: payload.label || (payload.type === "office" ? "Office" : "Home"),
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      district_id: Number(payload.district_id),
      line1: (payload.line1 || payload.address_line || "").trim(),
    };

    if (payload.area) backendPayload.area = payload.area.trim();
    if (payload.line2) backendPayload.line2 = payload.line2.trim();
    if (payload.postcode) backendPayload.postcode = payload.postcode.trim();
    if (payload.division_id) backendPayload.division_id = Number(payload.division_id);
    if (payload.is_default_shipping !== undefined) {
      backendPayload.is_default_shipping = Boolean(payload.is_default_shipping);
    } else if (payload.is_default !== undefined) {
      backendPayload.is_default_shipping = Boolean(payload.is_default);
    }

    const res = await serverPost<any>("CREATE_ADDRESS", backendPayload);
    if (res.success && res.data) {
      const created = res.data.data || res.data;
      return { success: true, data: normalizeAddress(created) };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to create address") : "Failed to create address",
        code: "CREATE_ADDRESS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAddressAction(
  id: number | string,
  payload: Partial<AddressInput>
): Promise<ActionResponse<Address>> {
  try {
    const backendPayload: any = {};
    if (payload.label !== undefined) backendPayload.label = payload.label;
    if (payload.name !== undefined) backendPayload.name = payload.name.trim();
    if (payload.phone !== undefined) backendPayload.phone = payload.phone.trim();
    if (payload.district_id !== undefined) backendPayload.district_id = Number(payload.district_id);
    if (payload.division_id !== undefined) backendPayload.division_id = Number(payload.division_id);
    if (payload.area !== undefined) backendPayload.area = payload.area?.trim() || null;
    if (payload.line1 !== undefined || payload.address_line !== undefined) {
      backendPayload.line1 = (payload.line1 || payload.address_line || "").trim();
    }
    if (payload.line2 !== undefined) backendPayload.line2 = payload.line2?.trim() || null;
    if (payload.postcode !== undefined) backendPayload.postcode = payload.postcode?.trim() || null;
    if (payload.is_default_shipping !== undefined) {
      backendPayload.is_default_shipping = Boolean(payload.is_default_shipping);
    } else if (payload.is_default !== undefined) {
      backendPayload.is_default_shipping = Boolean(payload.is_default);
    }

    const res = await serverPut<any>("UPDATE_ADDRESS", backendPayload, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      const updated = res.data.data || res.data;
      return { success: true, data: normalizeAddress(updated) };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update address") : "Failed to update address",
        code: "UPDATE_ADDRESS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function setDefaultAddressAction(id: number | string): Promise<ActionResponse<Address>> {
  return updateAddressAction(id, { is_default_shipping: true });
}

export async function deleteAddressAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADDRESS", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete address") : "Failed to delete address",
        code: "DELETE_ADDRESS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
