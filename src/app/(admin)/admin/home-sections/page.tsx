import type { Metadata } from "next";
import { getAdminHomeSectionsAction, getAdminHomeSectionTypesAction } from "@/app/(admin)/actions/home-sections";
import { getAdminCategoriesAction } from "@/app/(admin)/actions/categories";
import { getAdminBrandsAction } from "@/app/(admin)/actions/brands";
import { HomeSectionsManagement } from "./_components/HomeSectionsManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Home Page | Admin Portal" };

export default async function AdminHomeSectionsPage() {
  const access = await guardAdminPage("/admin/home-sections");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

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
