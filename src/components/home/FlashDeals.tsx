"use client";

import React, { useRef, useMemo } from "react";
import { ProductCard } from "@/components/common/ProductCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Product } from "@/types";
import { useCountdown } from "@/hooks/useCountdown";

interface FlashDealsProps {
  products?: Product[];
}

export const FlashDeals: React.FC<FlashDealsProps> = ({ products = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const targetTimestamp = useMemo(() => {
    return Date.now() + (11 * 3600 + 51 * 60 + 35) * 1000;
  }, []);

  const { days, hours, minutes, seconds } = useCountdown(targetTimestamp);

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

  const CountdownBadge = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs">
          {days.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] text-gray-500 font-semibold mt-0.5">Day</span>
      </div>

      <span className="text-primary font-black text-xs pb-3">:</span>

      <div className="flex flex-col items-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs">
          {hours.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] text-gray-500 font-semibold mt-0.5">Hour</span>
      </div>

      <span className="text-primary font-black text-xs pb-3">:</span>

      <div className="flex flex-col items-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs">
          {minutes.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] text-gray-500 font-semibold mt-0.5">Min</span>
      </div>

      <span className="text-primary font-black text-xs pb-3">:</span>

      <div className="flex flex-col items-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs">
          {seconds.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] text-gray-500 font-semibold mt-0.5">Sec</span>
      </div>
    </div>
  );

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Flash Deals"
          subtitle="Special limited-time offers on genuine safety equipment and hardware"
          countdown={CountdownBadge}
          showArrows={true}
          onPrev={scrollPrev}
          onNext={scrollNext}
          actionText="View All Deals"
          actionHref="/deals"
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
