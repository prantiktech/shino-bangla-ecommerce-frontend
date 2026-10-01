"use server";

import { adminList, adminRequest, QueryParams } from "./_request";

export interface PurchaseItem {
  variant_id: number;
  sku?: string;
  product?: string;
  quantity: number;
  unit_cost: number | null;
}

export interface Purchase {
  id: number;
  reference_no: string | null;
  supplier_name: string | null;
  received_on: string;
  note: string | null;
  total_cost: number;
  items?: PurchaseItem[];
  items_count?: number;
  recorded_by?: string | null;
  created_at: string;
}

export interface PurchasePayload {
  reference_no?: string | null;
  supplier_name?: string | null;
  received_on: string;
  note?: string | null;
  update_cost_price?: boolean;
  items: { variant_id: number; quantity: number; unit_cost?: number | null }[];
}

/** GET /admin/inventory/purchases (paginated, `q`) */
export async function getAdminPurchasesAction(params?: QueryParams) {
  return adminList<Purchase>("ADMIN_INVENTORY_PURCHASES", "Failed to load purchases", params);
}

/** GET /admin/inventory/purchases/{purchase} */
export async function getAdminPurchaseAction(id: number) {
  return adminRequest<Purchase>("GET", "ADMIN_INVENTORY_PURCHASE", "Failed to load purchase", { pathParams: { id } });
}

/** POST /admin/inventory/purchases — records a delivery and adds the stock */
export async function createAdminPurchaseAction(payload: PurchasePayload) {
  return adminRequest<Purchase>("POST", "ADMIN_INVENTORY_PURCHASES", "Failed to record purchase", { body: payload });
}
