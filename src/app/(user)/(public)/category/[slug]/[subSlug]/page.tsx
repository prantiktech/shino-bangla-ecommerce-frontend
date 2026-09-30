import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlugAction, getCategoriesAction } from "@/app/(user)/actions/categories";
import { getProductsAction } from "@/app/(user)/actions/products";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { ProductsView } from "@/app/(user)/(public)/products/_components/products-view";

interface SubCategoryPageProps {
  params: Promise<{
    slug: string;
    subSlug: string;
  }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: SubCategoryPageProps): Promise<Metadata> {
  const { subSlug } = await params;
  const name = subSlug.replace(/-/g, " ");

  return {
    title: `${name} | Demo Safety Store`,
    description: `Shop authentic ${name} products with fast delivery in Bangladesh.`,
  };
}

export default async function SubCategoryPage({ params, searchParams }: SubCategoryPageProps) {
  const { slug, subSlug } = await params;
  const resolvedSearch = await searchParams;
  const page = Number(resolvedSearch.page) || 1;
  const sort = resolvedSearch.sort;

  const [categoryRes, productsRes, categoriesRes] = await Promise.all([
    getCategoryBySlugAction(subSlug),
    getProductsAction({ category: subSlug, page, sort: sort !== "default" ? sort : undefined, per_page: 12 }),
    getCategoriesAction(),
  ]);

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
        category: slug,
        subCategory: subSlug,
        sort,
      }}
    />
  );
}
