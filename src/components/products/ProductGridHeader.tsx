import React from "react";
import { LayoutGrid, StretchHorizontal } from "lucide-react";

interface ProductGridHeaderProps {
  totalProducts: number;
  displayedCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const ProductGridHeader: React.FC<ProductGridHeaderProps> = ({
  totalProducts,
  displayedCount,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
      {/* Product count */}
      <p className="text-xs sm:text-sm text-gray-600 font-medium">
        Showing <span className="font-bold text-gray-900">{displayedCount}</span> out of{" "}
        <span className="font-bold text-gray-900">{totalProducts}</span> products
      </p>

      {/* Right Controls: Sort & Grid View Toggles */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort products"
          className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="default">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="best_selling">Best selling</option>
          <option value="popular">Most popular</option>
          <option value="rating">Top rated</option>
          <option value="name">Name A–Z</option>
        </select>

        {/* View mode toggle buttons */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid View"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-white shadow-2xs"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/60"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            aria-label="Compact / List View"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-primary text-white shadow-2xs"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/60"
            }`}
          >
            <StretchHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
