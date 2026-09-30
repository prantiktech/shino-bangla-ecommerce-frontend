"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Gift,
  Newspaper,
  Layers
} from "lucide-react";
import { Category, SubCategory } from "@/types";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiCategoryToCategory } from "@/lib/utils/category-mapper";

export const NavBar: React.FC = () => {
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategoriesAction().then((res) => {
      if (res.success && res.data) {
        setCategories(res.data.map(mapApiCategoryToCategory));
      }
    });
  }, []);

  // Reference to main navbar container for positioning calculations
  const navContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // All Categories Dropdown State (Left Button)
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);
  const [activeFlyoutCategory, setActiveFlyoutCategory] = useState<Category | null>(null);
  const allCatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sliding Category Hover Popover State
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const [popoverX, setPopoverX] = useState<number>(0);
  const sliderCloseTimeout = useRef<NodeJS.Timeout | null>(null);

  // Scroll button visibility/activity states
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to enable/disable or style arrow buttons
  const checkScrollState = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScrollState();
    const handleResize = () => checkScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle clicking outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setIsAllCategoriesOpen(false);
        setActiveFlyoutCategory(null);
        setHoveredCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll action handlers
  const handleScrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -220, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 220, behavior: "smooth" });
    }
  };

  // Slider Category Hover Handlers
  const handleCategoryMouseEnter = (category: Category, e: React.MouseEvent<HTMLElement>) => {
    if (sliderCloseTimeout.current) {
      clearTimeout(sliderCloseTimeout.current);
      sliderCloseTimeout.current = null;
    }

    // Close "All Categories" if slider is hovered
    setIsAllCategoriesOpen(false);
    setActiveFlyoutCategory(null);

    if (category.subCategories && category.subCategories.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const navRect = navContainerRef.current?.getBoundingClientRect();
      if (navRect) {
        const center = rect.left - navRect.left + rect.width / 2;
        setPopoverX(center);
        setHoveredCategory(category);
      }
    } else {
      setHoveredCategory(null);
    }
  };

  const handleCategoryMouseLeave = () => {
    sliderCloseTimeout.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 180);
  };

  const handlePopoverMouseEnter = () => {
    if (sliderCloseTimeout.current) {
      clearTimeout(sliderCloseTimeout.current);
      sliderCloseTimeout.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    sliderCloseTimeout.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 180);
  };

  // All Categories Dropdown Handlers
  const handleAllCategoriesMouseEnter = () => {
    if (allCatTimeoutRef.current) {
      clearTimeout(allCatTimeoutRef.current);
      allCatTimeoutRef.current = null;
    }
    // Close slider popover when opening All Categories
    setHoveredCategory(null);
    setIsAllCategoriesOpen(true);
  };

  const handleAllCategoriesMouseLeave = () => {
    allCatTimeoutRef.current = setTimeout(() => {
      setIsAllCategoriesOpen(false);
      setActiveFlyoutCategory(null);
    }, 200);
  };

  // Popover clamping calculations
  const dropdownWidth = 270;
  const containerWidth = navContainerRef.current?.offsetWidth || 1200;
  const clampedX = Math.max(
    dropdownWidth / 2 + 10,
    Math.min(popoverX, containerWidth - dropdownWidth / 2 - 10)
  );
  const arrowOffset = Math.max(16, Math.min(popoverX - (clampedX - dropdownWidth / 2), dropdownWidth - 16));

  return (
    <nav
      ref={navContainerRef}
      className="bg-[#009cae] text-white relative z-40 select-none shadow-sm transition-colors overflow-visible"
      aria-label="Categories navigation"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 overflow-visible">
        <div className="flex items-center justify-between h-11 md:h-12 gap-1.5 md:gap-3">
          
          {/* 1. Left Trigger: Categories Dropdown Button (matching screenshot) */}
          <div
            className="relative shrink-0 overflow-visible"
            onMouseEnter={handleAllCategoriesMouseEnter}
            onMouseLeave={handleAllCategoriesMouseLeave}
          >
            <button
              onClick={() => setIsAllCategoriesOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 md:py-2 rounded-md font-semibold text-xs md:text-sm tracking-wide transition-all ${
                isAllCategoriesOpen
                  ? "bg-[#008392] text-white ring-1 ring-white/30"
                  : "bg-[#008ba0] hover:bg-[#008195] text-white"
              }`}
              aria-expanded={isAllCategoriesOpen}
              aria-haspopup="true"
            >
              <span>Categories</span>
              {isAllCategoriesOpen ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>

            {/* "All Categories" Dropdown with Nested Subcategories Flyout */}
            {isAllCategoriesOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-64 md:w-72 bg-white rounded-xl shadow-2xl border border-gray-200/90 text-gray-800 py-0 z-50 animate-in fade-in-50 zoom-in-95 duration-150 overflow-visible"
                onMouseEnter={handleAllCategoriesMouseEnter}
                onMouseLeave={handleAllCategoriesMouseLeave}
              >
                {/* Header Banner */}
                <div className="bg-[#009cae] text-white px-4 py-2.5 rounded-t-xl font-bold text-xs md:text-sm flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>All Categories</span>
                  </div>
                  <span className="text-[11px] text-white/80 font-normal">
                    {categories.length} items
                  </span>
                </div>

                {/* Categories List (Overflow visible so flyout submenu extends outside seamlessly) */}
                <div className="py-1.5 overflow-visible">
                  {categories.map((category, index) => {
                    const isHovered = activeFlyoutCategory?.id === category.id;
                    const hasSubs = category.subCategories && category.subCategories.length > 0;
                    const isNearBottom = index >= categories.length - 3;

                    return (
                      <div
                        key={category.id}
                        className="relative group overflow-visible"
                        onMouseEnter={() => setActiveFlyoutCategory(category)}
                      >
                        <Link
                          href={`/category/${category.slug}`}
                          onClick={() => {
                            setIsAllCategoriesOpen(false);
                            setActiveFlyoutCategory(null);
                          }}
                          className={`flex items-center justify-between px-3.5 py-2 text-xs md:text-sm transition-colors ${
                            isHovered
                              ? "bg-teal-50 text-[#009cae] font-semibold"
                              : "text-gray-700 hover:bg-gray-50 hover:text-[#009cae]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                isHovered
                                  ? "bg-teal-100 text-[#009cae]"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <CategoryIcon name={category.icon} className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{category.name}</span>
                          </div>

                          {hasSubs && (
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                isHovered ? "text-[#009cae] translate-x-0.5" : "text-gray-400"
                              }`}
                            />
                          )}
                        </Link>

                        {/* Nested Subcategories Flyout */}
                        {isHovered && hasSubs && (
                          <div
                            className={`absolute left-full pl-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100 ${
                              isNearBottom ? "bottom-0" : "-top-1"
                            }`}
                            onMouseEnter={() => setActiveFlyoutCategory(category)}
                          >
                            {/* Invisible Mouse Bridge to ensure cursor never drops off */}
                            <div className="absolute top-0 bottom-0 -left-3 w-5" />

                            <div className="w-64 bg-white rounded-xl border border-gray-200/90 shadow-2xl py-2 px-1.5 max-h-[420px] overflow-y-auto">
                              <div className="space-y-0.5">
                                {category.subCategories?.map((sub: SubCategory) => (
                                  <Link
                                    key={sub.id}
                                    href={`/category/${category.slug}/${sub.slug}`}
                                    onClick={() => {
                                      setIsAllCategoriesOpen(false);
                                      setActiveFlyoutCategory(null);
                                    }}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-teal-50 hover:text-[#009cae] transition-colors group/item"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      {sub.icon && (
                                        <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 group-hover/item:text-[#009cae] group-hover/item:bg-teal-100/60 transition-colors shrink-0">
                                          <CategoryIcon name={sub.icon} className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      <span className="truncate font-medium">{sub.name}</span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover/item:text-[#009cae] opacity-0 group-hover/item:opacity-100 transition-all shrink-0" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Center Section: Sliding Nav Bar with White Circular Arrows */}
          <div className="flex-1 flex items-center min-w-0 mx-1 md:mx-2 relative">
            
            {/* Left Scroll Arrow (White circle with teal arrow matching screenshot) */}
            <button
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              aria-label="Scroll categories left"
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center bg-white text-[#009cae] hover:bg-white/90 active:scale-95 transition-all shrink-0 mr-1.5 shadow-sm ${
                !canScrollLeft ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Horizontally Scrollable Categories Slider */}
            <div
              ref={sliderRef}
              onScroll={checkScrollState}
              className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
            >
              {categories.map((category) => {
                const isActiveHover = hoveredCategory?.id === category.id;

                return (
                  <div
                    key={category.id}
                    onMouseEnter={(e) => handleCategoryMouseEnter(category, e)}
                    onMouseLeave={handleCategoryMouseLeave}
                    className="relative shrink-0"
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      className={`whitespace-nowrap px-2.5 sm:px-3 py-1 rounded-md text-xs md:text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                        isActiveHover
                          ? "bg-white/25 text-white shadow-2xs font-semibold"
                          : "text-white/95 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <span>{category.name}</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Arrow (White circle with teal arrow matching screenshot) */}
            <button
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              aria-label="Scroll categories right"
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center bg-white text-[#009cae] hover:bg-white/90 active:scale-95 transition-all shrink-0 ml-1.5 shadow-sm ${
                !canScrollRight ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* 3. Right Static Links: Products, New Arrivals, Blogs (matching screenshot icons & labels) */}
          <div className="hidden lg:flex items-center gap-1 md:gap-2 shrink-0 text-xs md:text-sm font-medium border-l border-white/20 pl-2 md:pl-3">
            <Link
              href="/products"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                pathname === "/products"
                  ? "bg-white/25 text-white font-bold"
                  : "text-white/95 hover:text-white hover:bg-white/15"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Products</span>
            </Link>

            <Link
              href="/products?sort=newest"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/95 hover:text-white hover:bg-white/15 transition-colors whitespace-nowrap"
            >
              <Gift className="w-4 h-4" />
              <span>New Arrivals</span>
            </Link>

            <Link
              href="/blogs"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                pathname === "/blogs"
                  ? "bg-white/25 text-white font-bold"
                  : "text-white/95 hover:text-white hover:bg-white/15"
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Blogs</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Floating Category Subcategories Dropdown (On Slider Hover) */}
      {hoveredCategory && hoveredCategory.subCategories && hoveredCategory.subCategories.length > 0 && (
        <div
          className="absolute top-full z-50 animate-in fade-in-50 zoom-in-95 duration-150 pt-1"
          style={{
            left: `${clampedX}px`,
            transform: "translateX(-50%)"
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          {/* Invisible Mouse Bridge to eliminate gap between navbar and dropdown */}
          <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

          {/* Card Container */}
          <div className="w-64 bg-white rounded-xl border border-gray-200/90 shadow-2xl py-2 px-1.5 max-h-[420px] overflow-y-auto relative text-gray-800">
            {/* Top Pointer Arrow */}
            <div
              className="absolute -top-1.5 w-3 h-3 bg-white border-t border-l border-gray-200/90 rotate-45 transform"
              style={{ left: `${arrowOffset - 6}px` }}
            />

            {/* Subcategories List */}
            <div className="space-y-0.5">
              {hoveredCategory.subCategories.map((sub: SubCategory) => (
                <Link
                  key={sub.id}
                  href={`/category/${hoveredCategory.slug}/${sub.slug}`}
                  onClick={() => setHoveredCategory(null)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-teal-50 hover:text-[#009cae] transition-colors group/item"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {sub.icon && (
                      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 group-hover/item:text-[#009cae] group-hover/item:bg-teal-100/60 transition-colors shrink-0">
                        <CategoryIcon name={sub.icon} className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="truncate font-medium">{sub.name}</span>
                  </div>

                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover/item:text-[#009cae] opacity-0 group-hover/item:opacity-100 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
