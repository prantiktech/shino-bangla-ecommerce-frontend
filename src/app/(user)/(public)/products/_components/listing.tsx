import React from "react";
import { getProductFacetsAction, getProductsAction } from "@/app/(user)/actions/products";
import { getCategoriesAction } from "@/app/(user)/actions/categories";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { poishaToTaka, takaToPoisha } from "@/lib/utils/money";
import { ProductsView } from "./products-view";

export interface ListingSearchParams {
  category?: string;
  subCategory?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  inStock?: string;
  brand?: string;
  rating?: string;
  /** Variant option filters as "typeId:value" pairs, comma separated. */
  opt?: string;
}

interface FacetBrand {
  slug?: string;
  name?: string;
  count?: number;
  products_count?: number;
}

/**
 * Shared server-side product listing used by /products and /deals.
 * Builds the API query from the URL, and loads facet counts for the same filters.
 */
export async function ProductListing({
  params,
  basePath,
  forcedFlag,
  heading,
}: {
  params: ListingSearchParams;
  basePath: string;
  forcedFlag?: "on_sale" | "featured" | "trending" | "new_arrival" | "best_seller";
  heading?: { title: string; subtitle?: string };
}) {
  const { category, subCategory, q, minPrice, maxPrice, sort, page, inStock, brand, rating, opt } = params;
  const optionPairs = (opt ?? "")
    .split(",")
    .map((p) => p.split(":"))
    .filter((p): p is [string, string] => p.length === 2 && /^\d+$/.test(p[0]) && !!p[1]);
  const brands = (brand ?? "").split(",").map((b) => b.trim()).filter(Boolean);

  const query: Record<string, string | number> = { per_page: 24 };
  if (q) query.q = q;
  if (subCategory || category) query.category = (subCategory || category)!;
  if (minPrice) query.price_min = takaToPoisha(Number(minPrice));
  if (maxPrice) query.price_max = takaToPoisha(Number(maxPrice));
  if (inStock === "true") query.in_stock = 1;
  if (brands.length) query.brand = brands.join(",");
  if (rating && Number(rating) > 0) query.rating_min = Number(rating);
  if (forcedFlag) query.flag = forcedFlag;
  // option[{type id}][]=value — repeated keys are encoded by index so the query builder keeps them all.
  const counters: Record<string, number> = {};
  for (const [typeId, value] of optionPairs) {
    const i = (counters[typeId] = (counters[typeId] ?? -1) + 1);
    query[`option[${typeId}][${i}]`] = value;
  }
  if (sort && sort !== "default") query.sort = sort;

  // Facets describe the same result set, so brand and price lists stay relevant.
  const facetQuery = { ...query };
  delete facetQuery.per_page;
  delete facetQuery.brand;

  const [productsRes, categoriesRes, facetsRes] = await Promise.all([
    getProductsAction({ ...query, ...(page ? { page: Number(page) } : {}) }),
    getCategoriesAction(),
    getProductFacetsAction(facetQuery),
  ]);

  const facets = facetsRes.success ? facetsRes.data : null;
  const brandOptions = ((facets?.brands ?? []) as FacetBrand[])
    .filter((b) => b.slug)
    .map((b) => ({ slug: b.slug!, name: b.name ?? b.slug!, count: b.count ?? b.products_count }));
  const priceCeiling = facets?.price?.max ? Math.ceil(poishaToTaka(facets.price.max) / 100) * 100 : 100000;

  return (
    <ProductsView
      products={productsRes.success ? productsRes.data.items.map(mapApiProductToProduct) : []}
      totalCount={productsRes.success ? productsRes.data.total : 0}
      currentPage={productsRes.success ? productsRes.data.currentPage : 1}
      lastPage={productsRes.success ? productsRes.data.lastPage : 1}
      categories={categoriesRes.success ? categoriesRes.data : []}
      basePath={basePath}
      heading={heading}
      facets={{
        brands: brandOptions,
        ratings: (facets?.ratings ?? []) as { min: number; count?: number }[],
        inStock: typeof facets?.in_stock === "number" ? facets.in_stock : undefined,
        priceCeiling,
        options: ((facets?.options ?? []) as { id: number; name: string; values: { value: string; label: string; count?: number }[] }[]).filter(
          (o) => o.values?.length
        ),
      }}
      initialFilters={{
        category,
        subCategory,
        q,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
        brands,
        rating: rating ? Number(rating) : 0,
        inStock: inStock === "true",
        options: optionPairs.map(([t, v]) => `${t}:${v}`),
      }}
    />
  );
}
