import { NextResponse, connection } from "next/server";
import { getHealthAction } from "@/app/(user)/actions/content";

/**
 * GET /api/health — uptime check for the storefront and its API.
 * Returns 200 when the backend answers its health endpoint, 503 otherwise.
 * `connection()` keeps this request-time (never cached or prerendered).
 */
export async function GET() {
  await connection();
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
