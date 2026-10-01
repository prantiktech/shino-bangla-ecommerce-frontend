import React from "react";
import { getAdminRolesAction } from "@/app/(admin)/actions/roles";
import { RolesManagement } from "./_components/RolesManagement";

export const metadata = {
  title: "Roles & Permissions | Admin Portal",
  description: "Manage administrative roles and staff access privileges.",
};

export default async function AdminRolesPage() {
  const res = await getAdminRolesAction();
  const roles = res.success && res.data ? res.data : [];

  return <RolesManagement initialRoles={roles} />;
}
