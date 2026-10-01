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
  /** Facet data from GET /products/facets */
  brandOptions?: { slug: string; name: string; count?: number }[];
  selectedBrands?: string[];
  onToggleBrand?: (slug: string) => void;
  inStockOnly?: boolean;
  inStockCount?: number;
  onToggleInStock?: () => void;
  minRating?: number;
  ratingOptions?: { min: number; count?: number }[];
  onSelectRating?: (min: number) => void;
  priceCeiling?: number;
  optionGroups?: { id: number; name: string; values: { value: string; label: string; count?: number }[] }[];
  /** Selected option values as "typeId:value" keys. */
  selectedOptions?: string[];
  onToggleOption?: (key: string) => void;
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
  brandOptions = [],
  selectedBrands = [],
  onToggleBrand,
  inStockOnly = false,
  inStockCount,
  onToggleInStock,
  minRating = 0,
  ratingOptions = [],
  onSelectRating,
  priceCeiling = 100000,
  optionGroups = [],
  selectedOptions = [],
  onToggleOption,
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
    const val = Number(e.target.value) || priceCeiling;
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
          className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:text-primary border border-gray-200 hover:border-primary rounded-md transition-colors flex items-center gap-1 cursor-pointer"
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
            max={priceCeiling}
            step="500"
            value={maxPrice}
            onChange={handleRangeSlider}
            aria-label="Max price range slider"
            className="w-full h-1.5 bg-brand-100 rounded-lg appearance-none cursor-pointer accent-primary"
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
              className="w-full h-8 px-2.5 text-xs text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="w-full h-8 px-2.5 text-xs text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      {onToggleInStock && (
        <div className="p-4 rounded-xl border border-gray-200/90 shadow-2xs">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-xs font-bold text-gray-900">In stock only</span>
            <span className="flex items-center gap-2">
              {inStockCount !== undefined && <span className="text-[11px] text-gray-400">{inStockCount}</span>}
              <input type="checkbox" checked={inStockOnly} onChange={onToggleInStock} className="w-4 h-4 accent-[var(--color-primary)]" />
            </span>
          </label>
        </div>
      )}

      {/* Brands */}
      {onToggleBrand && brandOptions.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl border border-gray-200/90 shadow-2xs">
          <h4 className="text-xs font-bold text-gray-900">Brands</h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {brandOptions.map((b) => (
              <label key={b.slug} className="flex items-center justify-between gap-2 text-xs text-gray-700 cursor-pointer hover:text-primary">
                <span className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b.slug)}
                    onChange={() => onToggleBrand(b.slug)}
                    className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                  />
                  <span className="truncate">{b.name}</span>
                </span>
                {b.count !== undefined && <span className="text-[11px] text-gray-400">{b.count}</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Variant options (size, weight…) */}
      {onToggleOption &&
        optionGroups.map((g) => (
          <div key={g.id} className="space-y-3 p-4 rounded-xl border border-gray-200/90 shadow-2xs">
            <h4 className="text-xs font-bold text-gray-900">{g.name}</h4>
            <div className="flex flex-wrap gap-1.5">
              {g.values.map((v) => {
                const key = `${g.id}:${v.value}`;
                const active = selectedOptions.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggleOption(key)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 rounded-lg text-xs ring-1 transition-colors ${
                      active ? "bg-primary text-white ring-primary" : "bg-white text-gray-700 ring-gray-200 hover:ring-brand-300"
                    }`}
                  >
                    {v.label}
                    {v.count !== undefined && <span className={active ? "text-white/70" : "text-gray-400"}> ({v.count})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {/* Rating */}
      {onSelectRating && (
        <div className="space-y-2 p-4 rounded-xl border border-gray-200/90 shadow-2xs">
          <h4 className="text-xs font-bold text-gray-900">Customer rating</h4>
          {[4, 3, 2].map((min) => {
            const count = ratingOptions.find((r) => r.min === min)?.count;
            const active = minRating === min;
            return (
              <button
                key={min}
                type="button"
                onClick={() => onSelectRating(active ? 0 : min)}
                className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  active ? "bg-brand-50 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>
                  <span className="text-amber-400">{"★".repeat(min)}</span>
                  <span className="text-gray-300">{"★".repeat(5 - min)}</span> & up
                </span>
                {count !== undefined && <span className="text-[11px] text-gray-400">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

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
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">
                      <CategoryIcon name={category.icon || "Shield"} className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary" />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(category.slug);
                        }}
                        className={isCategoryActive ? "text-primary underline underline-offset-2" : ""}
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
                                  ? "text-primary font-bold"
                                  : "text-gray-600 group-hover:text-primary"
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
