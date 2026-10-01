import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Sparkles, Package } from "lucide-react";
import { getBrandsAction } from "@/app/(user)/actions/brands";

export const metadata = {
  title: "All Brands",
  description: "Explore genuine equipment and hardware brands available at Nogod Bazar.",
};

export default async function AllBrandsPage() {
  const res = await getBrandsAction();
  const brands = res.success ? res.data : [];

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "All Brands" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Store Brands
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            Discover authorized brands and manufacturers.
          </p>
        </div>

        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight pb-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Verified Brands</span>
            </h2>
            <div className="w-10 h-0.5 bg-primary mx-auto rounded-full" />
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-primary flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No Brands Added Yet</h3>
            <p className="text-xs text-gray-500">
              Brands will appear here as they are added to the store catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brand/${brand.slug}`}
                className="group p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:border-primary/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-primary">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">
                  {brand.name}
                </h3>
                <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  {brand.product_count ?? 0} Products
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
