"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  };
}

export function ProductsView({
  products,
  totalCount,
  currentPage,
  lastPage,
  categories,
  initialFilters,
}: ProductsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters.category || "");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialFilters.subCategory || "");
  const [minPrice, setMinPrice] = useState<number>(initialFilters.minPrice || 0);
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters.maxPrice || 100000);
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
    router.push(`/products?${params.toString()}`);
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
    updateUrlParams({ minPrice: min > 0 ? min : undefined, maxPrice: max < 100000 ? max : undefined });
  };

  const handleClearAll = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setMinPrice(0);
    setMaxPrice(100000);
    setSortBy("default");
    router.push("/products");
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateUrlParams({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-16">
      {/* Breadcrumb Navigation */}
      <ProductBreadcrumb
        categoryName={selectedCategory ? selectedCategory.replace(/-/g, " ") : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8">
          {/* Left Column: Filter Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
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
              />
            </div>
          </aside>

          {/* Right Column: Grid Header & Products Catalog */}
          <main className="lg:col-span-3 space-y-6">
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
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF5B00] flex items-center justify-center mx-auto text-xl font-bold">
                  !
                </div>
                <h3 className="text-base font-bold text-gray-900">No Products Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  We could not find any products matching your selected criteria. Try resetting your filters.
                </p>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-[#FF5B00] text-white text-xs font-bold rounded-xl hover:bg-[#E64E00] transition-colors shadow-xs cursor-pointer"
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
          </main>
        </div>
      </div>
    </div>
  );
}
