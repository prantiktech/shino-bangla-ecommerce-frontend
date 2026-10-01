import type { Metadata } from "next";
import { getAdminPagesAction } from "@/app/(admin)/actions/content";
import { PagesManagement } from "./_components/PagesManagement";

export const metadata: Metadata = { title: "Pages | Admin Portal" };

export default async function AdminPagesPage() {
  const res = await getAdminPagesAction();
  return <PagesManagement initial={res.success ? res.data ?? [] : []} initialError={res.success ? null : res.error.message} />;
}
