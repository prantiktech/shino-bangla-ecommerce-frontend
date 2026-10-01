import React from "react";
import { Metadata } from "next";
import { getAdminBannersAction } from "@/app/(admin)/actions/banners";
import { BannersManagement } from "./_components/BannersManagement";

export const metadata: Metadata = {
  title: "Banners | Admin Portal",
  description: "Manage homepage sliders, promotional banners, scheduling campaigns, and target destinations.",
};

export default async function AdminBannersPage() {
  const res = await getAdminBannersAction();
  const banners = res.success && res.data ? res.data : [];

  return <BannersManagement initialBanners={banners} />;
}
