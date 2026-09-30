import React from "react";
import type { Metadata } from "next";
import { getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { takaToPoisha } from "@/lib/utils/money";
import { ProductsView } from "./_components/products-view";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    subCategory?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    inStock?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const { category, q } = resolved;

  let title = "All Products & Equipment | Demo Safety Store";
  if (category) {
    title = `${category.replace(/-/g, " ").toUpperCase()} Products | Demo Safety Store`;
  } else if (q) {
    title = `Search results for "${q}" | Demo Safety Store`;
  }

  return {
    title,
    description: "Browse our genuine selection of safety equipment, fire extinguishers, hardware, and safety manuals in Bangladesh.",
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { category, subCategory, q, minPrice, maxPrice, sort, page, inStock } = resolved;

  // Build backend request parameters strictly matching GET /api/v1/products
  const params: Record<string, any> = {
    per_page: 12,
  };

  if (page) params.page = Number(page);
  if (q) params.q = q;
  if (subCategory) {
    params.category = subCategory;
  } else if (category) {
    params.category = category;
  }

  if (minPrice) {
    params.price_min = takaToPoisha(Number(minPrice));
  }
  if (maxPrice) {
    params.price_max = takaToPoisha(Number(maxPrice));
  }
  if (inStock === "true") {
    params.in_stock = 1;
  }
  if (sort && sort !== "default") {
    params.sort = sort;
  }

  // Parallel server-side fetching of live products and categories
  const [productsRes, categoriesRes] = await Promise.all([
    getProductsAction(params),
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
        category,
        subCategory,
        q,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
      }}
    />
  );
}
