import React from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { FeatureBanners } from "@/components/home/FeatureBanners";
import { TopCategories } from "@/components/home/TopCategories";
import { FlashDeals } from "@/components/home/FlashDeals";
import { PromoBanners } from "@/components/home/PromoBanners";
import { NewArrivals } from "@/components/home/NewArrivals";
import { getHomeSectionsAction, getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { mapApiCategoryToCategory } from "@/lib/utils/category-mapper";

export const metadata: Metadata = {
  title: "Demo Safety Store | Safety Equipment, Hardware & Manuals",
  description:
    "Order genuine fire extinguishers, emergency lights, safety equipment, and industrial hardware with fast delivery in Bangladesh.",
};

export default async function HomePage() {
  // Parallel server-side fetching of live home sections, categories, and catalog products
  const [homeRes, categoriesRes, allProductsRes] = await Promise.all([
    getHomeSectionsAction(),
    getCategoriesAction(),
    getProductsAction({ per_page: 24 }),
  ]);

  const rawCategories = categoriesRes.success ? categoriesRes.data : [];
  const allProducts = allProductsRes.success ? allProductsRes.data.items.map(mapApiProductToProduct) : [];

  // Extract products from home sections or fall back to filtered catalog
  const homeSections = homeRes.success ? homeRes.data.sections : [];

  const featuredSection = homeSections.find((s) => s.type === "featured");
  const bestSellersSection = homeSections.find((s) => s.type === "best_sellers");
  const newArrivalsSection = homeSections.find((s) => s.type === "new_arrivals");

  const flashDealsProducts =
    bestSellersSection?.products && bestSellersSection.products.length > 0
      ? bestSellersSection.products.map(mapApiProductToProduct)
      : allProducts.filter((p) => p.isFlashDeal || p.discountBadge).length > 0
      ? allProducts.filter((p) => p.isFlashDeal || p.discountBadge)
      : allProducts.slice(0, 8);

  const newArrivalsProducts =
    newArrivalsSection?.products && newArrivalsSection.products.length > 0
      ? newArrivalsSection.products.map(mapApiProductToProduct)
      : allProducts.filter((p) => p.isNewArrival).length > 0
      ? allProducts.filter((p) => p.isNewArrival)
      : allProducts.slice(0, 8);

  return (
    <div className="space-y-2 md:space-y-4">
      {/* 1. Hero Section: Vertical Category Mega Menu & Banner Slider */}
      <HeroSection />

      {/* 2. Featured Promotional Cards */}
      <FeatureBanners />

      {/* 3. Top Categories Carousel & Grid with Live Backend Categories */}
      <TopCategories categories={rawCategories} />

      {/* 4. Flash Deals with Live Countdown Timer & Live API Products */}
      <FlashDeals products={flashDealsProducts} />

      {/* 5. Split Promotional Banners */}
      <PromoBanners />

      {/* 6. New Arrivals with Live API Products */}
      <NewArrivals products={newArrivalsProducts} />
    </div>
  );
}
