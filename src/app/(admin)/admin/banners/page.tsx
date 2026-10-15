import React from "react";
import { Metadata } from "next";
import { getAdminBannersAction } from "@/app/(admin)/actions/banners";
import { BannersManagement } from "./_components/BannersManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = {
  title: "Banners | Admin Portal",
  description: "Manage homepage sliders, promotional banners, scheduling campaigns, and target destinations.",
};

export default async function AdminBannersPage() {
  const access = await guardAdminPage("/admin/banners");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminBannersAction();
  const banners = res.success && res.data ? res.data : [];

  return <BannersManagement initialBanners={banners} />;
}
