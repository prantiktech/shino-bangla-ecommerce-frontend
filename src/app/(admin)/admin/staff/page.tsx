import React from "react";
import { getAdminStaffAction } from "@/app/(admin)/actions/staff";
import { getAdminRolesAction } from "@/app/(admin)/actions/roles";
import { StaffManagement } from "./_components/StaffManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata = {
  title: "Back Office Staff | Admin Portal",
  description: "Manage back office administrator accounts, assign operational roles, and revoke session credentials.",
};

export default async function AdminStaffPage() {
  const access = await guardAdminPage("/admin/staff");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const [staffRes, rolesRes] = await Promise.all([
    getAdminStaffAction(),
    getAdminRolesAction(),
  ]);

  const staff = staffRes.success && staffRes.data ? staffRes.data.data : [];
  const roles = rolesRes.success && rolesRes.data ? rolesRes.data : [];

  return <StaffManagement initialStaff={staff} initialRoles={roles} />;
}
