/** Order list filters; a plain module so both the server page and the client list can use them. */
import type { OrderStatus } from "@/types/admin-orders";

export interface OrderFilters {
  status: OrderStatus | "";
  q: string;
  product: string;
  payment_status: string;
  payment_method: string;
  courier: string;
  source: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: OrderFilters = {
  status: "",
  q: "",
  product: "",
  payment_status: "",
  payment_method: "",
  courier: "",
  source: "",
  from: "",
  to: "",
};
