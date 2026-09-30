"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Flame, Wrench } from "lucide-react";

const PROMOS = [
  {
    id: "promo-1",
    title: "Fire Safety & Extinguishers",
    subtitle: "Certified Equipment",
    categorySlug: "fire-extinguishers",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
    icon: Flame,
  },
  {
    id: "promo-2",
    title: "Industrial & Workshop Hardware",
    subtitle: "High Tensile Fasteners",
    categorySlug: "hardware",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
    icon: Wrench,
  },
  {
    id: "promo-3",
    title: "Safety Equipment & Detectors",
    subtitle: "Emergency Preparedness",
    categorySlug: "safety-equipment",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80",
    icon: ShieldCheck,
  },
];

export const FeatureBanners: React.FC = () => {
  return (
    <section className="pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {PROMOS.map((promo) => {
            const IconComp = promo.icon;
            return (
              <Link
                key={promo.id}
                href={`/category/${promo.categorySlug}`}
                className="group relative rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 aspect-[4/3] bg-gray-100 block"
              >
                <Image
                  src={promo.image}
                  alt={promo.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-108"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />

                <div className="absolute inset-x-0 bottom-0 p-5 text-white flex items-end justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5" />
                      {promo.subtitle}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      {promo.title}
                    </h3>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#FF5B00] group-hover:scale-110 transition-all duration-300 shrink-0 ml-2">
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
