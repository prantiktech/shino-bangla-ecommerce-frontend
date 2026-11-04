"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Flame } from "lucide-react";
import { HomeBanner } from "@/app/(user)/actions/products";
import { imageSrc } from "@/lib/utils/image";

interface PromoBannersProps {
  banners?: HomeBanner[];
  title?: string;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({ banners = [] }) => {
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div
          className={`grid grid-cols-1 ${
            banners.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2"
          } gap-4 lg:gap-6`}
        >
          {banners.map((banner, idx) => {
            const isBold = idx % 2 === 1;
            const imgUrl = imageSrc(banner.image, "full", "");
            const href = banner.link_url || "/products";

            return (
              <div
                key={banner.id}
                className={`relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between min-h-[220px] shadow-xs group hover:shadow-lg transition-all duration-300 ${
                  isBold
                    ? "bg-gradient-to-r from-brand-600 via-primary to-amber-500 text-white"
                    : "bg-gradient-to-r from-amber-50 via-brand-50/60 to-rose-50 border border-brand-100/80 text-gray-900"
                }`}
              >
                {imgUrl && (
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={imgUrl}
                      alt={banner.title || "Offer Banner"}
                      fill
                      className="object-cover object-center rounded-r-2xl"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${
                        isBold
                          ? "from-primary via-primary/80 to-transparent"
                          : "from-amber-50 via-amber-50/70 to-transparent"
                      }`}
                    />
                  </div>
                )}

                <div className="relative z-10 max-w-[280px] sm:max-w-xs space-y-2">
                  {banner.subtitle && (
                    <div
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                        isBold
                          ? "px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white"
                          : "text-primary"
                      }`}
                    >
                      {isBold ? (
                        <Flame className="w-3 h-3 text-amber-300" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{banner.subtitle}</span>
                    </div>
                  )}
                  {banner.title && (
                    <h3
                      className={`text-xl sm:text-2xl font-black leading-tight ${
                        isBold ? "text-white drop-shadow-xs" : "text-gray-900"
                      }`}
                    >
                      {banner.title}
                    </h3>
                  )}
                </div>

                <div className="relative z-10 pt-4">
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isBold
                        ? "bg-white text-primary hover:bg-brand-50 shadow-md"
                        : "bg-white text-gray-900 border border-gray-200 hover:border-primary hover:text-primary shadow-2xs"
                    }`}
                  >
                    <span>{banner.button_label || "Shop Now"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
