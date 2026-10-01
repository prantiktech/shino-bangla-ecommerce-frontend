"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Logo } from "@/components/common/Logo";
import {
  ChevronLeft,
  ChevronRight,
  Gem,
  ShieldCheck,
  Leaf,
  Home
} from "lucide-react";

interface HeroSlideItem {
  id: string;
  brandTitle: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  badges: {
    icon: React.ReactNode;
    line1: string;
    line2: string;
  }[];
  websiteUrl: string;
  image: string;
  link: string;
}

const HERO_SLIDES_DATA: HeroSlideItem[] = [
  {
    id: "slide-kitchen-nogodbazar",
    brandTitle: "Nogod Bazar",
    titleLine1: "Elevate Every Meal,",
    titleLine2: "Enrich Every Moment.",
    subtitle: "Premium Kitchen Essentials for a Beautiful Life",
    badges: [
      {
        icon: <Gem className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "PREMIUM",
        line2: "QUALITY"
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "DURABLE &",
        line2: "RELIABLE"
      },
      {
        icon: <Leaf className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "SAFE &",
        line2: "HEALTHY"
      },
      {
        icon: <Home className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "DESIGNED FOR",
        line2: "EVERY HOME"
      }
    ],
    websiteUrl: "www.nogodbazar.com",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80",
    link: "/products"
  },
  {
    id: "slide-cookware-modern",
    brandTitle: "Nogod Bazar",
    titleLine1: "Cook with Passion,",
    titleLine2: "Serve with Elegance.",
    subtitle: "Artisan Cookware Crafted for Everyday Masterpieces",
    badges: [
      {
        icon: <Gem className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "NON-STICK",
        line2: "COATING"
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "HEAT",
        line2: "RESISTANT"
      },
      {
        icon: <Leaf className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "100% ECO",
        line2: "FRIENDLY"
      },
      {
        icon: <Home className="w-5 h-5 text-slate-700 stroke-[1.5]" />,
        line1: "EASY TO",
        line2: "CLEAN"
      }
    ],
    websiteUrl: "www.nogodbazar.com",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&auto=format&fit=crop&q=80",
    link: "/products"
  }
];

export const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES_DATA.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES_DATA.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES_DATA.length);
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
        {HERO_SLIDES_DATA.map((slide) => (
          <div
            key={slide.id}
            className="w-full h-full shrink-0 relative flex flex-col md:flex-row items-stretch bg-[#F8FAFC]"
          >
            {/* Left Content Column */}
            <div className="w-full md:w-[58%] p-5 sm:p-7 md:p-9 flex flex-col justify-between z-10">
              
              {/* Brand mark */}
              <Logo size="sm" href={null} className="hidden md:inline-flex" />

              {/* Main Headline & Subtitle */}
              <div className="space-y-2 my-auto pt-2">
                <h1 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-[32px] font-bold tracking-tight leading-[1.15]">
                  <span className="block text-primary">
                    {slide.titleLine1}
                  </span>
                  <span className="block text-ink">
                    {slide.titleLine2}
                  </span>
                </h1>

                <span className="block h-1 w-12 rounded-full bg-primary" aria-hidden="true" />

                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {slide.subtitle}
                </p>
              </div>

              {/* 4 Guarantee Badges in a Horizontal Row (identical to screenshot) */}
              <div className="pt-3 pb-2">
                <div className="grid grid-cols-4 gap-1 sm:gap-2 max-w-md">
                  {slide.badges.map((b, idx) => (
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

              {/* Website URL in gold/bronze (identical to screenshot) */}
              <div className="hidden sm:flex items-center gap-2 pt-1 text-slate-400 text-xs">
                <span className="h-[1px] w-8 bg-slate-300" />
                <span className="text-[11px] font-semibold tracking-wider">
                  {slide.websiteUrl}
                </span>
                <span className="h-[1px] w-8 bg-slate-300" />
              </div>
            </div>

            {/* Right Cookware Photo Area */}
            <div className="w-full md:w-[42%] relative min-h-[220px] md:min-h-full overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.titleLine1}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              {/* Soft Gradient Overlay for seamless blending with marble surface */}
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F8FAFC] to-transparent hidden md:block" />
            </div>

          </div>
        ))}
      </div>

      {/* Navigation Arrows on Hover */}
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
        {HERO_SLIDES_DATA.map((_, i) => (
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
    </div>
  );
};
