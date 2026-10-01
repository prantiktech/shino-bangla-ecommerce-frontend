import React from "react";
import { getAdminProductsAction } from "@/app/(admin)/actions/products";
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

  const [adminRes, categoriesRes] = await Promise.all([
    getAdminProductsAction({ q: q || undefined, page, per_page: 20 }),
    getCategoriesAction(),
  ]);

  let products = [];
  let total = 0;
  let totalPages = 1;

  if (adminRes.success && adminRes.data) {
    const rawData = adminRes.data;
    products = Array.isArray(rawData.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];
    total = rawData.meta?.total ?? products.length;
    totalPages = rawData.meta?.last_page ?? 1;
  } else {
    const productsRes = await getProductsAction({ q: q || undefined, page, per_page: 20 });
    products = productsRes.success ? productsRes.data.items : [];
    total = productsRes.success ? productsRes.data.total : 0;
    totalPages = productsRes.success ? productsRes.data.lastPage : 1;
  }

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
