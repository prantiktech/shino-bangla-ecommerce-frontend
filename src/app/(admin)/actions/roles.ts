"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface RoleResource {
  id: number;
  name: string;
  is_reserved: boolean;
  permissions: string[];
  users_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateRolePayload {
  name: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  permissions: string[];
}

/**
 * Fetch all roles with their permissions and staff counts
 * Requires: roles.view
 */
export async function getAdminRolesAction(): Promise<ActionResponse<RoleResource[]>> {
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

/**
 * Fetch one specific role with its full permissions
 * Requires: roles.view
 */
export async function getAdminRoleDetailAction(roleId: number | string): Promise<ActionResponse<RoleResource>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_ROLE", {
      pathParams: { id: roleId },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Role not found") : "Role not found",
        code: "ROLE_NOT_FOUND",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Create a new custom role granting specified permissions
 * Requires: roles.create
 */
export async function createAdminRoleAction(payload: CreateRolePayload): Promise<ActionResponse<RoleResource>> {
  try {
    const res = await serverPost<any>("CREATE_ADMIN_ROLE", {
      name: payload.name.trim(),
      permissions: payload.permissions,
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to create role") : "Failed to create role",
        code: "CREATE_ROLE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Update role name and replace permissions wholesale
 * Requires: roles.update
 */
export async function updateAdminRoleAction(
  roleId: number | string,
  payload: UpdateRolePayload
): Promise<ActionResponse<RoleResource>> {
  try {
    const body: any = {
      permissions: payload.permissions,
    };
    if (payload.name) {
      body.name = payload.name.trim();
    }

    const res = await serverPut<any>("UPDATE_ADMIN_ROLE", body, {
      pathParams: { id: roleId },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update role") : "Failed to update role",
        code: "UPDATE_ROLE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Delete a custom role (refused if staff currently hold it)
 * Requires: roles.delete
 */
export async function deleteAdminRoleAction(roleId: number | string): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_ROLE", {
      pathParams: { id: roleId },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to delete role") : "Failed to delete role",
        code: "DELETE_ROLE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
