"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function getAdminProductsAction(params?: Record<string, any>): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_PRODUCTS", { params });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load products") : "Failed to load products",
        code: "GET_ADMIN_PRODUCTS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createAdminProductAction(payload: any): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>("CREATE_ADMIN_PRODUCT", payload);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to create product") : "Failed to create product",
        code: "CREATE_PRODUCT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAdminProductAction(id: number | string, payload: any): Promise<ActionResponse<any>> {
  try {
    const res = await serverPut<any>("UPDATE_ADMIN_PRODUCT", payload, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update product") : "Failed to update product",
        code: "UPDATE_PRODUCT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAdminProductAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_PRODUCT", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete product") : "Failed to delete product",
        code: "DELETE_PRODUCT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
