import { API_BASE_URL, STORAGE_KEYS } from "./config";
import { ApiErrorResponse } from "./types";

export class ApiError extends Error {
  code: string;
  requestId?: string;
  errors?: Record<string, string[]>;
  status: number;

  constructor(errorData: ApiErrorResponse, status: number) {
    super(errorData.message || "An unexpected API error occurred.");
    this.name = "ApiError";
    this.code = errorData.code || "UNKNOWN_ERROR";
    this.requestId = errorData.request_id;
    this.errors = errorData.errors;
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      // Primary: localStorage (legacy support)
      const fromStorage = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (fromStorage) return fromStorage;

      // Fallback: read from the non-HttpOnly `client-token` cookie set by loginAction
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("client-token="));
      return match ? decodeURIComponent(match.split("=")[1]) : null;
    } catch {
      return null;
    }
  }

  private getCartToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      // Primary: localStorage
      const fromStorage =
        localStorage.getItem(STORAGE_KEYS.CART_TOKEN) ||
        localStorage.getItem("cart_token") ||
        localStorage.getItem("shino_cart_token");
      if (fromStorage) return fromStorage;

      // Fallback: cart_token cookie
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cart_token=") || row.startsWith("shino_cart_token="));
      return match ? decodeURIComponent(match.split("=")[1]) : null;
    } catch {
      return null;
    }
  }


  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, skipAuth, ...customConfig } = options;

    const headers = new Headers(customHeaders);
    headers.set("Accept", "application/json");

    // Automatically set Content-Type to JSON if payload is present and not FormData
    if (customConfig.body && !(customConfig.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Attach Sanctum Bearer token if available
    if (!skipAuth) {
      const authToken = this.getAuthToken();
      if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
      }
    }

    // Attach X-Cart-Token for guest cart operations
    const cartToken = this.getCartToken();
    if (cartToken) {
      headers.set("X-Cart-Token", cartToken);
    }

    const config: RequestInit = {
      ...customConfig,
      headers
    };

    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, config);

      // Handle 204 No Content
      if (response.status === 204) {
        return null as unknown as T;
      }

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorData: ApiErrorResponse = isJson
          ? data
          : { message: response.statusText, code: "HTTP_ERROR" };
        throw new ApiError(errorData, response.status);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        {
          message: err.message || "Network request failed. Please check your connection.",
          code: "NETWORK_ERROR"
        },
        0
      );
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const payload = body instanceof FormData ? body : JSON.stringify(body);
    return this.request<T>(endpoint, { ...options, method: "POST", body: payload });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const payload = body instanceof FormData ? body : JSON.stringify(body);
    return this.request<T>(endpoint, { ...options, method: "PUT", body: payload });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const payload = body instanceof FormData ? body : JSON.stringify(body);
    return this.request<T>(endpoint, { ...options, method: "PATCH", body: payload });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
