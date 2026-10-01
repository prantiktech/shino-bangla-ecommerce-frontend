export type StockStatus = 'out' | 'low' | 'in';

export interface InventoryProductSummary {
  id: number;
  name: string;
  status: string;
}

export interface InventoryItemResource {
  variant_id: number;
  sku: string;
  label: string | null;
  product: InventoryProductSummary;
  stock: number;
  low_stock_threshold: number | null;
  effective_threshold: number;
  stock_status: StockStatus;
  cost_price: number | null;
  is_active: boolean;
}

export interface InventorySummary {
  variants: number;
  units_in_stock: number;
  stock_value: number;
  uncosted_variants: number;
  low_stock: number;
  out_of_stock: number;
}

export type MovementType =
  | 'initial'
  | 'purchase'
  | 'adjustment'
  | 'import'
  | 'sale'
  | 'cancel_release'
  | 'return';

export interface MovementReference {
  type: string;
  id: number;
}

export interface MovementUser {
  id: number;
  name: string;
}

export interface StockMovementResource {
  id: number;
  variant_id: number;
  sku: string;
  type: MovementType | string;
  quantity: number;
  balance_after: number;
  reference: MovementReference | null;
  note: string | null;
  user: MovementUser | null;
  created_at: string;
}

export interface PaginationLinks {
  first?: string | null;
  last?: string | null;
  prev?: string | null;
  next?: string | null;
}

export interface PaginationMeta {
  current_page?: number;
  from?: number | null;
  last_page?: number;
  path?: string;
  per_page?: number;
  to?: number | null;
  total?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
}

export interface StockAdjustmentPayload {
  variant_id: number;
  mode: 'set' | 'add';
  quantity: number;
  note: string;
}

export interface InventoryFilterParams {
  q?: string;
  status?: 'out' | 'low' | 'in';
  category_id?: number | string;
  sort?: 'stock' | 'sku';
  page?: number;
  per_page?: number;
}

export interface StockMovementsFilterParams {
  variant_id?: number | string;
  type?: MovementType | string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}
