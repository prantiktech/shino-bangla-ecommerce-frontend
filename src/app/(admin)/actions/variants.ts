"use server";

import { adminList } from "./_request";

export interface VariantOption {
  variant_id: number;
  sku: string;
  label: string | null;
  product: { id: number; name: string; status?: string };
  stock: number;
  cost_price: number | null;
  is_active: boolean;
}

/** Variant search for pickers (purchases, flash sales), backed by GET /admin/inventory?q= */
export async function searchAdminVariantsAction(q: string) {
  return adminList<VariantOption>("GET_ADMIN_INVENTORY", "Failed to search products", { q, per_page: 15 });
}
