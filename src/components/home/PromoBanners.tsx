"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Flame } from "lucide-react";

export const PromoBanners: React.FC = () => {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Banner 1: Everyday Baby Essentials */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 via-brand-50/60 to-rose-50 border border-brand-100/80 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] shadow-xs group hover:shadow-lg transition-all duration-300">
            {/* Background Illustration / Image */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 transition-transform duration-500 group-hover:scale-105">
              <Image
                src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80"
                alt="Baby Essentials"
                fill
                className="object-cover object-center rounded-r-2xl mask-radial"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-amber-50/70 to-transparent" />
            </div>

            {/* Left Content */}
            <div className="relative z-10 max-w-[280px] sm:max-w-xs space-y-2">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Everyday Baby</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                Essentials – With Love
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Safe. Comfortable. Designed for Modern Parents.
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="relative z-10 pt-4">
              <Link
                href="/category/mother-baby-essentials"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-200 hover:border-primary hover:text-primary rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all"
              >
                <span>Shop Essentials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Banner 2: Mega Sale Up to 25% OFF */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-brand-600 via-primary to-amber-500 text-white p-6 sm:p-8 flex flex-col justify-between min-h-[240px] shadow-lg group hover:shadow-xl transition-all duration-300">
            {/* Background Graphic */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-85 transition-transform duration-500 group-hover:scale-105">
              <Image
                src="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80"
                alt="Electric Cars Sale"
                fill
                className="object-cover object-center rounded-r-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
            </div>

            {/* Left Content */}
            <div className="relative z-10 max-w-[280px] sm:max-w-xs space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider">
                <Flame className="w-3 h-3 text-amber-300" />
                <span>Mega Sale</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-xs">
                Up to 25% OFF
              </h3>
              <p className="text-xs text-brand-100 leading-relaxed font-medium">
                Coolest Electric Cars & Bikes For Kids. Limited Stock!
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="relative z-10 pt-4">
              <Link
                href="/category/ride-on-vehicle-toys"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary hover:bg-brand-50 rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span>Grab Yours Today</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
