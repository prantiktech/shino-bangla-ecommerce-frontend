import React from "react";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

interface ProductBreadcrumbProps {
  categoryName?: string;
  subCategoryName?: string;
}

export const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({
  categoryName,
  subCategoryName,
}) => {
  return (
    <nav aria-label="Breadcrumb" className="bg-white border-b border-slate-200/70 py-2.5 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link
          href="/"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5 text-gray-500" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/products" className="hover:text-primary transition-colors">
          Shop
        </Link>

        {categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold">{categoryName}</span>
          </>
        )}

        {subCategoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-primary font-bold">{subCategoryName}</span>
          </>
        )}
      </div>
    </nav>
  );
};
