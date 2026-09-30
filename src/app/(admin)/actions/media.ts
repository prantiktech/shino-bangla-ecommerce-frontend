"use server";

import { serverPost, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export async function uploadAdminMediaAction(formData: FormData): Promise<ActionResponse<{ id: number; url: string }>> {
  try {
    const res = await serverPost<any>("UPLOAD_ADMIN_MEDIA", formData);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to upload media") : "Failed to upload media",
        code: "UPLOAD_MEDIA_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAdminMediaAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_MEDIA", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete media") : "Failed to delete media",
        code: "DELETE_MEDIA_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
