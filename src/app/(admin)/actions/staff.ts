"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface StaffMember {
  id: number;
  name: string;
  email: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  has_password: boolean;
  google_linked: boolean;
  is_active: boolean;
  is_staff: boolean;
  roles: string[];
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  is_active?: boolean;
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

/**
 * Fetch paginated list of back office staff accounts (shoppers excluded)
 * Requires: staff.view
 */
export async function getAdminStaffAction(params?: {
  page?: number;
  per_page?: number;
}): Promise<ActionResponse<{ data: StaffMember[]; meta?: any }>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_STAFF", {
      params,
    });
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return {
        success: true,
        data: {
          data: items,
          meta: res.data.meta,
        },
      };
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

/**
 * Fetch a single staff account
 * Requires: staff.view
 */
export async function getAdminStaffDetailAction(id: number | string): Promise<ActionResponse<StaffMember>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_MEMBER", {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Staff member not found") : "Staff member not found",
        code: "STAFF_NOT_FOUND",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Create a new staff account with starting password and role
 * Requires: staff.create
 */
export async function createAdminStaffAction(payload: CreateStaffPayload): Promise<ActionResponse<StaffMember>> {
  try {
    const body: any = {
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      role: payload.role,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
    };

    const res = await serverPost<any>("CREATE_ADMIN_STAFF", body);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to create staff account") : "Failed to create staff account",
        code: "CREATE_STAFF_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Update staff details, assigned role, password or active flag
 * Requires: staff.update
 */
export async function updateAdminStaffAction(
  id: number | string,
  payload: UpdateStaffPayload
): Promise<ActionResponse<StaffMember>> {
  try {
    const body: any = {};
    if (payload.name !== undefined) body.name = payload.name.trim();
    if (payload.email !== undefined) body.email = payload.email.trim();
    if (payload.password) body.password = payload.password;
    if (payload.role !== undefined) body.role = payload.role;
    if (payload.is_active !== undefined) body.is_active = Boolean(payload.is_active);

    const res = await serverPut<any>("UPDATE_ADMIN_MEMBER", body, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update staff member") : "Failed to update staff member",
        code: "UPDATE_STAFF_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Delete a staff account and immediately revoke active sessions
 * Requires: staff.delete
 */
export async function deleteAdminStaffAction(id: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_MEMBER", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete staff account") : "Failed to delete staff account",
        code: "DELETE_STAFF_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
