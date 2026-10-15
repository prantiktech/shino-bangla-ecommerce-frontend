import type { Metadata } from "next";
import { getAdminCampaignsAction, getAdminSubscribersAction } from "@/app/(admin)/actions/newsletter";
import { NewsletterManagement } from "./_components/NewsletterManagement";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Newsletter | Admin Portal" };

const empty = { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } };

export default async function AdminNewsletterPage() {
  const access = await guardAdminPage("/admin/newsletter");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const [subs, campaigns, active] = await Promise.all([
    getAdminSubscribersAction(),
    getAdminCampaignsAction(),
    getAdminSubscribersAction({ subscribed: 1, per_page: 1 }),
  ]);
  return (
    <NewsletterManagement
      initialSubscribers={subs.success ? subs.data : empty}
      initialCampaigns={campaigns.success ? campaigns.data : empty}
      activeCount={active.success ? active.data.meta.total : null}
      initialError={!subs.success ? subs.error.message : !campaigns.success ? campaigns.error.message : null}
    />
  );
}
