"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { HomeBanner } from "@/app/(user)/actions/products";
import { imageSrc } from "@/lib/utils/image";

interface FeatureBannersProps {
  banners?: HomeBanner[];
}

export const FeatureBanners: React.FC<FeatureBannersProps> = ({ banners = [] }) => {
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <section className="pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {banners.map((promo) => {
            const imgUrl = imageSrc(promo.image, "card", "/placeholder.svg");
            const href = promo.link_url || "/products";
            return (
              <Link
                key={promo.id}
                href={href}
                className="group relative rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 aspect-[4/3] bg-gray-100 block"
              >
                <Image
                  src={imgUrl}
                  alt={promo.title || "Promotional Banner"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />

                <div className="absolute inset-x-0 bottom-0 p-5 text-white flex items-end justify-between">
                  <div>
                    {promo.subtitle && (
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {promo.subtitle}
                      </span>
                    )}
                    {promo.title && (
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                        {promo.title}
                      </h3>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shrink-0 ml-2">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
