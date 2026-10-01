"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  Layers,
  AlertTriangle,
  AlertOctagon,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  PackageCheck,
  Calendar,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import {
  InventoryItemResource,
  InventorySummary,
  StockMovementResource,
  StockStatus,
  MovementType,
  PaginatedResponse,
} from "@/types/inventory";
import { adjustAdminInventoryAction } from "@/app/(admin)/actions/inventory";
import { formatPoisha, poishaToTaka } from "@/lib/utils/money";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface CategoryOption {
  id: number;
  name: string;
}

interface InventoryManagementProps {
  summary: InventorySummary | null;
  inventoryData: PaginatedResponse<InventoryItemResource>;
  movementsData: PaginatedResponse<StockMovementResource>;
  categories: CategoryOption[];
  currentTab: "inventory" | "movements";
  initialFilters: {
    q: string;
    status: string;
    categoryId: string;
    sort: string;
    page: number;
    movementVariantId: string;
    movementType: string;
    from: string;
    to: string;
    movementPage: number;
  };
}

export function InventoryManagement({
  summary,
  inventoryData,
  movementsData,
  categories,
  currentTab: initialTab,
  initialFilters,
}: InventoryManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"inventory" | "movements">(initialTab);

  // Filter local states
  const [searchQuery, setSearchQuery] = useState(initialFilters.q);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilters.status);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters.categoryId);
  const [selectedSort, setSelectedSort] = useState<string>(initialFilters.sort);

  // Movements filter states
  const [movementVariantId, setMovementVariantId] = useState(initialFilters.movementVariantId);
  const [movementType, setMovementType] = useState(initialFilters.movementType);
  const [fromDate, setFromDate] = useState(initialFilters.from);
  const [toDate, setToDate] = useState(initialFilters.to);

  // Modal State for Stock Adjustment
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<InventoryItemResource | null>(null);
  const [adjustMode, setAdjustMode] = useState<"set" | "add">("set");
  const [adjustQuantity, setAdjustQuantity] = useState<string>("0");
  const [adjustNote, setAdjustNote] = useState<string>("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Helper to update URL params
  const updateUrlParams = (updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleTabChange = (tab: "inventory" | "movements") => {
    setActiveTab(tab);
    updateUrlParams({ tab });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ q: searchQuery, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    const newStatus = selectedStatus === status ? "" : status;
    setSelectedStatus(newStatus);
    updateUrlParams({ status: newStatus, page: 1 });
  };

  const handleCategoryFilter = (catId: string) => {
    setSelectedCategory(catId);
    updateUrlParams({ category_id: catId, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    updateUrlParams({ sort, page: 1 });
  };

  const handleMovementsFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({
      tab: "movements",
      movement_variant_id: movementVariantId,
      movement_type: movementType,
      from: fromDate,
      to: toDate,
      movement_page: 1,
    });
  };

  const resetInventoryFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedCategory("");
    setSelectedSort("stock");
    updateUrlParams({
      q: "",
      status: "",
      category_id: "",
      sort: "stock",
      page: 1,
    });
  };

  const resetMovementsFilters = () => {
    setMovementVariantId("");
    setMovementType("");
    setFromDate("");
    setToDate("");
    updateUrlParams({
      tab: "movements",
      movement_variant_id: "",
      movement_type: "",
      from: "",
      to: "",
      movement_page: 1,
    });
  };

  // Open Adjust Modal
  const openAdjustmentModal = (variant: InventoryItemResource) => {
    setSelectedVariant(variant);
    setAdjustMode("set");
    setAdjustQuantity(String(variant.stock));
    setAdjustNote("");
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  // Handle Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    setAdjustError(null);
    const qty = Number(adjustQuantity);

    if (isNaN(qty) || qty < 0 || qty > 1000000) {
      setAdjustError("Please specify a valid quantity between 0 and 1,000,000.");
      return;
    }

    if (!adjustNote.trim()) {
      setAdjustError("Please provide a reason or audit note for this adjustment.");
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await adjustAdminInventoryAction({
        variant_id: selectedVariant.variant_id,
        mode: adjustMode,
        quantity: qty,
        note: adjustNote.trim(),
      });

      if (res.success && res.data) {
        setFeedbackSuccess(
          `Stock for ${selectedVariant.sku} updated successfully to ${res.data.stock} units!`
        );
        setIsAdjustModalOpen(false);
        router.refresh();
      } else {
        const errorMsg =
          !res.success && res.error
            ? res.error.message || "Failed to adjust stock. (Stock cannot be reduced below zero)"
            : "Failed to adjust stock.";
        setAdjustError(errorMsg);
      }
    } catch (err: any) {
      setAdjustError(err.message || "An unexpected error occurred.");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Switch to movements tab for a specific variant
  const inspectVariantMovements = (variant: InventoryItemResource) => {
    setMovementVariantId(String(variant.variant_id));
    setActiveTab("movements");
    updateUrlParams({
      tab: "movements",
      movement_variant_id: String(variant.variant_id),
      movement_page: 1,
    });
  };

  // Calculate projected stock in adjustment modal
  const currentVariantStock = selectedVariant?.stock ?? 0;
  const numInputQty = Number(adjustQuantity) || 0;
  const projectedStock =
    adjustMode === "set" ? numInputQty : currentVariantStock + numInputQty;
  const stockDelta = projectedStock - currentVariantStock;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Inventory & Stock Control
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Live multi-variant warehouse tracking, stocktake adjustments, and real-time movement history.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Success Notification */}
      {feedbackSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded-md text-emerald-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards (GET /api/v1/admin/inventory/summary) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Units on hand */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Units On Hand
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {summary.units_in_stock.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">units</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Total physical warehouse items
            </p>
          </div>

          {/* 2. Total Variants */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Variants
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {summary.variants.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">SKUs</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Tracked product SKU entries
            </p>
          </div>

          {/* 3. Stock Value at Cost */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Stock Value (Cost)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {formatPoisha(summary.stock_value, false)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
              {summary.uncosted_variants > 0 ? (
                <span className="text-amber-600 font-semibold" title="Stock value counts only variants with cost price">
                  ⚠️ {summary.uncosted_variants} uncosted variant{summary.uncosted_variants > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">All variants costed</span>
              )}
            </div>
          </div>

          {/* 4. Low Stock Alerts */}
          <div
            onClick={() => {
              setActiveTab("inventory");
              handleStatusFilter("low");
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedStatus === "low" && activeTab === "inventory"
                ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-white border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Low Stock
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">
                {summary.low_stock.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-amber-600/80">items</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700/80 font-medium">
              Click to view below threshold
            </p>
          </div>

          {/* 5. Out of Stock Alerts */}
          <div
            onClick={() => {
              setActiveTab("inventory");
              handleStatusFilter("out");
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedStatus === "out" && activeTab === "inventory"
                ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/20"
                : "bg-white border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Out of Stock
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">
                {summary.out_of_stock.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-rose-600/80">items</span>
            </div>
            <p className="mt-1 text-[11px] text-rose-700/80 font-medium">
              Click to view depleted stock
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleTabChange("inventory")}
              className={`pb-4 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "inventory"
                  ? "text-[#FF5B00] border-b-2 border-[#FF5B00]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Variant Stock Levels</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "inventory"
                    ? "bg-[#FF5B00]/10 text-[#FF5B00]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {inventoryData.meta?.total ?? inventoryData.data.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange("movements")}
              className={`pb-4 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "movements"
                  ? "text-[#FF5B00] border-b-2 border-[#FF5B00]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Stock Movements & History</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "movements"
                    ? "bg-[#FF5B00]/10 text-[#FF5B00]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {movementsData.meta?.total ?? movementsData.data.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Inventory List */}
        {activeTab === "inventory" && (
          <div className="p-6 space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by SKU or product name..."
                  className="w-full pl-9 pr-20 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Filter Buttons */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatusFilter("")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatus === ""
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilter("in")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatus === "in"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilter("low")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatus === "low"
                        ? "bg-amber-500 text-white"
                        : "text-slate-600 hover:text-amber-700"
                    }`}
                  >
                    Low Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilter("out")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatus === "out"
                        ? "bg-rose-600 text-white"
                        : "text-slate-600 hover:text-rose-700"
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>

                {/* Category Dropdown */}
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Sort Option */}
                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20"
                >
                  <option value="stock">Sort: Lowest Stock First</option>
                  <option value="sku">Sort: SKU (A-Z)</option>
                </select>

                {(searchQuery || selectedStatus || selectedCategory || selectedSort !== "stock") && (
                  <button
                    onClick={resetInventoryFilters}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
                    title="Reset filters"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Variant & SKU</th>
                    <th className="px-5 py-3.5">Product Title</th>
                    <th className="px-5 py-3.5">Stock Level</th>
                    <th className="px-5 py-3.5">Threshold</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Cost Price</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {inventoryData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No variant inventory items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    inventoryData.data.map((item) => {
                      const isOutOfStock = item.stock <= 0 || item.stock_status === "out";
                      const isLowStock = !isOutOfStock && item.stock_status === "low";

                      return (
                        <tr
                          key={item.variant_id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isOutOfStock
                              ? "bg-rose-50/20"
                              : isLowStock
                              ? "bg-amber-50/20"
                              : ""
                          }`}
                        >
                          {/* Variant & SKU */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {item.sku}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: #{item.variant_id}
                                </span>
                                {item.label && (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {item.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Parent Product */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 max-w-xs truncate">
                                {item.product?.name || "Unnamed Product"}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Product #{item.product?.id}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                    item.product?.status === "active"
                                      ? "text-emerald-700 bg-emerald-50"
                                      : "text-slate-500 bg-slate-100"
                                  }`}
                                >
                                  {item.product?.status || "active"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-black font-mono ${
                                  isOutOfStock
                                    ? "text-rose-600"
                                    : isLowStock
                                    ? "text-amber-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.stock}
                              </span>
                              <span className="text-[11px] text-slate-400">units</span>
                            </div>
                          </td>

                          {/* Threshold */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-mono text-slate-700">
                                {item.effective_threshold} units
                              </span>
                              {item.low_stock_threshold !== null && (
                                <span className="text-[10px] text-slate-400">
                                  (custom: {item.low_stock_threshold})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-3.5">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertOctagon className="w-3 h-3" />
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <PackageCheck className="w-3 h-3" />
                                In Stock
                              </span>
                            )}
                          </td>

                          {/* Cost Price */}
                          <td className="px-5 py-3.5">
                            {item.cost_price !== null && item.cost_price !== undefined ? (
                              <span className="font-semibold text-slate-900">
                                {formatPoisha(item.cost_price)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Not set
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAdjustmentModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                title="Adjust Stock (Stocktake/Damage/Loss)"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                Adjust
                              </button>
                              <button
                                onClick={() => inspectVariantMovements(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                                title="View Movement History"
                              >
                                <History className="w-3 h-3" />
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {inventoryData.meta && (inventoryData.meta.last_page ?? 1) > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Page <strong className="text-slate-900">{inventoryData.meta.current_page ?? 1}</strong> of{" "}
                  <strong className="text-slate-900">{inventoryData.meta.last_page ?? 1}</strong> (
                  {inventoryData.meta.total ?? 0} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={(inventoryData.meta.current_page ?? 1) <= 1}
                    onClick={() =>
                      updateUrlParams({ page: (inventoryData.meta?.current_page || 2) - 1 })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={(inventoryData.meta.current_page ?? 1) >= (inventoryData.meta.last_page ?? 1)}
                    onClick={() =>
                      updateUrlParams({ page: (inventoryData.meta?.current_page || 1) + 1 })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Stock Movements / History */}
        {activeTab === "movements" && (
          <div className="p-6 space-y-6">
            {/* Movements Filter Bar */}
            <form
              onSubmit={handleMovementsFilterSubmit}
              className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80"
            >
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Variant ID Filter */}
                <div className="relative w-36">
                  <input
                    type="number"
                    value={movementVariantId}
                    onChange={(e) => setMovementVariantId(e.target.value)}
                    placeholder="Variant ID..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20"
                  />
                </div>

                {/* Movement Type Dropdown */}
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20"
                >
                  <option value="">All Movement Types</option>
                  <option value="initial">Initial</option>
                  <option value="purchase">Purchase (Inbound)</option>
                  <option value="adjustment">Adjustment (Stocktake)</option>
                  <option value="import">Import</option>
                  <option value="sale">Sale (Fulfillment)</option>
                  <option value="cancel_release">Cancel Release</option>
                  <option value="return">Customer Return</option>
                </select>

                {/* Date Range: From */}
                <div className="w-36">
                  <DatePicker
                    date={fromDate ? new Date(fromDate) : null}
                    onChange={(d) => setFromDate(d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="From Date"
                  />
                </div>

                {/* Date Range: To */}
                <div className="w-36">
                  <DatePicker
                    date={toDate ? new Date(toDate) : null}
                    onChange={(d) => setToDate(d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="To Date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Apply Filters
                </button>
                {(movementVariantId || movementType || fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={resetMovementsFilters}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Movements Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Log ID / Date</th>
                    <th className="px-5 py-3.5">SKU & Variant</th>
                    <th className="px-5 py-3.5">Movement Type</th>
                    <th className="px-5 py-3.5">Quantity Change</th>
                    <th className="px-5 py-3.5">Balance After</th>
                    <th className="px-5 py-3.5">Reference & Audit Note</th>
                    <th className="px-5 py-3.5">Staff User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {movementsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No stock movement logs found for this filter.
                      </td>
                    </tr>
                  ) : (
                    movementsData.data.map((m) => {
                      const isPositive = m.quantity > 0;
                      const isNegative = m.quantity < 0;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Log ID & Date */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-mono text-slate-400 text-[11px]">
                                #{m.id}
                              </span>
                              <span className="text-[11px] text-slate-600 font-semibold mt-0.5">
                                {m.created_at
                                  ? new Date(m.created_at).toLocaleString("en-BD", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </span>
                            </div>
                          </td>

                          {/* SKU & Variant */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-900">
                                {m.sku}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Variant ID: #{m.variant_id}
                              </span>
                            </div>
                          </td>

                          {/* Movement Type Badge */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                m.type === "purchase" || m.type === "initial" || m.type === "import"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : m.type === "sale"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : m.type === "adjustment"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : m.type === "return" || m.type === "cancel_release"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>

                          {/* Quantity Delta */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`font-mono font-black text-sm flex items-center gap-1 ${
                                isPositive
                                  ? "text-emerald-600"
                                  : isNegative
                                  ? "text-rose-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : isNegative ? (
                                <TrendingDown className="w-3.5 h-3.5" />
                              ) : null}
                              {isPositive ? `+${m.quantity}` : m.quantity}
                            </span>
                          </td>

                          {/* Balance After */}
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {m.balance_after} units
                            </span>
                          </td>

                          {/* Reference & Note */}
                          <td className="px-5 py-3.5 max-w-xs">
                            <div className="flex flex-col">
                              {m.reference && (
                                <span className="font-mono text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded w-fit mb-0.5">
                                  Ref: {m.reference.type} #{m.reference.id}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-700 truncate" title={m.note || ""}>
                                {m.note || "No audit note provided"}
                              </span>
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-5 py-3.5">
                            <span className="text-[11px] font-semibold text-slate-800">
                              {m.user?.name || "System"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {movementsData.meta && (movementsData.meta.last_page ?? 1) > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Page <strong className="text-slate-900">{movementsData.meta.current_page ?? 1}</strong> of{" "}
                  <strong className="text-slate-900">{movementsData.meta.last_page ?? 1}</strong> (
                  {movementsData.meta.total ?? 0} total movement logs)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={(movementsData.meta.current_page ?? 1) <= 1}
                    onClick={() =>
                      updateUrlParams({
                        tab: "movements",
                        movement_page: (movementsData.meta?.current_page || 2) - 1,
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={(movementsData.meta.current_page ?? 1) >= (movementsData.meta.last_page ?? 1)}
                    onClick={() =>
                      updateUrlParams({
                        tab: "movements",
                        movement_page: (movementsData.meta?.current_page || 1) + 1,
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal (POST /api/v1/admin/inventory/adjustments) */}
      {isAdjustModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !adjustSubmitting && setIsAdjustModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Correct Stock Adjustment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stocktake count, damaged item, loss, or restock
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={adjustSubmitting}
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {adjustError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{adjustError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-5">
              {/* Variant Info Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Product / Variant
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                    {selectedVariant.product?.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    SKU: <strong>{selectedVariant.sku}</strong> ({selectedVariant.label || "Default"})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Stock
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {selectedVariant.stock} <span className="text-xs font-normal text-slate-500">units</span>
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Adjustment Mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustMode("set");
                      setAdjustQuantity(String(selectedVariant.stock));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      adjustMode === "set"
                        ? "bg-[#FF5B00]/10 border-[#FF5B00] text-[#FF5B00] ring-1 ring-[#FF5B00]"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">
                      Stocktake (set)
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Set absolute exact stock count
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustMode("add");
                      setAdjustQuantity("1");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      adjustMode === "add"
                        ? "bg-[#FF5B00]/10 border-[#FF5B00] text-[#FF5B00] ring-1 ring-[#FF5B00]"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">
                      Add Stock (add)
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Increment stock by quantity
                    </span>
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {adjustMode === "set" ? "New Total Count" : "Units to Add"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Allowed: 0 to 1,000,000
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] focus:bg-white"
                  placeholder="0"
                />
              </div>

              {/* Projection Result Preview */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span>Calculated Result:</span>
                <span className="font-mono">
                  {currentVariantStock} ➔ <strong className="text-indigo-950 font-black">{projectedStock} units</strong>{" "}
                  ({stockDelta >= 0 ? `+${stockDelta}` : stockDelta})
                </span>
              </div>

              {/* Audit Note (Required, <= 500 chars) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Audit Note / Reason <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      adjustNote.length > 500 ? "text-rose-600 font-bold" : "text-slate-400"
                    }`}
                  >
                    {adjustNote.length}/500
                  </span>
                </div>
                <textarea
                  required
                  maxLength={500}
                  rows={3}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Explain reason for change: e.g., 'Monthly physical stocktake count', 'Damaged in transit', or 'Supplier delivery restock'..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={adjustSubmitting}
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting || adjustNote.trim().length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {adjustSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Adjustment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
