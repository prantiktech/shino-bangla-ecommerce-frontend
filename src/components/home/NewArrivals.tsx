"use client";

import React, { useRef } from "react";
import { ProductCard } from "@/components/common/ProductCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Product } from "@/types";
import { Sparkles } from "lucide-react";

interface NewArrivalsProps {
  products?: Product[];
  title?: string;
  subtitle?: string | null;
  viewAllUrl?: string | null;
  layout?: "carousel" | "grid" | string;
}

export const NewArrivals: React.FC<NewArrivalsProps> = ({
  products = [],
  title = "New Arrivals",
  subtitle = "Explore the latest additions to our store catalog",
  viewAllUrl = "/products",
  layout = "carousel",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>{title}</span>
            </span>
          }
          subtitle={subtitle || undefined}
          showArrows={layout !== "grid"}
          onPrev={scrollPrev}
          onNext={scrollNext}
          actionText="See All"
          actionHref={viewAllUrl || "/products"}
        />

        {layout === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 pt-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pt-2 pb-6 px-1"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[240px] sm:w-[260px] md:w-[280px] shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
