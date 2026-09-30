"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function getAdminCategoriesAction(): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_CATEGORIES");
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load categories") : "Failed to load categories",
        code: "GET_ADMIN_CATEGORIES_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createAdminCategoryAction(payload: any): Promise<ActionResponse<any>> {
  try {
    const res = await serverPost<any>("CREATE_ADMIN_CATEGORY", payload);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to create category") : "Failed to create category",
        code: "CREATE_CATEGORY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAdminCategoryAction(id: number | string, payload: any): Promise<ActionResponse<any>> {
  try {
    const res = await serverPut<any>("UPDATE_ADMIN_CATEGORY", payload, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update category") : "Failed to update category",
        code: "UPDATE_CATEGORY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAdminCategoryAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_CATEGORY", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete category") : "Failed to delete category",
        code: "DELETE_CATEGORY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
