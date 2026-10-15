import React from "react";
import { Metadata } from "next";
import { getAdminCategoriesAction } from "@/app/(admin)/actions/categories";
import { CategoriesManagement } from "./_components/CategoriesManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = {
  title: "Categories | Admin Portal",
  description: "Manage store taxonomy, nested subcategories, VAT rates, media banners and SEO configurations.",
};

export default async function AdminCategoriesPage() {
  const access = await guardAdminPage("/admin/categories");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminCategoriesAction();
  const categories = res.success && res.data ? res.data : [];

  return <CategoriesManagement initialCategories={categories} />;
}
