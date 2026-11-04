"use client";

import React from "react";
import { HeroSlider } from "./HeroSlider";
import { CategorySidebar } from "./CategorySidebar";
import { HomeBanner } from "@/app/(user)/actions/products";
import { Category } from "@/types";

interface HeroSectionProps {
  banners?: HomeBanner[];
  initialCategories?: Category[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  banners = [],
  initialCategories,
}) => {
  return (
    <section className="py-2.5 sm:py-3.5 md:py-4">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3 lg:gap-3.5">
          {/* Left: category menu (desktop) */}
          <div className="hidden lg:block w-56 xl:w-60 shrink-0 h-[430px]">
            <CategorySidebar initialCategories={initialCategories} />
          </div>

          {/* The sliding banner takes the rest of the row */}
          <div className="w-full lg:flex-1 min-w-0 h-[380px] sm:h-[400px] md:h-[430px]">
            <HeroSlider banners={banners} />
          </div>
        </div>
      </div>
    </section>
  );
};
