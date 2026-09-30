"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface Address {
  id: number;
  name: string;
  phone: string;
  alternative_phone?: string;
  division_id: number;
  district_id: number;
  thana_id?: number;
  address_line: string;
  is_default: boolean;
  type?: "home" | "office";
}

export async function getAddressesAction(): Promise<ActionResponse<Address[]>> {
  try {
    const res = await serverGet<any>("GET_ADDRESSES");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
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

export async function createAddressAction(payload: Omit<Address, "id">): Promise<ActionResponse<Address>> {
  try {
    const res = await serverPost<any>("CREATE_ADDRESS", payload);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
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

export async function updateAddressAction(id: number | string, payload: Partial<Address>): Promise<ActionResponse<Address>> {
  try {
    const res = await serverPut<any>("UPDATE_ADDRESS", payload, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
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
