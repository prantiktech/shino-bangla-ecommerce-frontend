import type { Metadata } from "next";
import { getAdminProductsAction } from "@/app/(admin)/actions/products";
import { getAdminCategoriesAction } from "@/app/(admin)/actions/categories";
import { getAdminBrandsAction } from "@/app/(admin)/actions/brands";
import { getAdminOptionTypesAction } from "@/app/(admin)/actions/option-types";
import { ProductsManagement } from "./_components/ProductsManagement";

export const metadata: Metadata = { title: "Products | Admin Portal" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [products, categories, brands, optionTypes] = await Promise.all([
    getAdminProductsAction({ per_page: 25, q: q?.trim() || undefined }),
    getAdminCategoriesAction(),
    getAdminBrandsAction(),
    getAdminOptionTypesAction(),
  ]);

  return (
    <ProductsManagement
      key={q ?? ""}
      initialQuery={q ?? ""}
      initial={products.success ? products.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      categories={
        categories.success
          ? categories.data.map((c) => ({ id: c.id, name: c.name, depth: (c as { depth?: number }).depth ?? 0 }))
          : []
      }
      brands={brands.success ? brands.data.data.map((b) => ({ id: b.id, name: b.name })) : []}
      optionTypes={optionTypes.success ? optionTypes.data ?? [] : []}
      initialError={products.success ? null : products.error.message}
    />
  );
}
