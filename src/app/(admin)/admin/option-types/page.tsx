import type { Metadata } from "next";
import { getAdminOptionTypesAction } from "@/app/(admin)/actions/option-types";
import { OptionTypesManagement } from "./_components/OptionTypesManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Product Options | Admin Portal" };

export default async function AdminOptionTypesPage() {
  const access = await guardAdminPage("/admin/option-types");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminOptionTypesAction();
  return <OptionTypesManagement initial={res.success ? res.data ?? [] : []} initialError={res.success ? null : res.error.message} />;
}
