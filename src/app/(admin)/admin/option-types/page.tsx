import type { Metadata } from "next";
import { getAdminOptionTypesAction } from "@/app/(admin)/actions/option-types";
import { OptionTypesManagement } from "./_components/OptionTypesManagement";

export const metadata: Metadata = { title: "Product Options | Admin Portal" };

export default async function AdminOptionTypesPage() {
  const res = await getAdminOptionTypesAction();
  return <OptionTypesManagement initial={res.success ? res.data ?? [] : []} initialError={res.success ? null : res.error.message} />;
}
