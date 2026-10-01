import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { API_BASE_URL, SITE_URL } from "@/lib/api/config";

const PATHS: Record<string, (slug: string) => string> = {
  products: (s) => `/products/${s}`,
  categories: (s) => `/category/${s}`,
  brands: (s) => `/brand/${s}`,
  pages: (s) => `/pages/${s}`,
};

interface SitemapPage {
  items?: { slug: string; updated_at: string }[];
  has_more?: boolean;
}

/**
 * Every slug of one type from the public GET /sitemap endpoint (up to 1000 per page).
 * Cached for hours. Uses a plain fetch: the endpoint is public, and cached
 * functions must not read cookies, which the shared API client does.
 */
async function allItems(type: string) {
  "use cache";
  cacheLife("hours");
  const out: { slug: string; updated_at: string }[] = [];
  for (let page = 1; page <= 50; page++) {
    try {
      const res = await fetch(`${API_BASE_URL}/sitemap?type=${type}&page=${page}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) break;
      const body = (await res.json()) as { data?: SitemapPage };
      out.push(...(body.data?.items ?? []));
      if (!body.data?.has_more) break;
    } catch {
      break;
    }
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ["", "/products", "/deals", "/brands", "/blogs", "/faq", "/contact", "/track-order"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.6,
  }));

  const dynamic = await Promise.all(
    Object.entries(PATHS).map(async ([type, toPath]) =>
      (await allItems(type)).map((i) => ({
        url: `${SITE_URL}${toPath(i.slug)}`,
        lastModified: i.updated_at ? new Date(i.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: type === "products" ? 0.8 : 0.7,
      }))
    )
  );

  return [...staticPages, ...dynamic.flat()];
}
