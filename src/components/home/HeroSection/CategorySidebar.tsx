"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Layers, Sparkles } from "lucide-react";
import { Category, SubCategory } from "@/types";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiCategoryToCategory } from "@/lib/utils/category-mapper";

interface CategorySidebarProps {
  onHoverCategory?: (category: Category | null) => void;
  initialCategories?: Category[];
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  onHoverCategory,
  initialCategories,
}) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      getCategoriesAction().then((res) => {
        if (res.success && res.data) {
          setCategories(res.data.map(mapApiCategoryToCategory));
        }
      });
    }
  }, [initialCategories]);

  const handleMouseEnter = (category: Category) => {
    setActiveCategoryId(category.id);
    if (onHoverCategory) onHoverCategory(category);
  };

  const handleMouseLeave = () => {
    setActiveCategoryId(null);
    if (onHoverCategory) onHoverCategory(null);
  };

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-200/90 shadow-xs h-full flex flex-col justify-between py-2 z-30"
      onMouseLeave={handleMouseLeave}
    >
      {/* Category List */}
      <div className="space-y-0.5 px-2">
        {categories.map((category, index) => {
          const isHovered = activeCategoryId === category.id;
          const isNearBottom = index >= categories.length - 3;

          return (
            <div
              key={category.id}
              onMouseEnter={() => handleMouseEnter(category)}
              className="relative group"
            >
              {/* Category Link Row */}
              <Link
                href={`/category/${category.slug}`}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isHovered
                    ? "bg-brand-50 text-primary font-bold shadow-2xs"
                    : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isHovered
                        ? "bg-brand-100/80 text-primary"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <CategoryIcon name={category.icon} className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{category.name}</span>
                </div>
                {category.subCategories && category.subCategories.length > 0 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-colors ${
                      isHovered ? "text-primary" : "text-gray-400"
                    }`}
                  />
                )}
              </Link>

              {/* Flyout Submenu */}
              {isHovered && category.subCategories && category.subCategories.length > 0 && (
                <div
                  className={`absolute left-full pl-2 top-0 z-50 animate-in fade-in-50 duration-150 ${
                    isNearBottom ? "bottom-0 top-auto" : "top-0"
                  }`}
                >
                  <div className="w-64 bg-white rounded-2xl border border-gray-200/90 shadow-xl p-3 space-y-1">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 border-b border-gray-100 mb-1">
                      {category.name} Categories
                    </div>
                    {category.subCategories.map((sub: SubCategory) => (
                      <Link
                        key={sub.id}
                        href={`/category/${category.slug}/${sub.slug}`}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-brand-50 hover:text-primary transition-colors"
                      >
                        <span>{sub.name}</span>
                        {sub.itemCount !== undefined && (
                          <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-1.5 py-0.5 rounded">
                            {sub.itemCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Link: View all categories */}
      <div className="pt-2 px-2 border-t border-gray-100">
        <Link
          href="/products"
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-gray-700 hover:bg-brand-50 hover:text-primary transition-colors text-center"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </Link>
      </div>
    </div>
  );
};
