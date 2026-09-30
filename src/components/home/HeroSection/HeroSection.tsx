"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "./HeroSlider";

export const HeroSection: React.FC = () => {
  return (
    <section className="py-2.5 sm:py-3.5 md:py-4">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3 lg:gap-3.5">
          
          {/* 1. Left Vertical Card Strip: Warehouse Aisle & Shopping Cart (matching screenshot) */}
          <div className="hidden md:block w-24 sm:w-28 lg:w-32 shrink-0 h-[380px] sm:h-[400px] md:h-[430px]">
            <Link
              href="/products"
              className="group relative block w-full h-full rounded-2xl overflow-hidden border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-300 bg-stone-900"
            >
              <Image
                src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80"
                alt="Shopping cart in warehouse aisle"
                fill
                priority
                className="object-cover object-left group-hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 1024px) 120px, 140px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </Link>
          </div>

          {/* 2. Center Main Slider Banner (matching screenshot layout & sliding animation) */}
          <div className="flex-1 min-w-0 h-[380px] sm:h-[400px] md:h-[430px]">
            <HeroSlider />
          </div>

          {/* 3. Right Stacked Promo Cards (Top & Bottom, matching screenshot) */}
          <div className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 sm:gap-3 h-auto lg:h-[430px]">
            
            {/* Top Right Card: Heating Solutions (identical to screenshot) */}
            <Link
              href="/category/industrial-boiler"
              className="flex-1 group relative rounded-2xl overflow-hidden border border-gray-200/90 bg-white p-3 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[190px] sm:min-h-[200px]"
            >
              {/* Card Header: Cyan Badge & Cembula Logo */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <span className="inline-block bg-[#009cae] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded leading-tight shadow-2xs">
                  Durable & Energy-Efficient<br />Heating Solutions
                </span>
                
                {/* Small Cembula watermark logo */}
                <div className="flex items-center text-[11px] font-black text-gray-800">
                  <span className="text-[#009cae] font-black text-sm leading-none mr-0.5">C</span>
                  <span>embula</span>
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
                  www.fembula.com
                </span>
              </div>
            </Link>

            {/* Bottom Right Card: Proximity Sensors (identical to screenshot) */}
            <Link
              href="/category/sensors"
              className="flex-1 group relative rounded-2xl overflow-hidden border border-gray-200/90 bg-white p-3 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[190px] sm:min-h-[200px]"
            >
              {/* Card Header: Blue Badge & Cembula Logo */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <span className="inline-block bg-[#0066cc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded leading-tight shadow-2xs">
                  PROXIMITY<br />SENSOR
                </span>
                
                {/* Small Cembula watermark logo */}
                <div className="flex items-center text-[11px] font-black text-gray-800">
                  <span className="text-[#009cae] font-black text-sm leading-none mr-0.5">C</span>
                  <span>embula</span>
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
                  www.fembula.com
                </span>
              </div>
            </Link>

          </div>

        </div>
      </div>
    </section>
  );
};
