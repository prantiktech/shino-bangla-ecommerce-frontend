import { redirect } from "next/navigation";
import { getSessionUserAction } from "@/app/(user)/actions/auth";
import { getOrdersAction } from "@/app/(user)/actions/orders";
import { getAddressesAction } from "@/app/(user)/actions/addresses";
import { getCheckoutLocationsAction } from "@/app/(user)/actions/checkout";
import { getWishlistAction } from "@/app/(user)/actions/wishlist";
import { getReviewableItemsAction, getMyReviewsAction } from "@/app/(user)/actions/reviews";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata = {
  title: "My Account",
  description: "View and manage your customer account, addresses, order history, wishlist, and reviews.",
};

/**
 * Next.js 16 Server Component: Server-Side Customer Account Page
 * Authenticates via HttpOnly cookie and fetches data directly on the server
 */
interface AccountPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { user } = await getSessionUserAction();

  // Secure server-side redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  const resolved = await searchParams;
  const TABS = ["orders", "addresses", "profile", "overview", "wishlist", "reviews", "security"] as const;
  type Tab = (typeof TABS)[number];
  const initialTab: Tab = TABS.includes(resolved?.tab as Tab) ? (resolved.tab as Tab) : "orders";

  // Fetch customer orders, addresses, locations, wishlist, and reviews in parallel
  const [ordersRes, addressesRes, locationsRes, wishlistRes, reviewablesRes, reviewsRes] = await Promise.all([
    getOrdersAction(),
    getAddressesAction(),
    getCheckoutLocationsAction(),
    getWishlistAction(),
    getReviewableItemsAction(),
    getMyReviewsAction(),
  ]);

  const initialOrders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
  const initialAddresses = addressesRes.success && addressesRes.data ? addressesRes.data : [];
  const locations = locationsRes.success && locationsRes.data ? locationsRes.data : [];
  const initialWishlist = wishlistRes.success && wishlistRes.data ? wishlistRes.data : [];
  const initialReviewables = reviewablesRes.success && reviewablesRes.data ? reviewablesRes.data : [];
  const initialReviews = reviewsRes.success && reviewsRes.data ? reviewsRes.data : [];

  return (
    <AccountDashboard
      initialUser={user}
      initialOrders={initialOrders}
      initialAddresses={initialAddresses}
      locations={locations}
      initialWishlist={initialWishlist}
      initialReviewables={initialReviewables}
      initialReviews={initialReviews}
      defaultTab={initialTab}
    />
  );
}

