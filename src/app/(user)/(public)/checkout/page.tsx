import React from "react";
import { Metadata } from "next";
import { getAddressesAction } from "@/app/(user)/actions/addresses";
import { getCheckoutLocationsAction } from "@/app/(user)/actions/checkout";
import { CheckoutClient } from "./_components/CheckoutClient";

export const metadata: Metadata = {
  title: "Secure Checkout | Demo Safety Store",
  description: "Complete your order with cash on delivery or bank transfer.",
};

export default async function CheckoutPage() {
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
        { id: 1, name: "Dhaka" },
        { id: 2, name: "Chattogram" },
        { id: 3, name: "Sylhet" },
        { id: 4, name: "Rajshahi" },
        { id: 5, name: "Khulna" },
        { id: 6, name: "Barishal" },
        { id: 7, name: "Rangpur" },
        { id: 8, name: "Mymensingh" },
      ];

  return <CheckoutClient initialAddresses={initialAddresses} locations={locations} />;
}
