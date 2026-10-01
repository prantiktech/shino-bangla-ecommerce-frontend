import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { API_BASE_URL as API_BASE } from "@/lib/api/config";

/** Only these back-office file endpoints may be proxied. */
const ALLOWED: { pattern: RegExp; query: string[]; fallbackName: string }[] = [
  { pattern: /^\/admin\/orders\/\d+\/invoice$/, query: [], fallbackName: "invoice.pdf" },
  { pattern: /^\/admin\/products\/export$/, query: ["format", "status", "brand_id", "category_id"], fallbackName: "products.xlsx" },
  { pattern: /^\/admin\/product-imports\/template$/, query: ["format"], fallbackName: "product-import-template.xlsx" },
  { pattern: /^\/admin\/report-exports\/\d+\/download$/, query: [], fallbackName: "report" },
];

/**
 * GET /api/admin/download?path=/admin/orders/5/invoice
 * Streams a file from the API using the signed-in staff member's token.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "";
  const rule = ALLOWED.find((r) => r.pattern.test(path));
  if (!rule) {
    return NextResponse.json({ error: "Not allowed" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Please sign in to the admin panel again." }, { status: 401 });
  }

  const upstream = new URL(API_BASE + path);
  for (const key of rule.query) {
    const v = url.searchParams.get(key);
    if (v) upstream.searchParams.set(key, v);
  }

  try {
    const res = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
      cache: "no-store",
    });

    if (!res.ok) {
      let message = `Download failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        /* not JSON */
      }
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("content-type") || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      res.headers.get("content-disposition") || `attachment; filename="${rule.fallbackName}"`
    );
    const len = res.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    headers.set("Cache-Control", "no-store");

    return new NextResponse(res.body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
