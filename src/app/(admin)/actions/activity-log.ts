"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import {
  ActivityLogItem,
  ActivityLogListResponse,
  ActivityLogFilters,
} from "@/types/activity-log";

/**
 * Fetch all activity logs (newest first) with filters
 * Endpoint: GET /api/v1/admin/activity-log
 */
export async function getActivityLogsAction(
  filters: ActivityLogFilters = {}
): Promise<ActionResponse<ActivityLogListResponse>> {
  try {
    const queryParams: Record<string, string | number> = {};

    if (filters.log && filters.log !== "all") {
      queryParams.log = filters.log;
    }
    if (filters.event && filters.event !== "all") {
      queryParams.event = filters.event;
    }
    if (filters.causer_id !== undefined && filters.causer_id !== null && filters.causer_id !== "" && Number(filters.causer_id) > 0) {
      queryParams.causer_id = Number(filters.causer_id);
    }
    if (filters.subject_type && filters.subject_type !== "all") {
      queryParams.subject_type = filters.subject_type;
    }
    if (filters.subject_id !== undefined && filters.subject_id !== null && filters.subject_id !== "" && Number(filters.subject_id) > 0) {
      queryParams.subject_id = Number(filters.subject_id);
    }
    if (filters.from) {
      queryParams.from = filters.from;
    }
    if (filters.to) {
      queryParams.to = filters.to;
    }
    if (filters.q && filters.q.trim()) {
      queryParams.q = filters.q.trim();
    }
    if (filters.page && filters.page > 1) {
      queryParams.page = filters.page;
    }
    if (filters.per_page) {
      queryParams.per_page = filters.per_page;
    }

    const res = await serverGet<any>("GET_ADMIN_ACTIVITY_LOG", {
      params: queryParams,
    });

    if (res.success && res.data) {
      return {
        success: true,
        data: {
          data: Array.isArray(res.data.data) ? res.data.data : [],
          links: res.data.links,
          meta: res.data.meta,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to load activity logs" : "Failed to load activity logs",
        code: "GET_ACTIVITY_LOG_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch complete audit trail for a specific single record
 * Endpoint: GET /api/v1/admin/activity-log/{type}/{id}
 */
export async function getRecordActivityLogAction(
  type: string,
  id: number | string,
  page: number = 1
): Promise<ActionResponse<ActivityLogListResponse>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_RECORD_ACTIVITY_LOG", {
      pathParams: {
        type: encodeURIComponent(type),
        id: String(id),
      },
      params: page > 1 ? { page } : undefined,
    });

    if (res.success && res.data) {
      return {
        success: true,
        data: {
          data: Array.isArray(res.data.data) ? res.data.data : [],
          links: res.data.links,
          meta: res.data.meta,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? res.error?.message || "Failed to load record audit trail" : "Failed to load record audit trail",
        code: "GET_RECORD_LOG_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
