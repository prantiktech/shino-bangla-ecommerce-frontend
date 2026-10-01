import { NextResponse } from "next/server";
import { getHealthAction } from "@/app/(user)/actions/content";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — uptime check for the storefront and its API.
 * Returns 200 when the backend answers its health endpoint, 503 otherwise.
 */
export async function GET() {
  const started = Date.now();
  const res = await getHealthAction();
  const body = {
    storefront: "ok",
    api: res.success ? res.data.status ?? "ok" : "unreachable",
    latency_ms: Date.now() - started,
    checked_at: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: res.success ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
