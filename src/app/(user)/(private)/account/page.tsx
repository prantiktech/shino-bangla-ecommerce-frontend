import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/lib/actions/auth.actions";
import { getMyOrdersServer } from "@/lib/actions/store.actions";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata = {
  title: "My Account - Cembula / Toy House",
  description: "View and manage your customer account, addresses, and order history."
};

/**
 * Next.js 16 Server Component: Server-Side Customer Account Page
 * Authenticates via HttpOnly cookie and fetches data directly on the server
 */
export default async function AccountPage() {
  const { user } = await getCurrentUserAction();

  // Secure server-side redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Fetch customer orders on server
  const ordersData = await getMyOrdersServer(1);
  const orders = ordersData?.data || [];

  return <AccountDashboard initialUser={user} initialOrders={orders} />;
}
