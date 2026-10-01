import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandBySlugAction } from "@/app/(user)/actions/brands";
import { getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { ProductsView } from "@/app/(user)/(public)/products/_components/products-view";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getBrandBySlugAction(slug);
  const name = res.success ? res.data.name : slug.replace(/-/g, " ");

  return {
    title: `${name} | Nogod Bazar`,
    description: `Shop authentic ${name} products at Nogod Bazar.`,
  };
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const page = Number(resolvedSearch.page) || 1;
  const sort = resolvedSearch.sort;

  const [brandRes, productsRes, categoriesRes] = await Promise.all([
    getBrandBySlugAction(slug),
    getProductsAction({ brand: slug, page, sort: sort !== "default" ? sort : undefined, per_page: 12 }),
    getCategoriesAction(),
  ]);

  if (!brandRes.success) {
    notFound();
  }

  const rawProducts = productsRes.success ? productsRes.data.items : [];
  const products = rawProducts.map(mapApiProductToProduct);
  const totalCount = productsRes.success ? productsRes.data.total : 0;
  const currentPage = productsRes.success ? productsRes.data.currentPage : 1;
  const lastPage = productsRes.success ? productsRes.data.lastPage : 1;
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <ProductsView
      products={products}
      totalCount={totalCount}
      currentPage={currentPage}
      lastPage={lastPage}
      categories={categories}
      initialFilters={{
        sort,
      }}
    />
  );
}
