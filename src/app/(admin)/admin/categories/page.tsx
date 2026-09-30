import React from "react";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { CategoriesManagement } from "./_components/CategoriesManagement";

export const metadata = {
  title: "Admin Categories | Store Management",
};

export default async function AdminCategoriesPage() {
  const res = await getCategoriesAction();
  const categories = res.success ? res.data : [];

  return <CategoriesManagement initialCategories={categories} />;
}
