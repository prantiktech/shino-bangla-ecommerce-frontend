import type { Metadata } from "next";
import { getAdminFaqsAction } from "@/app/(admin)/actions/content";
import { FaqsManagement } from "./_components/FaqsManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "FAQs | Admin Portal" };

export default async function AdminFaqsPage() {
  const access = await guardAdminPage("/admin/faqs");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminFaqsAction();
  return <FaqsManagement initial={res.success ? res.data ?? [] : []} initialError={res.success ? null : res.error.message} />;
}
