"use server";

import { serverGet, serverPut } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface StoreSettings {
  store_name: string;
  store_email?: string | null;
  store_phone?: string | null;
  store_address?: string | null;
  default_vat_rate_bp: number;
  vat_on_shipping: boolean;
  cod_enabled: boolean;
  bank_transfer_enabled: boolean;
  bank_transfer_instructions?: string | null;
  low_stock_threshold: number;
  order_payment_timeout_minutes: number;
  /** Customers prove their mobile number with a code before an order is accepted. */
  order_phone_verification?: boolean;
  /** Send an SMS when an order is placed. */
  order_confirmation_sms?: boolean;
  /** Refuse a second order from the same number within `duplicate_order_minutes`. */
  duplicate_order_block?: boolean;
  duplicate_order_minutes?: number;
  /** Refuse cash orders from numbers with a poor courier delivery record. */
  courier_protection?: boolean;
  courier_min_success_rate?: number;
  courier_min_parcels?: number;
  logo_url?: string | null;
  favicon_url?: string | null;
  invoice_logo_url?: string | null;
}

export async function getAdminSettingsAction(): Promise<ActionResponse<StoreSettings>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_SETTINGS");
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load store settings") : "Failed to load store settings",
        code: "GET_SETTINGS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAdminSettingsAction(
  payload: Partial<StoreSettings>
): Promise<ActionResponse<StoreSettings>> {
  try {
    const res = await serverPut<any>("UPDATE_ADMIN_SETTINGS", payload);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update store settings") : "Failed to update store settings",
        code: "UPDATE_SETTINGS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
