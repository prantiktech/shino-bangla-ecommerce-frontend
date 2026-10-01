"use server";

import { adminRequest, adminVoid } from "./_request";

export interface OptionType {
  id: number;
  name: string;
}

/** GET /admin/option-types */
export async function getAdminOptionTypesAction() {
  return adminRequest<OptionType[]>("GET", "GET_ADMIN_OPTION_TYPES", "Failed to load option types");
}

/** POST /admin/option-types */
export async function createAdminOptionTypeAction(name: string) {
  return adminRequest<OptionType>("POST", "CREATE_ADMIN_OPTION_TYPE", "Failed to create option type", {
    body: { name: name.trim() },
  });
}

/** PUT /admin/option-types/{optionType} */
export async function updateAdminOptionTypeAction(id: number, name: string) {
  return adminRequest<OptionType>("PUT", "UPDATE_ADMIN_OPTION_TYPE", "Failed to rename option type", {
    pathParams: { id },
    body: { name: name.trim() },
  });
}

/** DELETE /admin/option-types/{optionType} (only when unused) */
export async function deleteAdminOptionTypeAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_OPTION_TYPE", "Failed to delete option type", { pathParams: { id } });
}
