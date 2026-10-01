"use server";

import { serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import type { StoreSettings } from "./settings";

export type StoreAsset = "logo" | "favicon" | "invoice-logo";

/** POST /admin/settings/assets/{asset} — multipart `file`; returns the updated settings */
export async function uploadStoreAssetAction(asset: StoreAsset, formData: FormData): Promise<ActionResponse<StoreSettings>> {
  if (!["logo", "favicon", "invoice-logo"].includes(asset)) {
    return { success: false, error: { message: "Unknown asset", code: "BAD_ASSET" } };
  }
  try {
    const res = await serverPost<{ data?: unknown } & Record<string, unknown>>(`/admin/settings/assets/${asset}`, formData, { timeout: 60000 });
    if (!res.success) {
      return { success: false, error: { message: res.error?.message || "Upload failed", code: "ASSET_UPLOAD_FAILED" } };
    }
    return { success: true, data: (res.data?.data ?? res.data) as StoreSettings };
  } catch (error) {
    return handleActionError(error);
  }
}
