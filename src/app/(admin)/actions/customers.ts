"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export interface CustomerAddress {
  id: number;
  label?: string | null;
  name: string;
  phone: string;
  district?: { id: number; name: string } | null;
  area?: string | null;
  line1: string;
  line2?: string | null;
  postcode?: string | null;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  account_type?: string | null;
  group?: string | null;
  orders_count?: number;
  spent?: number;
  addresses?: CustomerAddress[];
  last_login_at?: string | null;
  created_at: string;
}

/** GET /admin/customers (paginated) */
export async function getAdminCustomersAction(params?: QueryParams) {
  return adminList<AdminCustomer>("GET_ADMIN_CUSTOMERS", "Failed to load customers", params);
}

/** GET /admin/customers/{customer} */
export async function getAdminCustomerAction(id: number) {
  return adminRequest<AdminCustomer>("GET", "GET_ADMIN_CUSTOMER", "Failed to load customer", { pathParams: { id } });
}

/** PUT /admin/customers/{customer} — rename or (de)activate */
export async function updateAdminCustomerAction(id: number, payload: { name?: string; is_active?: boolean }) {
  return adminRequest<AdminCustomer>("PUT", "UPDATE_ADMIN_CUSTOMER", "Failed to update customer", {
    pathParams: { id },
    body: payload,
  });
}

/** DELETE /admin/customers/{customer} */
export async function deleteAdminCustomerAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_CUSTOMER", "Failed to delete customer", { pathParams: { id } });
}
