"use client";

import React, { useRef, useState } from "react";
import { ProductCard } from "@/components/common/ProductCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Product } from "@/types";
import { Sparkles } from "lucide-react";

interface NewArrivalsProps {
  products?: Product[];
}

export const NewArrivals: React.FC<NewArrivalsProps> = ({ products = [] }) => {
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
    <section className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF5B00]" />
              <span>New Arrivals</span>
            </span>
          }
          subtitle="Explore the latest additions to our store catalog"
          showArrows={true}
          onPrev={scrollPrev}
          onNext={scrollNext}
          actionText="See All Products"
          actionHref="/products"
        />

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
      </div>
    </section>
  );
};
