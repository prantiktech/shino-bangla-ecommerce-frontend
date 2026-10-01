"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "./HeroSlider";
import { CategorySidebar } from "./CategorySidebar";

export const HeroSection: React.FC = () => {
  return (
    <section className="py-2.5 sm:py-3.5 md:py-4">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3 lg:gap-3.5">
          
          {/* 1. Left: category menu (desktop) */}
          <div className="hidden lg:block w-56 xl:w-60 shrink-0 h-[430px]">
            <CategorySidebar />
          </div>

          {/* 2. Center Main Slider Banner (matching screenshot layout & sliding animation) */}
          <div className="w-full lg:flex-1 min-w-0 h-[380px] sm:h-[400px] md:h-[430px]">
            <HeroSlider />
          </div>

          {/* 3. Right Stacked Promo Cards (Top & Bottom, matching screenshot) */}
          <div className="w-full lg:w-56 xl:w-64 shrink-0 grid grid-cols-2 lg:flex lg:flex-col gap-2.5 sm:gap-3 h-auto lg:h-[430px]">
            
            {/* Top Right Card: Heating Solutions (identical to screenshot) */}
            <Link
              href="/category/industrial-boiler"
              className="flex-1 group relative rounded-2xl overflow-hidden border border-gray-200/90 bg-white p-3 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[200px]"
            >
              {/* Card Header: Badge & Nogod Bazar Logo */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <span className="inline-block bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded leading-tight shadow-2xs">
                  Heating Solutions
                </span>
                
                {/* Small Nogod Bazar watermark logo */}
                <div className="flex items-baseline text-[11px] font-extrabold leading-none">
                  <span className="text-ink">nogod</span>
                  <span className="text-primary">bazar</span>
                </div>
              </div>

              {/* Heating Elements Image */}
              <div className="relative w-full h-24 my-auto">
                <Image
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80"
                  alt="Durable Heating Solutions"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                  sizes="260px"
                />
              </div>

              {/* Card Footer URL Watermark */}
              <div className="relative z-10 text-right">
                <span className="text-[10px] text-gray-400 font-medium">
                  www.nogodbazar.com
                </span>
              </div>
            </Link>

            {/* Bottom Right Card: Proximity Sensors (identical to screenshot) */}
            <Link
              href="/category/sensors"
              className="flex-1 group relative rounded-2xl overflow-hidden border border-gray-200/90 bg-white p-3 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[200px]"
            >
              {/* Card Header: Badge & Nogod Bazar Logo */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <span className="inline-block bg-ink text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded leading-tight shadow-2xs">
                  Proximity Sensors
                </span>
                
                {/* Small Nogod Bazar watermark logo */}
                <div className="flex items-baseline text-[11px] font-extrabold leading-none">
                  <span className="text-ink">nogod</span>
                  <span className="text-primary">bazar</span>
                </div>
              </div>

              {/* Proximity Sensors Image */}
              <div className="relative w-full h-24 my-auto">
                <Image
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80"
                  alt="Proximity Sensors"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                  sizes="260px"
                />
              </div>

              {/* Card Footer URL Watermark */}
              <div className="relative z-10 text-right">
                <span className="text-[10px] text-gray-400 font-medium">
                  www.nogodbazar.com
                </span>
              </div>
            </Link>

          </div>

        </div>
      </div>
    </section>
  );
};
