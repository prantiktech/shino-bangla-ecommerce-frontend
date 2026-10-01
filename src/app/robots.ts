import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/api/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/orders", "/checkout", "/api/", "/login", "/register", "/forgot-password", "/newsletter/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
