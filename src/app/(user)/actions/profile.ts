"use server";

import { serverPut } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface UpdateProfileInput {
  name: string;
  avatar_url?: string | null;
}

export interface ChangePasswordInput {
  current_password?: string;
  password: string;
  password_confirmation: string;
}

export async function updateProfileAction(
  payload: UpdateProfileInput
): Promise<ActionResponse<any>> {
  try {
    const res = await serverPut<any>("UPDATE_ME", {
      name: payload.name.trim(),
      avatar_url: payload.avatar_url || null,
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update profile") : "Failed to update profile",
        code: "UPDATE_PROFILE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function changePasswordAction(
  payload: ChangePasswordInput
): Promise<ActionResponse<{ message: string }>> {
  try {
    const res = await serverPut<any>("CHANGE_PASSWORD", {
      current_password: payload.current_password,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    });

    if (res.success) {
      return {
        success: true,
        data: { message: res.data?.message || "Password updated successfully." },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to change password") : "Failed to change password",
        code: "CHANGE_PASSWORD_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
