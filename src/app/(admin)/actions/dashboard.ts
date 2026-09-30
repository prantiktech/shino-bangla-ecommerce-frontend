"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function getAdminDashboardAction(): Promise<ActionResponse<any>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_DASHBOARD");
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load dashboard") : "Failed to load dashboard",
        code: "GET_DASHBOARD_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
