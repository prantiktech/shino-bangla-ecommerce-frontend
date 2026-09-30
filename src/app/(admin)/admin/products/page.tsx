import React from "react";
import { getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { ProductsManagement } from "./_components/ProductsManagement";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Admin Products | Store Management",
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const q = resolved.q || "";
  const page = Number(resolved.page) || 1;

  const [productsRes, categoriesRes] = await Promise.all([
    getProductsAction({ q: q || undefined, page, per_page: 20 }),
    getCategoriesAction(),
  ]);

  const products = productsRes.success ? productsRes.data.items : [];
  const total = productsRes.success ? productsRes.data.total : 0;
  const totalPages = productsRes.success ? productsRes.data.lastPage : 1;

  const categories = categoriesRes.success
    ? categoriesRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))
    : [];

  return (
    <ProductsManagement
      products={products}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      searchQuery={q}
      categories={categories}
    />
  );
}
