import React from "react";
import { Metadata } from "next";
import {
  getAdminInventoryAction,
  getAdminInventorySummaryAction,
  getAdminStockMovementsAction,
} from "@/app/(admin)/actions/inventory";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { InventoryManagement } from "./_components/InventoryManagement";
import { StockStatus, MovementType } from "@/types/inventory";

export const metadata: Metadata = {
  title: "Inventory & Stock Control | Admin Portal",
  description: "Monitor variant stock levels, stocktake corrections, and stock movement logs.",
};

interface InventoryPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category_id?: string;
    sort?: string;
    page?: string;
    tab?: string;
    movement_variant_id?: string;
    movement_type?: string;
    from?: string;
    to?: string;
    movement_page?: string;
  }>;
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const resolvedParams = await searchParams;

  const q = resolvedParams.q || "";
  const status = (resolvedParams.status as StockStatus) || undefined;
  const categoryId = resolvedParams.category_id || "";
  const sort = (resolvedParams.sort as "stock" | "sku") || "stock";
  const page = Number(resolvedParams.page) || 1;

  const tab = resolvedParams.tab === "movements" ? "movements" : "inventory";
  const movementVariantId = resolvedParams.movement_variant_id || "";
  const movementType = (resolvedParams.movement_type as MovementType) || undefined;
  const from = resolvedParams.from || "";
  const to = resolvedParams.to || "";
  const movementPage = Number(resolvedParams.movement_page) || 1;

  // Parallel data fetching for summary, variants inventory list, movement history, and categories
  const [summaryRes, inventoryRes, movementsRes, categoriesRes] = await Promise.all([
    getAdminInventorySummaryAction(),
    getAdminInventoryAction({
      q: q || undefined,
      status,
      category_id: categoryId ? Number(categoryId) : undefined,
      sort,
      page,
      per_page: 25,
    }),
    getAdminStockMovementsAction({
      variant_id: movementVariantId ? Number(movementVariantId) : undefined,
      type: movementType,
      from: from || undefined,
      to: to || undefined,
      page: movementPage,
      per_page: 25,
    }),
    getCategoriesAction(),
  ]);

  const summary = summaryRes.success ? summaryRes.data : null;

  const inventoryData = inventoryRes.success && inventoryRes.data
    ? inventoryRes.data
    : { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };

  const movementsData = movementsRes.success && movementsRes.data
    ? movementsRes.data
    : { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };

  const categories = categoriesRes.success && Array.isArray(categoriesRes.data)
    ? categoriesRes.data.map((c: any) => ({
        id: Number(c.id),
        name: String(c.name),
      }))
    : [];

  return (
    <InventoryManagement
      summary={summary}
      inventoryData={inventoryData}
      movementsData={movementsData}
      categories={categories}
      currentTab={tab}
      initialFilters={{
        q,
        status: status || "",
        categoryId,
        sort,
        page,
        movementVariantId,
        movementType: movementType || "",
        from,
        to,
        movementPage,
      }}
    />
  );
}
