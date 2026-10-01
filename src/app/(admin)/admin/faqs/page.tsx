import type { Metadata } from "next";
import { getAdminFaqsAction } from "@/app/(admin)/actions/content";
import { FaqsManagement } from "./_components/FaqsManagement";

export const metadata: Metadata = { title: "FAQs | Admin Portal" };

export default async function AdminFaqsPage() {
  const res = await getAdminFaqsAction();
  return <FaqsManagement initial={res.success ? res.data ?? [] : []} initialError={res.success ? null : res.error.message} />;
}
