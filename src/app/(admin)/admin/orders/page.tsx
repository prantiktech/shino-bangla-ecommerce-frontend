import React from "react";
import { getAdminOrdersAction } from "@/app/(admin)/actions/orders";
import { OrdersManagement } from "./_components/OrdersManagement";

export const metadata = {
  title: "Admin Orders | Store Management",
};

export default async function AdminOrdersPage() {
  const res = await getAdminOrdersAction();
  const orders = res.success ? (Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : []) : [];

  return <OrdersManagement initialOrders={orders} />;
}
