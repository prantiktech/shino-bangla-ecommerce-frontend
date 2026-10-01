"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Gift,
  Newspaper,
  Layers,
  Menu,
  Tag,
} from "lucide-react";
import { Category, SubCategory } from "@/types";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiCategoryToCategory } from "@/lib/utils/category-mapper";

const QUICK_LINKS = [
  {
    href: "/products",
    label: "Products",
    icon: ShoppingBag,
    match: (p: string | null, sort: string | null) => p === "/products" && sort !== "newest",
  },
  {
    href: "/products?sort=newest",
    label: "New Arrivals",
    icon: Gift,
    match: (p: string | null, sort: string | null) => p === "/products" && sort === "newest",
  },
  {
    href: "/brands",
    label: "Brands",
    icon: Tag,
    match: (p: string | null) => !!p && (p === "/brands" || p.startsWith("/brand/")),
  },
  {
    href: "/blogs",
    label: "Guides",
    icon: Newspaper,
    match: (p: string | null) => !!p && p.startsWith("/blogs"),
  },
];

export const NavBar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams?.get("sort") ?? null;

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

  // Close any open menu after navigation (state adjusted during render, no effect needed)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsAllCategoriesOpen(false);
    setActiveFlyoutCategory(null);
    setHoveredCategory(null);
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAllCategoriesOpen(false);
        setActiveFlyoutCategory(null);
        setHoveredCategory(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Re-evaluate arrow state once categories load
  useEffect(() => {
    checkScrollState();
  }, [categories]);

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
  const handleCategoryMouseEnter = (category: Category, e: React.PointerEvent<HTMLElement>) => {
    // Hover menus are a mouse affordance; on touch a tap simply navigates.
    if (e.pointerType !== "mouse") return;
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
  const handleAllCategoriesMouseEnter = (e?: React.PointerEvent<HTMLElement>) => {
    if (e && e.pointerType !== "mouse") return;
    if (allCatTimeoutRef.current) {
      clearTimeout(allCatTimeoutRef.current);
      allCatTimeoutRef.current = null;
    }
    // Close slider popover when opening All Categories
    setHoveredCategory(null);
    setIsAllCategoriesOpen(true);
  };

  const handleAllCategoriesMouseLeave = (e?: React.PointerEvent<HTMLElement>) => {
    if (e && e.pointerType !== "mouse") return;
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
      className="bg-primary text-white relative z-30 select-none overflow-visible"
      aria-label="Categories navigation"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 overflow-visible">
        <div className="flex items-center justify-between h-11 gap-2 md:gap-3">
          
          {/* 1. Left Trigger: Categories Dropdown Button (matching brand theme) */}
          <div
            className="relative shrink-0 overflow-visible"
            onPointerEnter={handleAllCategoriesMouseEnter}
            onPointerLeave={handleAllCategoriesMouseLeave}
          >
            <button
              onClick={() => setIsAllCategoriesOpen((prev) => !prev)}
              className={`flex items-center gap-2 h-11 px-3 md:px-4 font-semibold text-xs md:text-sm transition-colors ${
                isAllCategoriesOpen
                  ? "bg-brand-700 text-white"
                  : "bg-brand-600 hover:bg-brand-700 text-white"
              }`}
              aria-expanded={isAllCategoriesOpen}
              aria-haspopup="menu"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">All Categories</span>
              <span className="sm:hidden">Categories</span>
              {isAllCategoriesOpen ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>

            {/* "All Categories" Dropdown with Nested Subcategories Flyout */}
            {isAllCategoriesOpen && (
              <div
                className="absolute top-full left-0 w-[min(18rem,calc(100vw-2rem))] bg-white rounded-b-xl shadow-xl ring-1 ring-slate-900/5 text-slate-800 py-0 z-50 overflow-visible"
                onPointerEnter={handleAllCategoriesMouseEnter}
                onPointerLeave={handleAllCategoriesMouseLeave}
              >
                {/* Header Banner */}
                <div className="bg-slate-50 border-b border-slate-100 text-slate-700 px-4 py-2.5 font-semibold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>All Categories</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {categories.length} items
                  </span>
                </div>

                {/* Categories List (Overflow visible so flyout submenu extends outside seamlessly) */}
                <div className="py-1.5 max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible">
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
                              ? "bg-brand-50 text-primary font-semibold"
                              : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                isHovered
                                  ? "bg-brand-100 text-primary"
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
                                isHovered ? "text-primary translate-x-0.5" : "text-gray-400"
                              }`}
                            />
                          )}
                        </Link>

                        {/* Nested Subcategories Flyout */}
                        {isHovered && hasSubs && (
                          <div
                            className={`hidden md:block absolute left-full pl-2 z-50 ${
                              isNearBottom ? "bottom-0" : "-top-1"
                            }`}
                            onMouseEnter={() => setActiveFlyoutCategory(category)}
                          >
                            {/* Invisible Mouse Bridge to ensure cursor never drops off */}
                            <div className="absolute top-0 bottom-0 -left-3 w-5" />

                            <div className="w-64 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 border border-transparent py-2 px-1.5 max-h-[420px] overflow-y-auto">
                              <div className="space-y-0.5">
                                {category.subCategories?.map((sub: SubCategory) => (
                                  <Link
                                    key={sub.id}
                                    href={`/category/${category.slug}/${sub.slug}`}
                                    onClick={() => {
                                      setIsAllCategoriesOpen(false);
                                      setActiveFlyoutCategory(null);
                                    }}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-brand-50 hover:text-primary transition-colors group/item"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      {sub.icon && (
                                        <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 group-hover/item:text-primary group-hover/item:bg-brand-100/60 transition-colors shrink-0">
                                          <CategoryIcon name={sub.icon} className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      <span className="truncate font-medium">{sub.name}</span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover/item:text-primary opacity-0 group-hover/item:opacity-100 transition-all shrink-0" />
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
            
            {/* Left Scroll Arrow (White circle with orange arrow) */}
            <button
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              aria-label="Scroll categories left"
              className={`hidden sm:flex w-7 h-7 rounded-full items-center justify-center bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all shrink-0 mr-1.5 ${
                !canScrollLeft ? "opacity-0 pointer-events-none" : "cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Horizontally Scrollable Categories Slider */}
            <div
              ref={sliderRef}
              onScroll={checkScrollState}
              className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
            >
              {categories.map((category) => {
                const isActiveHover = hoveredCategory?.id === category.id;
                const isCurrent = pathname?.startsWith(`/category/${category.slug}`);

                return (
                  <div
                    key={category.id}
                    onPointerEnter={(e) => handleCategoryMouseEnter(category, e)}
                    onPointerLeave={handleCategoryMouseLeave}
                    className="relative shrink-0"
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs md:text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                        isActiveHover || isCurrent
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span>{category.name}</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Arrow (White circle with orange arrow) */}
            <button
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              aria-label="Scroll categories right"
              className={`hidden sm:flex w-7 h-7 rounded-full items-center justify-center bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all shrink-0 ml-1.5 ${
                !canScrollRight ? "opacity-0 pointer-events-none" : "cursor-pointer"
              }`}
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* 3. Right Static Links */}
          <div className="hidden lg:flex items-center gap-1 shrink-0 text-[13px] font-medium border-l border-white/20 pl-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname, currentSort);
              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    active ? "bg-white/20 text-white" : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>

      {/* Floating Category Subcategories Dropdown (On Slider Hover) */}
      {hoveredCategory && hoveredCategory.subCategories && hoveredCategory.subCategories.length > 0 && (
        <div
          className="hidden md:block absolute top-full z-50 pt-1"
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
          <div className="w-64 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 border border-transparent py-2 px-1.5 max-h-[420px] overflow-y-auto relative text-gray-800">
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
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-brand-50 hover:text-primary transition-colors group/item"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {sub.icon && (
                      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 group-hover/item:text-primary group-hover/item:bg-brand-100/60 transition-colors shrink-0">
                        <CategoryIcon name={sub.icon} className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="truncate font-medium">{sub.name}</span>
                  </div>

                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover/item:text-primary opacity-0 group-hover/item:opacity-100 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
