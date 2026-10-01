"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface BannerImageResource {
  id: number;
  url: string;
  sizes?: any[] | null;
  width?: number;
  height?: number;
  alt?: string | null;
}

export interface AdminBannerResource {
  id: number;
  type: string;
  title: string;
  subtitle?: string | null;
  button_label?: string | null;
  link_url?: string | null;
  is_active: boolean;
  position: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_live?: string | boolean;
  image?: BannerImageResource | null;
  mobile_image?: BannerImageResource | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAdminBannerPayload {
  type: string;
  title: string;
  subtitle?: string;
  button_label?: string;
  link_url?: string;
  is_active: boolean;
  position: number;
  starts_at?: string | null;
  ends_at?: string | null;
  image_id: number;
  mobile_image_id?: number | null;
}

export interface UpdateAdminBannerPayload {
  type: string;
  title: string;
  subtitle?: string;
  button_label?: string;
  link_url?: string;
  is_active: boolean;
  position: number;
  starts_at?: string | null;
  ends_at?: string | null;
  image_id: number;
  mobile_image_id?: number | null;
}

/**
 * Fetch all banners for admin
 * Endpoint: GET /api/v1/admin/banners
 */
export async function getAdminBannersAction(): Promise<ActionResponse<AdminBannerResource[]>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_BANNERS");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      return { success: true, data: items };
    }
    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to load banners" : "Failed to load banners",
        code: "GET_ADMIN_BANNERS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Create a new banner
 * Endpoint: POST /api/v1/admin/banners
 */
export async function createAdminBannerAction(
  payload: CreateAdminBannerPayload
): Promise<ActionResponse<AdminBannerResource>> {
  try {
    const body: Record<string, any> = {
      type: payload.type || "slider",
      title: payload.title.trim(),
      subtitle: payload.subtitle?.trim() || "",
      button_label: payload.button_label?.trim() || "",
      link_url: payload.link_url?.trim() || "",
      is_active: Boolean(payload.is_active),
      position: Number(payload.position || 0),
      image_id: Number(payload.image_id),
    };

    if (payload.starts_at) {
      body.starts_at = payload.starts_at;
    }
    if (payload.ends_at) {
      body.ends_at = payload.ends_at;
    }
    if (payload.mobile_image_id) {
      body.mobile_image_id = Number(payload.mobile_image_id);
    }

    const res = await serverPost<any>("CREATE_ADMIN_BANNER", body);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to create banner" : "Failed to create banner",
        code: "CREATE_BANNER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Update an existing banner
 * Endpoint: PUT /api/v1/admin/banners/{banner}
 */
export async function updateAdminBannerAction(
  id: number | string,
  payload: UpdateAdminBannerPayload
): Promise<ActionResponse<AdminBannerResource>> {
  try {
    const body: Record<string, any> = {
      type: payload.type || "slider",
      title: payload.title.trim(),
      subtitle: payload.subtitle?.trim() || "",
      button_label: payload.button_label?.trim() || "",
      link_url: payload.link_url?.trim() || "",
      is_active: Boolean(payload.is_active),
      position: Number(payload.position || 0),
      image_id: Number(payload.image_id),
    };

    if (payload.starts_at !== undefined) {
      body.starts_at = payload.starts_at || null;
    }
    if (payload.ends_at !== undefined) {
      body.ends_at = payload.ends_at || null;
    }
    if (payload.mobile_image_id !== undefined) {
      body.mobile_image_id = payload.mobile_image_id ? Number(payload.mobile_image_id) : null;
    }

    const res = await serverPut<any>("UPDATE_ADMIN_BANNER", body, {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to update banner" : "Failed to update banner",
        code: "UPDATE_BANNER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Delete a banner
 * Endpoint: DELETE /api/v1/admin/banners/{banner}
 */
export async function deleteAdminBannerAction(
  id: number | string
): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("DELETE_ADMIN_BANNER", {
      pathParams: { id },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to delete banner" : "Failed to delete banner",
        code: "DELETE_BANNER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
