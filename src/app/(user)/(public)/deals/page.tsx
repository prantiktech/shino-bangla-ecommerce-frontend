import type { Metadata } from "next";
import { ProductListing, ListingSearchParams } from "../products/_components/listing";

export const metadata: Metadata = {
  title: "Deals & discounts",
  description: "Discounted products and limited-time offers at Nogod Bazar.",
};

export default async function DealsPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  return (
    <ProductListing
      params={await searchParams}
      basePath="/deals"
      forcedFlag="on_sale"
      heading={{ title: "Deals & discounts", subtitle: "Every product currently on sale." }}
    />
  );
}
