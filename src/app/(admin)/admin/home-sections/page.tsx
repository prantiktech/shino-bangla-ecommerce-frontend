import type { Metadata } from "next";
import { getAdminHomeSectionsAction, getAdminHomeSectionTypesAction } from "@/app/(admin)/actions/home-sections";
import { getAdminCategoriesAction } from "@/app/(admin)/actions/categories";
import { getAdminBrandsAction } from "@/app/(admin)/actions/brands";
import { HomeSectionsManagement } from "./_components/HomeSectionsManagement";

export const metadata: Metadata = { title: "Home Page | Admin Portal" };

export default async function AdminHomeSectionsPage() {
  const [sections, types, categories, brands] = await Promise.all([
    getAdminHomeSectionsAction(),
    getAdminHomeSectionTypesAction(),
    getAdminCategoriesAction(),
    getAdminBrandsAction(),
  ]);
  return (
    <HomeSectionsManagement
      initial={sections.success ? sections.data ?? [] : []}
      types={types.success ? types.data ?? [] : []}
      categories={categories.success ? categories.data.map((c) => ({ id: c.id, name: c.name, depth: (c as { depth?: number }).depth ?? 0 })) : []}
      brands={brands.success ? brands.data.data.map((b) => ({ id: b.id, name: b.name })) : []}
      initialError={sections.success ? null : sections.error.message}
    />
  );
}
