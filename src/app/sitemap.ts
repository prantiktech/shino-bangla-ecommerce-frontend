import type { MetadataRoute } from "next";
import { getSitemapAction } from "@/app/(user)/actions/content";
import { SITE_URL } from "@/lib/api/config";

export const revalidate = 3600;

const PATHS: Record<string, (slug: string) => string> = {
  products: (s) => `/products/${s}`,
  categories: (s) => `/category/${s}`,
  brands: (s) => `/brand/${s}`,
  pages: (s) => `/pages/${s}`,
};

/** Every page of slugs for one type (the API returns up to 1000 per page). */
async function allItems(type: string) {
  const out: { slug: string; updated_at: string }[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await getSitemapAction(type, page);
    if (!res.success) break;
    out.push(...(res.data.items ?? []));
    if (!res.data.has_more) break;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = ["", "/products", "/brands", "/blogs", "/faq", "/contact", "/track-order"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.6,
  }));

  const dynamic = await Promise.all(
    Object.entries(PATHS).map(async ([type, toPath]) =>
      (await allItems(type)).map((i) => ({
        url: `${SITE_URL}${toPath(i.slug)}`,
        lastModified: i.updated_at ? new Date(i.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: type === "products" ? 0.8 : 0.7,
      }))
    )
  );

  return [...staticPages, ...dynamic.flat()];
}
