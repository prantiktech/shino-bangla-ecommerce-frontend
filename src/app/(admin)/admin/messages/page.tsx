import type { Metadata } from "next";
import { getAdminMessagesAction } from "@/app/(admin)/actions/content";
import { MessagesInbox } from "./_components/MessagesInbox";
import { guardAdminPage } from "@/app/(admin)/session";
import { AccessDenied } from "@/app/(admin)/components/AccessDenied";

export const metadata: Metadata = { title: "Inbox | Admin Portal" };

export default async function AdminMessagesPage() {
  const access = await guardAdminPage("/admin/messages");
  if (!access.allowed) return <AccessDenied needed={access.needed} fallback={access.fallback} />;

  const res = await getAdminMessagesAction();
  return (
    <MessagesInbox
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
