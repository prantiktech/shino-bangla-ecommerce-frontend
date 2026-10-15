import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api/config";

/**
 * POST /api/business-applications → POST {API}/business-applications
 *
 * The wholesale form carries up to five 4 MB files, above the 1 MB Server Action limit, so the
 * multipart body is passed to the API as-is instead of going through a Server Action.
 * It is buffered (not streamed) so the API always gets a plain Content-Length request.
 */

// Five files of 4 MB plus text fields and multipart overhead.
const MAX_BODY_BYTES = 21 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ message: "Send the application as multipart/form-data.", code: "BAD_REQUEST" }, { status: 400 });
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "The files are too large. Each file must be 4 MB or smaller.", code: "PAYLOAD_TOO_LARGE" },
      { status: 413 }
    );
  }
  let payload: ArrayBuffer;
  try {
    payload = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ message: "The upload was interrupted. Please try again.", code: "BAD_REQUEST" }, { status: 400 });
  }
  // Content-Length can be missing or wrong; check what actually arrived.
  if (payload.byteLength === 0) {
    return NextResponse.json({ message: "The application is empty.", code: "BAD_REQUEST" }, { status: 400 });
  }
  if (payload.byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "The files are too large. Each file must be 4 MB or smaller.", code: "PAYLOAD_TOO_LARGE" },
      { status: 413 }
    );
  }

  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": contentType };

  // Signed-in customers are linked to their application (the endpoint also works for visitors).
  const token = (await cookies()).get("customer_token")?.value;
  if (token) headers.Authorization = `Bearer ${token}`;

  // Let the API rate-limit and audit by the visitor's address, not this server's.
  const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

  try {
    const upstream = await fetch(`${API_BASE_URL}/business-applications`, {
      method: "POST",
      headers,
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });

    const text = await upstream.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: upstream.ok ? "Application received." : "The application could not be sent.", code: "BAD_GATEWAY" };
    }
    return NextResponse.json(body, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        message: timedOut ? "The upload took too long. Please try again on a faster connection." : "We could not reach the server. Please try again.",
        code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}
