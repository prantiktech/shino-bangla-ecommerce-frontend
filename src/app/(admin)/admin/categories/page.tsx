import React from "react";
import { Metadata } from "next";
import { getAdminCategoriesAction } from "@/app/(admin)/actions/categories";
import { CategoriesManagement } from "./_components/CategoriesManagement";

export const metadata: Metadata = {
  title: "Categories Architecture | Store Management",
  description: "Manage store taxonomy, nested subcategories, VAT rates, media banners and SEO configurations.",
};

export default async function AdminCategoriesPage() {
  const res = await getAdminCategoriesAction();
  const categories = res.success && res.data ? res.data : [];

  return <CategoriesManagement initialCategories={categories} />;
}
