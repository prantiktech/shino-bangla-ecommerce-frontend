import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, Package } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { TopCategories } from "@/components/home/TopCategories";
import { FlashDeals } from "@/components/home/FlashDeals";
import { PromoBanners } from "@/components/home/PromoBanners";
import { NewArrivals } from "@/components/home/NewArrivals";
import { getHomeSectionsAction, getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { mapApiCategoryToCategory } from "@/lib/utils/category-mapper";
import { imageAlt, imageSrc } from "@/lib/utils/image";

export const metadata: Metadata = {
  title: { absolute: "Nogod Bazar | Quality Products, Hardware & Safety Essentials" },
  description:
    "Order quality products, certified safety equipment, hardware, and books with fast delivery in Bangladesh at Nogod Bazar.",
};

export default async function HomePage() {
  const [homeRes, categoriesRes, allProductsRes] = await Promise.all([
    getHomeSectionsAction(),
    getCategoriesAction(),
    getProductsAction({ per_page: 24 }),
  ]);

  const rawCategories = categoriesRes.success ? categoriesRes.data : [];
  const sidebarCategories = rawCategories.map(mapApiCategoryToCategory);
  const allProducts = allProductsRes.success
    ? allProductsRes.data.items.map(mapApiProductToProduct)
    : [];

  const homeSections = homeRes.success ? homeRes.data.sections : [];
  const sliderSection = homeSections.find((s) => s.type === "slider");
  const remainingSections = homeSections.filter((s) => s.type !== "slider");

  return (
    <div className="space-y-2 md:space-y-4 pb-12">
      {/* 1. Hero Section: Vertical Category Mega Menu & API Banner Slider */}
      <HeroSection
        banners={sliderSection?.banners || []}
        initialCategories={sidebarCategories}
      />

      {/* 2. Render Dynamic Sections in the exact order configured in Admin Home Builder */}
      {remainingSections.length > 0 ? (
        remainingSections.map((section) => {
          if (section.type === "offer_banners") {
            return (
              <PromoBanners
                key={section.id}
                banners={section.banners || []}
                title={section.title}
              />
            );
          }

          if (section.type === "categories") {
            const cats =
              section.categories && section.categories.length > 0
                ? section.categories
                : rawCategories;
            return <TopCategories key={section.id} categories={cats} />;
          }

          if (section.type === "brands" && section.brands && section.brands.length > 0) {
            return (
              <section key={section.id} className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        {section.title || "Shop by Brand"}
                      </h2>
                      {section.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{section.subtitle}</p>
                      )}
                    </div>
                    <Link
                      href="/brands"
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      All Brands →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {section.brands.map((brand) => {
                      const logoUrl = imageSrc(brand.logo, "thumb", "");
                      return (
                        <Link
                          key={brand.id}
                          href={`/brand/${brand.slug}`}
                          className="group p-4 bg-white rounded-2xl border border-gray-200/90 hover:border-primary/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 overflow-hidden p-2 text-primary">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={imageAlt(brand.logo, brand.name)}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <Package className="w-6 h-6" />
                            )}
                          </div>
                          <h3 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                            {brand.name}
                          </h3>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === "flash_sale") {
            const prods = (section.products || []).map(mapApiProductToProduct);
            return (
              <FlashDeals
                key={section.id}
                title={section.title || "Flash Sale"}
                subtitle={section.subtitle}
                endsAt={section.ends_at}
                viewAllUrl={section.view_all_url || "/deals"}
                products={prods}
              />
            );
          }

          if (
            [
              "featured",
              "trending",
              "new_arrivals",
              "popular",
              "best_sellers",
              "custom",
              "category",
            ].includes(section.type)
          ) {
            const prods = (section.products || []).map(mapApiProductToProduct);
            return (
              <NewArrivals
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                viewAllUrl={section.view_all_url || "/products"}
                layout={section.layout}
                products={prods}
              />
            );
          }

          if (
            section.type === "featured_reviews" &&
            section.reviews &&
            section.reviews.length > 0
          ) {
            return (
              <section key={section.id} className="py-8 bg-white/60">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {section.title || "Customer Reviews"}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {section.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">
                            {rev.customer_name || "Verified Customer"}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < rev.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rev.title && (
                          <p className="text-xs font-semibold text-gray-800">{rev.title}</p>
                        )}
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {rev.body}
                        </p>
                        {rev.product && (
                          <Link
                            href={`/products/${rev.product.slug}`}
                            className="inline-block text-[11px] font-semibold text-primary hover:underline"
                          >
                            {rev.product.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })
      ) : (
        <>
          <TopCategories categories={rawCategories} />
          <FlashDeals
            products={allProducts.filter((p) => p.isFlashDeal || p.discountBadge).slice(0, 8)}
          />
          <NewArrivals products={allProducts.slice(0, 10)} />
        </>
      )}
    </div>
  );
}
