"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { ProductBreadcrumb } from "@/components/products/ProductBreadcrumb";
import { ProductFiltersSidebar } from "@/components/products/ProductFiltersSidebar";
import { ProductGridHeader } from "@/components/products/ProductGridHeader";
import { ProductPagination } from "@/components/products/ProductPagination";
import { ProductCard } from "@/components/common/ProductCard";
import { Product } from "@/types";
import { ApiCategory } from "@/app/(user)/actions/categories";

interface ProductsViewProps {
  products: Product[];
  totalCount: number;
  currentPage: number;
  lastPage: number;
  categories: ApiCategory[];
  initialFilters: {
    category?: string;
    subCategory?: string;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    brands?: string[];
    rating?: number;
    inStock?: boolean;
    options?: string[];
  };
  /** Path that filter changes navigate to; defaults to the current page. */
  basePath?: string;
  heading?: { title: string; subtitle?: string };
  facets?: {
    brands: { slug: string; name: string; count?: number }[];
    ratings: { min: number; count?: number }[];
    inStock?: number;
    priceCeiling: number;
    options?: { id: number; name: string; values: { value: string; label: string; count?: number }[] }[];
  };
}

export function ProductsView({
  products,
  totalCount,
  currentPage,
  lastPage,
  categories,
  initialFilters,
  basePath,
  heading,
  facets,
}: ProductsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = basePath || pathname || "/products";
  const priceCeiling = facets?.priceCeiling ?? 100000;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters.category || "");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialFilters.subCategory || "");
  const [minPrice, setMinPrice] = useState<number>(initialFilters.minPrice || 0);
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters.maxPrice || priceCeiling);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters.brands ?? []);
  const [minRating, setMinRating] = useState<number>(initialFilters.rating ?? 0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(!!initialFilters.inStock);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialFilters.options ?? []);
  const [sortBy, setSortBy] = useState<string>(initialFilters.sort || "default");

  // Sync state changes with URL to trigger server-side re-fetching
  const updateUrlParams = (updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === "" || val === "default") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    // Reset to page 1 on filter change unless page itself is updated
    if (!updates.page) {
      params.delete("page");
    }
    const qs = params.toString();
    router.push(qs ? `${target}?${qs}` : target);
  };

  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedSubCategory ? 1 : 0) +
    (minPrice > 0 || maxPrice < priceCeiling ? 1 : 0) +
    selectedBrands.length +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    selectedOptions.length;

  const handleToggleOption = (key: string) => {
    const next = selectedOptions.includes(key) ? selectedOptions.filter((k) => k !== key) : [...selectedOptions, key];
    setSelectedOptions(next);
    updateUrlParams({ opt: next.join(",") || undefined });
  };

  const handleToggleBrand = (slug: string) => {
    const next = selectedBrands.includes(slug) ? selectedBrands.filter((b) => b !== slug) : [...selectedBrands, slug];
    setSelectedBrands(next);
    updateUrlParams({ brand: next.join(",") || undefined });
  };

  const handleSelectRating = (min: number) => {
    setMinRating(min);
    updateUrlParams({ rating: min > 0 ? min : undefined });
  };

  const handleToggleInStock = () => {
    const next = !inStockOnly;
    setInStockOnly(next);
    updateUrlParams({ inStock: next ? "true" : undefined });
  };

  const handleSelectCategory = (slug: string) => {
    const newSlug = selectedCategory === slug ? "" : slug;
    setSelectedCategory(newSlug);
    setSelectedSubCategory("");
    updateUrlParams({ category: newSlug, subCategory: undefined });
  };

  const handleSelectSubCategory = (subSlug: string) => {
    const newSub = selectedSubCategory === subSlug ? "" : subSlug;
    setSelectedSubCategory(newSub);
    updateUrlParams({ subCategory: newSub });
  };

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    updateUrlParams({ minPrice: min > 0 ? min : undefined, maxPrice: max < priceCeiling ? max : undefined });
  };

  const handleClearAll = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setMinPrice(0);
    setMaxPrice(priceCeiling);
    setSelectedBrands([]);
    setMinRating(0);
    setInStockOnly(false);
    setSelectedOptions([]);
    setSortBy("default");
    router.push(target);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateUrlParams({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  return (
    <div className="min-h-screen bg-canvas pb-16">
      {/* Breadcrumb Navigation */}
      <ProductBreadcrumb
        categoryName={selectedCategory ? selectedCategory.replace(/-/g, " ") : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
        {heading && (
          <header className="mb-5">
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{heading.title}</h1>
            {heading.subtitle && <p className="mt-1 text-sm text-slate-500">{heading.subtitle}</p>}
          </header>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 xl:gap-8">
          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="product-filters"
            className="lg:hidden flex items-center justify-between w-full h-11 px-4 bg-white rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-slate-700"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filters
              {activeFilterCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold inline-flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Left Column: Filter Sidebar */}
          <aside id="product-filters" className={`lg:col-span-1 ${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="lg:sticky lg:top-36 bg-white p-4 rounded-2xl ring-1 ring-slate-200/70 shadow-card">
              <ProductFiltersSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                selectedSubCategory={selectedSubCategory}
                onSelectSubCategory={handleSelectSubCategory}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={handlePriceChange}
                onClearAll={handleClearAll}
                priceCeiling={priceCeiling}
                brandOptions={facets?.brands}
                selectedBrands={selectedBrands}
                onToggleBrand={facets ? handleToggleBrand : undefined}
                inStockOnly={inStockOnly}
                inStockCount={facets?.inStock}
                onToggleInStock={facets ? handleToggleInStock : undefined}
                minRating={minRating}
                ratingOptions={facets?.ratings}
                onSelectRating={facets ? handleSelectRating : undefined}
                optionGroups={facets?.options}
                selectedOptions={selectedOptions}
                onToggleOption={facets ? handleToggleOption : undefined}
              />
            </div>
          </aside>

          {/* Right Column: Grid Header & Products Catalog */}
          <div className="lg:col-span-3 space-y-6">
            <ProductGridHeader
              totalProducts={totalCount}
              displayedCount={products.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />

            {/* Product Grid / List Container */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-primary flex items-center justify-center mx-auto text-xl font-bold">
                  !
                </div>
                <h3 className="text-base font-bold text-gray-900">No Products Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  We could not find any products matching your selected criteria. Try resetting your filters.
                </p>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
                    : "space-y-4"
                }
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className={viewMode === "list" ? "flex-row sm:h-48" : ""}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {lastPage > 1 && (
              <div className="pt-6 border-t border-gray-200">
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={lastPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
