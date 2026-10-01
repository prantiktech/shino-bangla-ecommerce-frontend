/**
 * Shared helpers for back-office server actions.
 *
 * Not a "use server" module itself: it is imported by the action files, which are.
 * Every helper returns an ActionResponse and never throws, so UI code can branch on `success`.
 */
import { serverGet, serverPost, serverPut, serverPatch, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import type { TargetEndpoint } from "@/lib/api-client/endpoints";

export type QueryParams = Record<string, string | number | boolean | undefined | null>;
export type PathParams = Record<string, string | number>;

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Raw JSON body returned by the API: `{ data, meta?, links? }` or a bare value. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonBody = any;

interface RequestOptions {
  params?: QueryParams;
  pathParams?: PathParams;
  body?: unknown;
}

/** Drop empty query values so the API never sees `?q=&status=`. */
function cleanParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

async function send(method: Method, endpoint: TargetEndpoint, opts: RequestOptions) {
  const config = { params: cleanParams(opts.params), pathParams: opts.pathParams, cache: "no-store" as const };
  switch (method) {
    case "GET":
      return serverGet<JsonBody>(endpoint, config);
    case "POST":
      return serverPost<JsonBody>(endpoint, opts.body, config);
    case "PUT":
      return serverPut<JsonBody>(endpoint, opts.body, config);
    case "PATCH":
      return serverPatch<JsonBody>(endpoint, opts.body, config);
    case "DELETE":
      return serverDelete<JsonBody>(endpoint, config);
  }
}

function failure(res: { success: false; error?: { message?: string; code?: string; status?: number; fields?: Record<string, string[]> } }, fallback: string, code: string) {
  return {
    success: false as const,
    error: {
      message: res.error?.message || fallback,
      code: res.error?.code || code,
      status: res.error?.status,
      fields: res.error?.fields,
    },
  };
}

/** Request whose response is `{ data: T }`; resolves to `T`. */
export async function adminRequest<T>(
  method: Method,
  endpoint: TargetEndpoint,
  fallbackMessage: string,
  opts: RequestOptions = {}
): Promise<ActionResponse<T>> {
  try {
    const res = await send(method, endpoint, opts);
    if (!res.success) return failure(res, fallbackMessage, "REQUEST_FAILED");
    const body = res.data;
    const data = body && typeof body === "object" && "data" in body ? body.data : body;
    return { success: true, data: (data ?? null) as T };
  } catch (error) {
    return handleActionError(error);
  }
}

/** List request; works for both paginated `{data, meta}` and plain `{data: []}` responses. */
export async function adminList<T>(
  endpoint: TargetEndpoint,
  fallbackMessage: string,
  params?: QueryParams,
  pathParams?: PathParams
): Promise<ActionResponse<Paginated<T>>> {
  try {
    const res = await send("GET", endpoint, { params, pathParams });
    if (!res.success) return failure(res, fallbackMessage, "LIST_FAILED");
    const body = res.data ?? {};
    const items: T[] = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
    const m = body.meta ?? {};
    const meta: PaginationMeta = {
      current_page: Number(m.current_page ?? 1),
      last_page: Number(m.last_page ?? 1),
      per_page: Number(m.per_page ?? items.length),
      total: Number(m.total ?? items.length),
      from: m.from ?? null,
      to: m.to ?? null,
    };
    return { success: true, data: { data: items, meta } };
  } catch (error) {
    return handleActionError(error);
  }
}

/** Request for endpoints answering `204 No Content`. */
export async function adminVoid(
  method: Method,
  endpoint: TargetEndpoint,
  fallbackMessage: string,
  opts: RequestOptions = {}
): Promise<ActionResponse<true>> {
  try {
    const res = await send(method, endpoint, opts);
    if (!res.success) return failure(res, fallbackMessage, "REQUEST_FAILED");
    return { success: true, data: true };
  } catch (error) {
    return handleActionError(error);
  }
}
