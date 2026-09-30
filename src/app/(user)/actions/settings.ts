"use server";

import { serverGet } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface ApiSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  cod_enabled: boolean;
  bank_transfer_enabled: boolean;
  bank_transfer_instructions?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
}

export async function getSettingsAction(): Promise<ActionResponse<ApiSettings>> {
  try {
    const res = await serverGet<any>("GET_SETTINGS", {
      next: { revalidate: 300 },
    });

    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load settings") : "Failed to load settings",
        code: "FETCH_SETTINGS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
