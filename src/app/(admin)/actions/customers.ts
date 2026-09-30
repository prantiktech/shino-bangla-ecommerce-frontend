"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function getAdminCustomersAction(params?: Record<string, any>): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_CUSTOMERS", { params });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load customers") : "Failed to load customers",
        code: "GET_CUSTOMERS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
