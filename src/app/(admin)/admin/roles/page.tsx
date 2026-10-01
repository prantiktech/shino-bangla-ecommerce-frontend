import React from "react";
import { getAdminRolesAction } from "@/app/(admin)/actions/roles";
import { getAdminPermissionsAction } from "@/app/(admin)/actions/permissions";
import { RolesManagement } from "./_components/RolesManagement";

export const metadata = {
  title: "Roles & Permissions | Admin Portal",
  description: "Manage administrative roles and staff access privileges.",
};

export default async function AdminRolesPage() {
  const [res, perms] = await Promise.all([getAdminRolesAction(), getAdminPermissionsAction()]);
  const roles = res.success && res.data ? res.data : [];

  return <RolesManagement initialRoles={roles} permissionCatalogue={perms.success ? perms.data : null} />;
}
