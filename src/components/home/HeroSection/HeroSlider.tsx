"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import {
  ChevronLeft,
  ChevronRight,
  Gem,
  ShieldCheck,
  Leaf,
  Home,
  ArrowRight,
} from "lucide-react";
import { HomeBanner } from "@/app/(user)/actions/products";
import { imageSrc } from "@/lib/utils/image";

interface HeroSliderProps {
  banners?: HomeBanner[];
}

const DEFAULT_BADGES = [
  {
    icon: <Gem className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
    line1: "PREMIUM",
    line2: "QUALITY",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
    line1: "DURABLE &",
    line2: "RELIABLE",
  },
  {
    icon: <Leaf className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
    line1: "GENUINE",
    line2: "PRODUCTS",
  },
  {
    icon: <Home className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
    line1: "FAST",
    line2: "DELIVERY",
  },
];

export const HeroSlider: React.FC<HeroSliderProps> = ({ banners = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = banners.length > 0
    ? banners.map((b) => ({
        id: String(b.id),
        title: b.title || "Quality Products for Every Need",
        subtitle: b.subtitle || "Explore authentic essentials with fast delivery across Bangladesh",
        buttonLabel: b.button_label || "Shop Now",
        linkUrl: b.link_url || "/products",
        image: imageSrc(b.image, "full", ""),
        mobileImage: imageSrc(b.mobile_image, "full", ""),
      }))
    : [
        {
          id: "default-hero",
          title: "Quality Essentials, Delivered Fast.",
          subtitle: "Browse our curated catalog of verified products and everyday essentials.",
          buttonLabel: "Browse Catalog",
          linkUrl: "/products",
          image: "",
          mobileImage: "",
        },
      ];

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="relative w-full h-full min-h-[360px] sm:min-h-[390px] md:min-h-[420px] rounded-2xl overflow-hidden border border-gray-200/90 shadow-xs group bg-[#F8FAFC] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Horizontal Sliding Track Animation */}
      <div
        className="flex w-full h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => {
          const hasImage = Boolean(slide.image);
          return (
            <div
              key={slide.id}
              className="w-full h-full shrink-0 relative flex flex-col md:flex-row items-stretch bg-gradient-to-br from-[#F8FAFC] via-white to-brand-50/40"
            >
              {/* Left Content Column */}
              <div
                className={`w-full ${
                  hasImage ? "md:w-[56%]" : "md:w-full"
                } p-5 sm:p-7 md:p-9 flex flex-col justify-between z-10`}
              >
                <Logo size="sm" href={null} className="hidden md:inline-flex" />

                <div className="space-y-3 my-auto pt-2 max-w-xl">
                  <h1 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-[32px] font-bold tracking-tight leading-[1.15] text-ink">
                    {slide.title}
                  </h1>

                  <span className="block h-1 w-12 rounded-full bg-primary" aria-hidden="true" />

                  {slide.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.linkUrl && (
                    <div className="pt-2">
                      <Link
                        href={slide.linkUrl}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
                      >
                        <span>{slide.buttonLabel || "Shop Now"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* 4 Guarantee Badges */}
                <div className="pt-3 pb-2">
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 max-w-md">
                    {DEFAULT_BADGES.map((b, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center mb-1 text-slate-700">
                          {b.icon}
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 uppercase leading-tight tracking-tight">
                          {b.line1}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 uppercase leading-tight tracking-tight">
                          {b.line2}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Banner Image Area */}
              {hasImage && (
                <div className="w-full md:w-[44%] relative min-h-[200px] md:min-h-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 45vw"
                  />
                  <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F8FAFC] to-transparent hidden md:block" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows on Hover */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-primary text-gray-800 hover:text-white shadow-sm items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-primary text-gray-800 hover:text-white shadow-sm items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Pill Pagination Indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-6 bg-primary"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
