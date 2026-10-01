import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/lib/actions/auth.actions";
import { getAddressesAction } from "@/app/(user)/actions/addresses";
import { getCheckoutLocationsAction } from "@/app/(user)/actions/checkout";
import { CheckoutClient } from "./_components/CheckoutClient";

export const metadata: Metadata = {
  title: "Secure Checkout | Nogod Bazar",
  description: "Complete your order with cash on delivery or instant digital payment.",
};

export default async function CheckoutPage() {
  const { user } = await getCurrentUserAction();

  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  const [addressesRes, locationsRes] = await Promise.all([
    getAddressesAction(),
    getCheckoutLocationsAction(),
  ]);

  const initialAddresses = addressesRes.success ? addressesRes.data : [];
  const locations = locationsRes.success
    ? locationsRes.data.map((l: any) => ({
        id: l.id,
        name: l.name,
      }))
    : [
        { id: 21, name: "Dhaka" },
        { id: 9, name: "Chattogram" },
        { id: 69, name: "Sylhet" },
        { id: 51, name: "Rajshahi" },
        { id: 35, name: "Khulna" },
        { id: 3, name: "Barishal" },
        { id: 60, name: "Rangpur" },
        { id: 46, name: "Mymensingh" },
      ];

  return <CheckoutClient initialAddresses={initialAddresses} locations={locations} />;
}
