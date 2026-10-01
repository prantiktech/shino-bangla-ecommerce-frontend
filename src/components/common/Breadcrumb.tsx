import React from "react";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  return (
    <nav aria-label="Breadcrumb" className={`bg-white border-b border-slate-200/70 py-2.5 px-4 md:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto no-scrollbar">
        <Link
          href="/"
          className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-gray-500" />
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`whitespace-nowrap ${
                    isLast ? "text-slate-800 font-semibold" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
