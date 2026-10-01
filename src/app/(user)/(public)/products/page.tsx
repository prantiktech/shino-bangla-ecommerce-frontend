import React from "react";
import type { Metadata } from "next";
import { ProductListing, ListingSearchParams } from "./_components/listing";

interface PageProps {
  searchParams: Promise<ListingSearchParams>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const { category, q } = resolved;

  let title = "All Products";
  if (category) {
    title = `${category.replace(/-/g, " ").toUpperCase()} Products`;
  } else if (q) {
    title = `Search results for "${q}"`;
  }

  return {
    title,
    description: "Browse our genuine selection of quality products, hardware, safety gear, and books in Bangladesh at Nogod Bazar.",
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  return <ProductListing params={await searchParams} basePath="/products" />;
}
