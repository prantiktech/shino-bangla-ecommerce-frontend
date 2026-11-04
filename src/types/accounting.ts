/**
 * Accounting Module Types (ACCOUNTING_API.md)
 * Every money field is integer poisha (100 = ৳1.00).
 * Every rate/margin/change field ending in `_bp` is basis points (100 bp = 1%).
 */

export type AccountingPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_7_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "all_time"
  | "custom";

export type AccountingBasis = "accrual" | "cash";

export type AccountingGroupBy = "day" | "week" | "month" | "year";

export type AccountingBreakdownDimension =
  | "product"
  | "category"
  | "brand"
  | "payment_method"
  | "courier"
  | "source"
  | "customer_group"
  | "expense_category";

export type AccountingBreakdownSort =
  | "profit"
  | "revenue"
  | "cost"
  | "margin"
  | "quantity";

export type ExpensePaymentMethod =
  | "cash"
  | "bank"
  | "bkash"
  | "nagad"
  | "rocket"
  | "card"
  | "other";

export interface AccountingPeriod {
  preset: AccountingPreset | string;
  label: string;
  from: string;
  to: string;
  previous_from?: string | null;
  previous_to?: string | null;
}

export interface AccountingCardValue {
  label: string;
  amount: number; // poisha
  previous_amount?: number; // poisha
  change_amount?: number; // poisha
  change_bp?: number | null; // basis points (e.g. 1250 = +12.5%, null when previous was 0)
  direction?: "up" | "down" | "flat";
}

export interface AccountingSummaryResponse {
  period: AccountingPeriod;
  basis: AccountingBasis;
  cards: {
    gross_sales: AccountingCardValue;
    discounts: AccountingCardValue;
    returns_and_refunds: AccountingCardValue;
    net_sales: AccountingCardValue;
    shipping_Subsidy?: AccountingCardValue;
    shipping_subsidy?: AccountingCardValue;
    cost_of_goods_sold: AccountingCardValue;
    gross_profit: AccountingCardValue;
    courier_fees: AccountingCardValue;
    other_expenses: AccountingCardValue;
    operating_expenses: AccountingCardValue;
    net_profit: AccountingCardValue;
    vat_collected: AccountingCardValue;
  };
  rates: {
    gross_margin_bp: number;
    net_margin_bp: number;
    expense_ratio_bp: number;
    discount_rate_bp: number;
    return_rate_bp: number;
  };
  counts: {
    orders: number;
    items_sold: number;
    average_order_value: number;
    returned_orders: number;
    refund_count: number;
    expense_entries: number;
  };
  warnings: {
    items_without_cost: number;
    items_without_cost_revenue: number;
    shipments_without_courier_fee: number;
    note: string | null;
  };
}

export interface AccountingTimelinePoint {
  bucket: string;
  label: string;
  orders: number;
  gross_sales: number;
  discounts: number;
  returns: number;
  net_sales: number;
  cogs: number;
  gross_profit: number;
  courier_fees: number;
  other_expenses: number;
  operating_expenses: number;
  net_profit: number;
  vat_collected: number;
}

export interface AccountingTimelineResponse {
  period: AccountingPeriod;
  basis: AccountingBasis;
  group_by: AccountingGroupBy;
  points: AccountingTimelinePoint[];
  totals: {
    orders: number;
    gross_sales: number;
    discounts: number;
    returns: number;
    net_sales: number;
    cogs: number;
    gross_profit: number;
    courier_fees: number;
    other_expenses: number;
    operating_expenses: number;
    net_profit: number;
    vat_collected: number;
  };
}

export interface AccountingBreakdownRow {
  key: string | number;
  name: string;
  code?: string | null;
  color?: string | null;
  orders?: number;
  shipments?: number;
  delivered?: number;
  returned?: number;
  entries?: number;
  quantity?: number;
  gross_sales?: number;
  discounts?: number;
  returns?: number;
  net_sales?: number;
  cogs?: number;
  gross_profit?: number;
  margin_bp?: number;
  items_without_cost?: number;
  collected?: number;
  due?: number;
  collection_rate_bp?: number;
  courier_fees?: number;
  shipping_charged?: number;
  shipping_subsidy?: number;
  cod_collected?: number;
  cod_pending?: number;
  amount?: number;
  share_bp: number;
}

export interface AccountingBreakdownResponse {
  period: AccountingPeriod;
  basis: AccountingBasis;
  dimension: AccountingBreakdownDimension;
  sort: AccountingBreakdownSort;
  rows: AccountingBreakdownRow[];
  others: AccountingBreakdownRow | null;
  totals: Record<string, number>;
}

export interface AccountingCollectionResponse {
  period: AccountingPeriod;
  collected: {
    total: number;
    by_method: Array<{
      method: string;
      label: string;
      payments: number;
      amount: number;
    }>;
  };
  refunded_cash: number;
  net_cash_collected: number;
  cod: {
    expected: number;
    delivered_collected: number;
    in_transit_with_courier: number;
    awaiting_handover: number;
    returned_uncollected: number;
    courier_fees_deducted: number;
    net_expected_from_couriers: number;
  };
  outstanding: {
    orders: number;
    amount: number;
    by_status: Array<{
      status: string;
      orders: number;
      amount_due: number;
    }>;
  };
}

export interface AccountingStockResponse {
  current_stock: {
    active_variants: number;
    in_stock_variants: number;
    out_of_stock_variants: number;
    variants_without_cost: number;
    total_units: number;
    cost_value: number;
    retail_value: number;
    potential_profit: number;
    potential_margin_bp: number;
  };
  purchases: {
    all_time_total: number;
    outstanding_to_suppliers: number;
    recent: Array<{
      id: number;
      reference_number: string;
      supplier_name: string | null;
      status: string;
      total: number;
      paid_amount: number;
      due_amount: number;
      purchased_at: string | null;
    }>;
  };
  top_stock_value: Array<{
    variant_id: number;
    product_id: number;
    product_name: string;
    sku: string;
    title: string | null;
    stock: number;
    cost_price: number;
    selling_price: number;
    cost_value: number;
    retail_value: number;
    potential_profit: number;
  }>;
}

export interface ProfitAndLossLine {
  code: string;
  section: "revenue" | "cogs" | "profit" | "expenses" | "tax";
  label: string;
  amount: number;
  is_deduction?: boolean;
  is_total?: boolean;
}

export interface ProfitAndLossResponse {
  period: AccountingPeriod;
  basis: AccountingBasis;
  currency: string;
  unit: string;
  lines: ProfitAndLossLine[];
  expenses_by_category: Array<{
    code: string;
    name: string;
    color?: string | null;
    entries: number;
    amount: number;
    share_bp: number;
  }>;
  warnings: {
    items_without_cost: number;
    items_without_cost_revenue: number;
    shipments_without_courier_fee: number;
    note: string | null;
  };
}

export interface ExpenseCategory {
  id: number;
  name: string;
  code: string;
  color: string | null;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  expenses_count?: number;
  expenses_sum_amount?: number;
  is_deleted?: boolean;
}

export interface ExpenseRecord {
  id: number;
  reference_number: string;
  title: string;
  amount: number; // poisha
  incurred_on: string; // YYYY-MM-DD
  payment_method: ExpensePaymentMethod;
  vendor: string | null;
  receipt_url: string | null;
  notes: string | null;
  category: {
    id: number;
    name: string;
    code: string;
    color: string | null;
    is_deleted?: boolean;
  } | null;
  order?: {
    id: number;
    order_number: string;
  } | null;
  creator?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseListSummary {
  count: number;
  total_amount: number;
}
