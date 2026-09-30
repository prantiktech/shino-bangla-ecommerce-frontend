"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function getAdminStaffAction(): Promise<ActionResponse<any[]>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_STAFF");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load staff") : "Failed to load staff",
        code: "GET_STAFF_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAdminRolesAction(): Promise<ActionResponse<any[]>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_ROLES");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load roles") : "Failed to load roles",
        code: "GET_ROLES_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
