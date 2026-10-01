"use client";

import React from "react";
import Link from "next/link";
import { FolderTree, Sparkles } from "lucide-react";
import { ApiCategory } from "@/app/(user)/actions/categories";
import { CategoryIcon } from "@/components/common/CategoryIcon";

interface TopCategoriesProps {
  categories?: ApiCategory[];
}

export const TopCategories: React.FC<TopCategoriesProps> = ({ categories = [] }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Top Categories
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto mt-2 rounded-full" />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-brand-50 border border-brand-100/80 hover:border-brand-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center"
            >
              {/* Category Icon Container */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 rounded-2xl bg-white shadow-2xs border border-brand-50 flex items-center justify-center group-hover:scale-105 transition-transform text-primary">
                <CategoryIcon name={cat.icon || "Shield"} className="w-8 h-8" />
              </div>

              {/* Title & Product Count */}
              <div className="w-full">
                <h3 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-gray-400 font-semibold mt-0.5 block">
                  {cat.product_count !== undefined ? `${cat.product_count} items` : "Explore"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
