"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";
import type { ContactRule, ContactRuleKind, ContactRuleType, FraudCheckResult, FraudProvider } from "@/types/admin-orders";

/** The provider is an outside service: give it time and never resend automatically. */
const PROVIDER_CALL = { timeout: 45000, retries: 0 } as const;

/** GET /admin/orders/{id}/fraud-check — shop history, rule, checkout verdict and the order's IPs. */
export async function getAdminOrderFraudCheckAction(orderId: number) {
  return adminRequest<FraudCheckResult>("GET", "GET_ADMIN_ORDER_FRAUD_CHECK", "Failed to load the fraud check", {
    pathParams: { id: orderId },
  });
}

/** POST /admin/orders/{id}/fraud-check/provider — also ask the provider (503 FRAUD_CHECK_UNAVAILABLE until connected). */
export async function runAdminOrderFraudProviderAction(orderId: number) {
  return adminRequest<FraudCheckResult>("POST", "RUN_ADMIN_ORDER_FRAUD_PROVIDER", "The fraud-check provider did not answer", {
    pathParams: { id: orderId },
    ...PROVIDER_CALL,
  });
}

/** GET /admin/fraud-check?phone= — the same check for any number; `provider` also asks the provider. */
export async function lookupAdminFraudCheckAction(phone: string, provider = false) {
  return adminRequest<FraudCheckResult>("GET", "GET_ADMIN_FRAUD_CHECK", "Failed to check that number", {
    params: { phone: phone.trim(), provider: provider ? 1 : undefined },
    ...(provider ? PROVIDER_CALL : {}),
  });
}

/** GET /admin/fraud-providers — the fraud-check service, its key masked. */
export async function getAdminFraudProvidersAction() {
  return adminList<FraudProvider>("GET_ADMIN_FRAUD_PROVIDERS", "Failed to load fraud-check providers");
}

/** PUT /admin/fraud-providers/{provider} — keys are write-only: send only what was typed. */
export async function updateAdminFraudProviderAction(
  provider: string,
  payload: { is_enabled?: boolean; credentials?: Record<string, string> }
) {
  return adminRequest<FraudProvider>("PUT", "UPDATE_ADMIN_FRAUD_PROVIDER", "Failed to save the provider", {
    pathParams: { provider },
    body: payload,
  });
}

/** GET /admin/contact-rules — paginated; filters: type, rule, q. */
export async function getAdminContactRulesAction(params?: QueryParams) {
  return adminList<ContactRule>("GET_ADMIN_CONTACT_RULES", "Failed to load blocked and trusted contacts", params);
}

/** POST /admin/contact-rules — block a phone or IP, or trust a phone. */
export async function createAdminContactRuleAction(payload: {
  type: ContactRuleType;
  value: string;
  rule: ContactRuleKind;
  reason?: string | null;
}) {
  return adminRequest<ContactRule>("POST", "CREATE_ADMIN_CONTACT_RULE", "Failed to save the rule", {
    body: { ...payload, value: payload.value.trim(), reason: payload.reason?.trim() || null },
  });
}

export async function deleteAdminContactRuleAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_CONTACT_RULE", "Failed to remove the rule", { pathParams: { id } });
}
