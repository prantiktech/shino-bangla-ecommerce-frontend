"use server";

import {
  adminList,
  adminRequest,
  type PaginationMeta,
} from "./_request";
import type { ActionResponse } from "@/lib/api-client/status-handler";
import type {
  AccountingBasis,
  AccountingBreakdownDimension,
  AccountingBreakdownResponse,
  AccountingBreakdownSort,
  AccountingCollectionResponse,
  AccountingGroupBy,
  AccountingPreset,
  AccountingStockResponse,
  AccountingSummaryResponse,
  AccountingTimelineResponse,
  ExpenseCategory,
  ExpenseListSummary,
  ExpensePaymentMethod,
  ExpenseRecord,
  ProfitAndLossResponse,
} from "@/types/accounting";
import { serverGet } from "@/lib/api-client/server";
import { handleActionError } from "@/lib/api-client/status-handler";

export interface AccountingPeriodQuery {
  preset?: AccountingPreset;
  from?: string;
  to?: string;
  basis?: AccountingBasis;
}

/** 1. Executive Summary & KPI Cards */
export async function getAccountingSummaryAction(
  params?: AccountingPeriodQuery & { compare?: 0 | 1 | boolean }
): Promise<ActionResponse<AccountingSummaryResponse>> {
  return adminRequest<AccountingSummaryResponse>(
    "GET",
    "GET_ADMIN_ACCOUNTING_SUMMARY",
    "Failed to load accounting summary",
    {
      params: {
        preset: params?.preset ?? "this_month",
        from: params?.preset === "custom" ? params?.from : undefined,
        to: params?.preset === "custom" ? params?.to : undefined,
        basis: params?.basis ?? "accrual",
        compare: params?.compare === false || params?.compare === 0 ? 0 : 1,
      },
    }
  );
}

/** 2. Revenue, Cost & Profit Timeline (Chart Data) */
export async function getAccountingTimelineAction(
  params?: AccountingPeriodQuery & { group_by?: AccountingGroupBy }
): Promise<ActionResponse<AccountingTimelineResponse>> {
  return adminRequest<AccountingTimelineResponse>(
    "GET",
    "GET_ADMIN_ACCOUNTING_TIMELINE",
    "Failed to load accounting timeline",
    {
      params: {
        preset: params?.preset ?? "this_month",
        from: params?.preset === "custom" ? params?.from : undefined,
        to: params?.preset === "custom" ? params?.to : undefined,
        basis: params?.basis ?? "accrual",
        group_by: params?.group_by,
      },
    }
  );
}

/** 3. Profit & Expense Breakdown (8 Dimensions) */
export async function getAccountingBreakdownAction(
  params?: AccountingPeriodQuery & {
    by?: AccountingBreakdownDimension;
    sort?: AccountingBreakdownSort;
    limit?: number;
  }
): Promise<ActionResponse<AccountingBreakdownResponse>> {
  return adminRequest<AccountingBreakdownResponse>(
    "GET",
    "GET_ADMIN_ACCOUNTING_BREAKDOWN",
    "Failed to load accounting breakdown",
    {
      params: {
        preset: params?.preset ?? "this_month",
        from: params?.preset === "custom" ? params?.from : undefined,
        to: params?.preset === "custom" ? params?.to : undefined,
        basis: params?.basis ?? "accrual",
        by: params?.by ?? "product",
        sort: params?.sort ?? "profit",
        limit: params?.limit ?? 20,
      },
    }
  );
}

/** 4. Cash Collection & COD Pipeline */
export async function getAccountingCollectionAction(params?: {
  preset?: AccountingPreset;
  from?: string;
  to?: string;
}): Promise<ActionResponse<AccountingCollectionResponse>> {
  return adminRequest<AccountingCollectionResponse>(
    "GET",
    "GET_ADMIN_ACCOUNTING_COLLECTION",
    "Failed to load cash collection pipeline",
    {
      params: {
        preset: params?.preset ?? "this_month",
        from: params?.preset === "custom" ? params?.from : undefined,
        to: params?.preset === "custom" ? params?.to : undefined,
      },
    }
  );
}

/** 5. Inventory Valuation & Supplier Payables */
export async function getAccountingStockAction(params?: {
  limit?: number;
}): Promise<ActionResponse<AccountingStockResponse>> {
  return adminRequest<AccountingStockResponse>(
    "GET",
    "GET_ADMIN_ACCOUNTING_STOCK",
    "Failed to load stock valuation",
    {
      params: {
        limit: params?.limit ?? 15,
      },
    }
  );
}

/** 6. Profit & Loss Statement (JSON) */
export async function getAccountingProfitAndLossAction(
  params?: AccountingPeriodQuery
): Promise<ActionResponse<ProfitAndLossResponse>> {
  return adminRequest<ProfitAndLossResponse>(
    "GET",
    "GET_ADMIN_ACCOUNTING_PROFIT_AND_LOSS",
    "Failed to load profit & loss statement",
    {
      params: {
        preset: params?.preset ?? "this_month",
        from: params?.preset === "custom" ? params?.from : undefined,
        to: params?.preset === "custom" ? params?.to : undefined,
        basis: params?.basis ?? "accrual",
        format: "json",
      },
    }
  );
}

/** 7. List Expense Categories */
export async function getExpenseCategoriesAction(params?: {
  active_only?: boolean;
}): Promise<ActionResponse<{ items: ExpenseCategory[]; meta: PaginationMeta | null }>> {
  const res = await adminList<ExpenseCategory>(
    "GET_ADMIN_EXPENSE_CATEGORIES",
    "Failed to load expense categories",
    params?.active_only ? { active_only: 1 } : undefined
  );
  if (!res.success) return res;
  return {
    success: true,
    data: {
      items: res.data.data,
      meta: res.data.meta,
    },
  };
}

/** 8. Create Expense Category */
export async function createExpenseCategoryAction(body: {
  name: string;
  code?: string;
  color?: string | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}): Promise<ActionResponse<ExpenseCategory>> {
  return adminRequest<ExpenseCategory>(
    "POST",
    "CREATE_ADMIN_EXPENSE_CATEGORY",
    "Failed to create expense category",
    { body }
  );
}

/** 9. Update Expense Category */
export async function updateExpenseCategoryAction(
  id: number | string,
  body: {
    name?: string;
    code?: string;
    color?: string | null;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<ActionResponse<ExpenseCategory>> {
  return adminRequest<ExpenseCategory>(
    "PUT",
    "UPDATE_ADMIN_EXPENSE_CATEGORY",
    "Failed to update expense category",
    {
      pathParams: { id },
      body,
    }
  );
}

/** 10. Delete Expense Category */
export async function deleteExpenseCategoryAction(
  id: number | string
): Promise<ActionResponse<{ deleted: boolean }>> {
  return adminRequest<{ deleted: boolean }>(
    "DELETE",
    "DELETE_ADMIN_EXPENSE_CATEGORY",
    "Failed to delete expense category",
    {
      pathParams: { id },
    }
  );
}

/** 11. List Expenses (with summary & pagination) */
export async function getExpensesAction(params?: {
  preset?: AccountingPreset;
  from?: string;
  to?: string;
  expense_category_id?: number | string;
  payment_method?: ExpensePaymentMethod | string;
  search?: string;
  per_page?: number;
  page?: number;
}): Promise<
  ActionResponse<{
    items: ExpenseRecord[];
    summary: ExpenseListSummary;
    meta: PaginationMeta | null;
  }>
> {
  try {
    const query: Record<string, string | number | boolean | undefined> = {
      preset: params?.preset,
      from: params?.from,
      to: params?.to,
      expense_category_id: params?.expense_category_id || undefined,
      payment_method: params?.payment_method || undefined,
      search: params?.search || undefined,
      per_page: params?.per_page ?? 25,
      page: params?.page ?? 1,
    };
    const res = await serverGet<any>("GET_ADMIN_EXPENSES", { params: query });
    if (!res.success) {
      return {
        success: false,
        error: {
          message: res.error?.message || "Failed to load expenses",
          code: "GET_EXPENSES_FAILED",
          status: res.error?.status,
        },
      };
    }
    const raw = res.data;
    const payload = raw?.data ?? raw;
    const items: ExpenseRecord[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];
    const summary: ExpenseListSummary = payload?.summary ??
      raw?.summary ?? {
        count: items.length,
        total_amount: items.reduce((acc, item) => acc + (item.amount || 0), 0),
      };
    const metaSource = payload?.meta ?? raw?.meta ?? payload;
    const meta: PaginationMeta | null =
      metaSource && typeof metaSource.current_page === "number"
        ? {
            current_page: metaSource.current_page,
            last_page: metaSource.last_page ?? 1,
            per_page: metaSource.per_page ?? items.length,
            total: metaSource.total ?? items.length,
          }
        : null;

    return {
      success: true,
      data: { items, summary, meta },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/** 12. Create Expense */
export async function createExpenseAction(body: {
  expense_category_id: number;
  title: string;
  amount: number; // poisha
  incurred_on: string; // YYYY-MM-DD
  payment_method?: ExpensePaymentMethod;
  vendor?: string | null;
  receipt_url?: string | null;
  order_id?: number | null;
  notes?: string | null;
}): Promise<ActionResponse<ExpenseRecord>> {
  return adminRequest<ExpenseRecord>(
    "POST",
    "CREATE_ADMIN_EXPENSE",
    "Failed to create expense",
    { body }
  );
}

/** 13. Update Expense */
export async function updateExpenseAction(
  id: number | string,
  body: {
    expense_category_id?: number;
    title?: string;
    amount?: number; // poisha
    incurred_on?: string; // YYYY-MM-DD
    payment_method?: ExpensePaymentMethod;
    vendor?: string | null;
    receipt_url?: string | null;
    order_id?: number | null;
    notes?: string | null;
  }
): Promise<ActionResponse<ExpenseRecord>> {
  return adminRequest<ExpenseRecord>(
    "PUT",
    "UPDATE_ADMIN_EXPENSE",
    "Failed to update expense",
    {
      pathParams: { id },
      body,
    }
  );
}

/** 14. Delete Expense */
export async function deleteExpenseAction(
  id: number | string
): Promise<ActionResponse<{ deleted: boolean }>> {
  return adminRequest<{ deleted: boolean }>(
    "DELETE",
    "DELETE_ADMIN_EXPENSE",
    "Failed to delete expense",
    {
      pathParams: { id },
    }
  );
}
