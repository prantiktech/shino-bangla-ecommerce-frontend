"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import {
  InventoryFilterParams,
  InventoryItemResource,
  InventorySummary,
  PaginatedResponse,
  StockAdjustmentPayload,
  StockMovementResource,
  StockMovementsFilterParams,
} from "@/types/inventory";

/**
 * Fetch paginated variants with stock levels (lowest first by default)
 * Endpoint: GET /api/v1/admin/inventory
 * Requires permission: inventory.view
 */
export async function getAdminInventoryAction(
  params?: InventoryFilterParams
): Promise<ActionResponse<PaginatedResponse<InventoryItemResource>>> {
  try {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.q) cleanParams.q = params.q;
      if (params.status) cleanParams.status = params.status;
      if (params.category_id !== undefined && params.category_id !== "") {
        cleanParams.category_id = params.category_id;
      }
      if (params.sort) cleanParams.sort = params.sort;
      if (params.page) cleanParams.page = params.page;
      if (params.per_page) cleanParams.per_page = params.per_page;
    }

    const res = await serverGet<any>("GET_ADMIN_INVENTORY", { params: cleanParams });
    if (res.success && res.data) {
      // Backend may return { data: [...], links: ..., meta: ... } or raw array
      const raw = res.data;
      const data = Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : [];
      return {
        success: true,
        data: {
          data,
          links: raw.links,
          meta: raw.meta || {
            current_page: Number(cleanParams.page) || 1,
            per_page: Number(cleanParams.per_page) || 20,
            total: raw.meta?.total ?? data.length,
            last_page: raw.meta?.last_page ?? 1,
          },
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load inventory") : "Failed to load inventory",
        code: "GET_ADMIN_INVENTORY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch inventory summary metrics (units on hand, cost value, low/out counts)
 * Endpoint: GET /api/v1/admin/inventory/summary
 * Requires permission: inventory.view
 */
export async function getAdminInventorySummaryAction(): Promise<ActionResponse<InventorySummary>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_INVENTORY_SUMMARY");
    if (res.success && res.data) {
      const summaryData = res.data.data || res.data;
      return {
        success: true,
        data: {
          variants: Number(summaryData.variants) || 0,
          units_in_stock: Number(summaryData.units_in_stock) || 0,
          stock_value: Number(summaryData.stock_value) || 0,
          uncosted_variants: Number(summaryData.uncosted_variants) || 0,
          low_stock: Number(summaryData.low_stock) || 0,
          out_of_stock: Number(summaryData.out_of_stock) || 0,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load inventory summary") : "Failed to load inventory summary",
        code: "GET_ADMIN_INVENTORY_SUMMARY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch paginated stock history movements (newest first)
 * Endpoint: GET /api/v1/admin/inventory/movements
 * Requires permission: inventory.view
 */
export async function getAdminStockMovementsAction(
  params?: StockMovementsFilterParams
): Promise<ActionResponse<PaginatedResponse<StockMovementResource>>> {
  try {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.variant_id) cleanParams.variant_id = params.variant_id;
      if (params.type) cleanParams.type = params.type;
      if (params.from) cleanParams.from = params.from;
      if (params.to) cleanParams.to = params.to;
      if (params.page) cleanParams.page = params.page;
      if (params.per_page) cleanParams.per_page = params.per_page;
    }

    const res = await serverGet<any>("GET_ADMIN_INVENTORY_MOVEMENTS", { params: cleanParams });
    if (res.success && res.data) {
      const raw = res.data;
      const data = Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : [];
      return {
        success: true,
        data: {
          data,
          links: raw.links,
          meta: raw.meta || {
            current_page: Number(cleanParams.page) || 1,
            per_page: Number(cleanParams.per_page) || 20,
            total: raw.meta?.total ?? data.length,
            last_page: raw.meta?.last_page ?? 1,
          },
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load stock movements") : "Failed to load stock movements",
        code: "GET_ADMIN_STOCK_MOVEMENTS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Adjust a variant's stock (stocktake, damage, loss, restock)
 * Endpoint: POST /api/v1/admin/inventory/adjustments
 * Requires permission: inventory.adjust
 */
export async function adjustAdminInventoryAction(
  payload: StockAdjustmentPayload
): Promise<ActionResponse<InventoryItemResource>> {
  try {
    if (!payload.variant_id) {
      return {
        success: false,
        error: {
          message: "Variant ID is required.",
          code: "VALIDATION_FAILED",
        },
      };
    }

    if (payload.quantity < 0 || payload.quantity > 1000000) {
      return {
        success: false,
        error: {
          message: "Quantity must be between 0 and 1,000,000.",
          code: "VALIDATION_FAILED",
        },
      };
    }

    if (!payload.note || payload.note.trim() === "") {
      return {
        success: false,
        error: {
          message: "A reason/note is required (up to 500 characters).",
          code: "VALIDATION_FAILED",
        },
      };
    }

    const res = await serverPost<any>("ADMIN_INVENTORY_ADJUSTMENTS", {
      variant_id: Number(payload.variant_id),
      mode: payload.mode,
      quantity: Number(payload.quantity),
      note: payload.note.trim(),
    });

    if (res.success && res.data) {
      const item = res.data.data || res.data;
      return { success: true, data: item };
    }

    return {
      success: false,
      error: {
        message:
          !res.success
            ? res.error?.message || "Failed to adjust stock. Check if count causes negative stock."
            : "Failed to adjust stock.",
        code: res.success ? "UNKNOWN" : res.error?.code || "ADJUST_STOCK_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
