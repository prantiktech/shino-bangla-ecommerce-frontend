import type { Metadata } from "next";
import { getAdminContactRulesAction, getAdminFraudProvidersAction } from "@/app/(admin)/actions/fraud";
import { FraudManagement } from "./_components/FraudManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Fraud check | Admin Portal" };

export default async function AdminFraudPage() {
  const access = await guardAdminPage("/admin/fraud");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const [rules, providers] = await Promise.all([getAdminContactRulesAction(), getAdminFraudProvidersAction()]);
  return (
    <FraudManagement
      initialRules={rules.success ? rules.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      rulesError={rules.success ? null : rules.error.message}
      initialProviders={providers.success ? providers.data.data : []}
      providersError={providers.success ? null : providers.error.message}
    />
  );
}
