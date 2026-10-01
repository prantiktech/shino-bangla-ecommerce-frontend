"use server";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface CategoryImageResource {
  id: number;
  url: string;
  sizes?: any[] | null;
  width?: number;
  height?: number;
  alt?: string | null;
}

export interface AdminCategoryResource {
  id: number;
  parent_id: number | null;
  depth: number;
  name: string;
  slug: string;
  description: string | null;
  vat_rate_bp: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  icon: CategoryImageResource | null;
  banner: CategoryImageResource | null;
  products_count: number;
  created_at?: string;
  updated_at?: string;
  children?: AdminCategoryResource[];
}

export interface CreateAdminCategoryPayload {
  name: string;
  slug: string;
  parent_id?: number | null;
  description?: string;
  vat_rate_bp?: number;
  is_active?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  icon_image_id?: number | null;
  banner_image_id?: number | null;
}

export interface UpdateAdminCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  vat_rate_bp?: number;
  is_active?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  icon_image_id?: number | null;
  banner_image_id?: number | null;
}

export interface MoveAdminCategoryPayload {
  parent_id: number;
  position: number;
}

/**
 * Fetch all categories in tree or flat list for admin
 * Endpoint: GET /api/v1/admin/categories
 */
export async function getAdminCategoriesAction(): Promise<ActionResponse<AdminCategoryResource[]>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_CATEGORIES");
    if (res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items };
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

/**
 * Fetch single category detail
 * Endpoint: GET /api/v1/admin/categories/{category}
 */
export async function getAdminCategoryDetailAction(
  id: number | string
): Promise<ActionResponse<AdminCategoryResource>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_CATEGORY", {
      pathParams: { id },
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Category not found") : "Category not found",
        code: "CATEGORY_NOT_FOUND",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Create new category
 * Endpoint: POST /api/v1/admin/categories
 */
export async function createAdminCategoryAction(
  payload: CreateAdminCategoryPayload
): Promise<ActionResponse<AdminCategoryResource>> {
  try {
    const body: Record<string, any> = {
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      parent_id: payload.parent_id !== undefined && payload.parent_id !== null ? Number(payload.parent_id) : 0,
      description: payload.description?.trim() || "",
      vat_rate_bp: Number(payload.vat_rate_bp ?? 0),
      is_active: payload.is_active ?? true,
      seo_title: payload.seo_title?.trim() || "",
      seo_description: payload.seo_description?.trim() || "",
      seo_keywords: payload.seo_keywords?.trim() || "",
    };

    if (payload.icon_image_id) {
      body.icon_image_id = Number(payload.icon_image_id);
    }
    if (payload.banner_image_id) {
      body.banner_image_id = Number(payload.banner_image_id);
    }

    const res = await serverPost<any>("CREATE_ADMIN_CATEGORY", body);
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

/**
 * Update category
 * Endpoint: PUT /api/v1/admin/categories/{category}
 */
export async function updateAdminCategoryAction(
  id: number | string,
  payload: UpdateAdminCategoryPayload
): Promise<ActionResponse<AdminCategoryResource>> {
  try {
    const body: Record<string, any> = {
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      description: payload.description?.trim() || "",
      vat_rate_bp: Number(payload.vat_rate_bp ?? 0),
      is_active: payload.is_active ?? true,
      seo_title: payload.seo_title?.trim() || "",
      seo_description: payload.seo_description?.trim() || "",
      seo_keywords: payload.seo_keywords?.trim() || "",
    };

    if (payload.icon_image_id !== undefined) {
      body.icon_image_id = payload.icon_image_id ? Number(payload.icon_image_id) : null;
    }
    if (payload.banner_image_id !== undefined) {
      body.banner_image_id = payload.banner_image_id ? Number(payload.banner_image_id) : null;
    }

    const res = await serverPut<any>("UPDATE_ADMIN_CATEGORY", body, {
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

/**
 * Delete category
 * Endpoint: DELETE /api/v1/admin/categories/{category}
 */
export async function deleteAdminCategoryAction(
  id: number | string
): Promise<ActionResponse<boolean>> {
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

/**
 * Move category to another parent or reorder
 * Endpoint: PUT /api/v1/admin/categories/{category}/move
 */
export async function moveAdminCategoryAction(
  id: number | string,
  payload: MoveAdminCategoryPayload
): Promise<ActionResponse<any>> {
  try {
    const res = await serverPut<any>(
      "MOVE_ADMIN_CATEGORY",
      {
        parent_id: Number(payload.parent_id),
        position: Number(payload.position),
      },
      {
        pathParams: { id },
      }
    );

    if (res.success) {
      return { success: true, data: res.data?.data || res.data || true };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to move category") : "Failed to move category",
        code: "MOVE_CATEGORY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
