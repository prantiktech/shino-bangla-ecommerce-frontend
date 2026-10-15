"use client";

/**
 * The signed-in staff member's roles and permissions, loaded once by the admin layout.
 * Screens use `useCan()` to hide actions the API would refuse; the API stays the authority.
 */
import React, { createContext, useCallback, useContext } from "react";
import { PagePermission, StaffAccess, hasPermission } from "../access";

const PermissionsContext = createContext<StaffAccess | null>(null);

export function AdminPermissionsProvider({ access, children }: { access: StaffAccess | null; children: React.ReactNode }) {
  return <PermissionsContext.Provider value={access}>{children}</PermissionsContext.Provider>;
}

/** `can("orders.fulfil")`. Super-admins pass everything; while loading every check passes, as in the sidebar. */
export function useCan() {
  const access = useContext(PermissionsContext);
  return useCallback((permission: PagePermission) => !access || hasPermission(access, permission), [access]);
}
