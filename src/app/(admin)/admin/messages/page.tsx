import type { Metadata } from "next";
import { getAdminMessagesAction } from "@/app/(admin)/actions/content";
import { MessagesInbox } from "./_components/MessagesInbox";

export const metadata: Metadata = { title: "Inbox | Admin Portal" };

export default async function AdminMessagesPage() {
  const res = await getAdminMessagesAction();
  return (
    <MessagesInbox
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
