import type { Metadata } from "next";
import { getAdminPagesAction } from "@/app/(admin)/actions/content";
import { PagesManagement } from "./_components/PagesManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Pages | Admin Portal" };

export default async function AdminPagesPage() {
  const access = await guardAdminPage("/admin/pages");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminPagesAction();
  return <PagesManagement initial={res.success ? res.data ?? [] : []} initialError={res.success ? null : res.error.message} />;
}
