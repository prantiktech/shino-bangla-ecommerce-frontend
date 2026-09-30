"use client";

import React, { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { ApiCategory } from "@/app/(user)/actions/categories";
import { CategoryIcon } from "@/components/common/CategoryIcon";

interface ProductFiltersSidebarProps {
  categories?: ApiCategory[];
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (subCategorySlug: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  onClearAll: () => void;
}

export const ProductFiltersSidebar: React.FC<ProductFiltersSidebarProps> = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  minPrice,
  maxPrice,
  onPriceChange,
  onClearAll,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    onPriceChange(val, maxPrice);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 100000;
    onPriceChange(minPrice, val);
  };

  const handleRangeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onPriceChange(minPrice, val);
  };

  return (
    <div className="w-full space-y-5 bg-white">
      {/* Filter Header: Filtering title + Clear all */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <SlidersHorizontal className="w-4 h-4 text-gray-700" />
          <span>Filtering</span>
        </div>
        <button
          onClick={onClearAll}
          className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:text-[#FF5B00] border border-gray-200 hover:border-[#FF5B00] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3 h-3" />
          <span>Clear all</span>
        </button>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3 p-4 rounded-xl border border-gray-200/90 shadow-2xs">
        <h4 className="text-xs font-bold text-gray-900">Price Range (BDT ৳)</h4>

        {/* Slider Visual Track */}
        <div className="relative py-2">
          <input
            type="range"
            min="0"
            max="100000"
            step="500"
            value={maxPrice}
            onChange={handleRangeSlider}
            aria-label="Max price range slider"
            className="w-full h-1.5 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-[#FF5B00]"
          />
        </div>

        {/* Min / Max Input Fields */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={minPrice}
              onChange={handleMinChange}
              placeholder="0"
              aria-label="Minimum price"
              className="w-full h-8 px-2.5 text-xs text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
            />
          </div>
          <span className="text-gray-400 text-xs">-</span>
          <div className="flex-1">
            <input
              type="number"
              value={maxPrice}
              onChange={handleMaxChange}
              placeholder="100000"
              aria-label="Maximum price"
              className="w-full h-8 px-2.5 text-xs text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
            />
          </div>
        </div>
      </div>

      {/* Categories Accordion Tree */}
      {categories.length > 0 && (
        <div className="p-4 rounded-xl border border-gray-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900">Categories</h4>
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3 pt-1">
            {categories.map((category) => {
              const catIdStr = String(category.id);
              const isExpanded = expandedCategories[catIdStr] ?? true;
              const isCategoryActive = selectedCategory === category.slug;

              return (
                <div key={category.id} className="space-y-1.5">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(catIdStr)}
                    className="flex items-center justify-between py-1 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 group-hover:text-[#FF5B00] transition-colors">
                      <CategoryIcon name={category.icon || "Shield"} className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#FF5B00]" />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(category.slug);
                        }}
                        className={isCategoryActive ? "text-[#FF5B00] underline underline-offset-2" : ""}
                      >
                        {category.name}
                      </span>
                    </div>
                    {category.children && category.children.length > 0 && (
                      <button className="text-gray-400 hover:text-gray-600 p-0.5">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Subcategories Tree Structure */}
                  {isExpanded && category.children && category.children.length > 0 && (
                    <div className="pl-4 border-l border-gray-200 ml-2 space-y-1 py-1">
                      {category.children.map((sub, idx, arr) => {
                        const isLast = idx === arr.length - 1;
                        const isSubActive = selectedSubCategory === sub.slug;

                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              onSelectCategory(category.slug);
                              onSelectSubCategory(sub.slug);
                            }}
                            className="flex items-center gap-2 py-0.5 text-[11px] cursor-pointer group relative"
                          >
                            <span className="text-gray-300 font-mono text-xs select-none">
                              {isLast ? "└─" : "├─"}
                            </span>
                            <span
                              className={`transition-colors truncate ${
                                isSubActive
                                  ? "text-[#FF5B00] font-bold"
                                  : "text-gray-600 group-hover:text-[#FF5B00]"
                              }`}
                            >
                              {sub.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
