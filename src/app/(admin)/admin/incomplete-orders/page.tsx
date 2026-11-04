import React from "react";
import { getAdminIncompleteOrdersAction } from "@/app/(admin)/actions/incomplete-orders";
import type { IncompleteOrder } from "@/types/admin-orders";
import { IncompleteOrdersManagement } from "./_components/IncompleteOrdersManagement";

export default async function AdminIncompleteOrdersPage() {
  const res = await getAdminIncompleteOrdersAction({ status: "incomplete", per_page: 20 });

  return (
    <IncompleteOrdersManagement
      initial={
        res.success
          ? res.data
          : {
              data: [] as IncompleteOrder[],
              meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
            }
      }
      initialError={res.success ? null : res.error.message}
    />
  );
}
