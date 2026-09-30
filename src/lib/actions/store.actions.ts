"use server";

import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api/config";
import {
  ApiCategory,
  ApiProduct,
  ApiResponse,
  Order,
  PaginatedResponse,
  ProductFilterParams,
  StoreSettings
} from "@/lib/api/types";

const COOKIE_NAME = "customer_token";

/**
 * Server Action: Fetch Categories Tree on Server
 */
export async function getCategoriesServer(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CATEGORIES}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 } // revalidate every 5 minutes
    });

    if (!res.ok) return [];
    const data: ApiResponse<ApiCategory[]> = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

/**
 * Server Action: Fetch Products Catalog on Server with Filters
 */
export async function getProductsServer(
  params?: ProductFilterParams
): Promise<PaginatedResponse<ApiProduct> | null> {
  try {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          url.searchParams.append(key, String(val));
        }
      });
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 } // revalidate every 60 seconds
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Server Action: Fetch Single Product by Slug on Server
 */
export async function getProductBySlugServer(slug: string): Promise<ApiProduct | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCT_BY_SLUG(slug)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }
    });

    if (!res.ok) return null;
    const data: ApiResponse<ApiProduct> = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

/**
 * Server Action: Fetch Customer Orders on Server using HttpOnly cookie
 */
export async function getMyOrdersServer(page = 1): Promise<PaginatedResponse<Order> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MY_ORDERS}?page=${page}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Server Action: Fetch Public Store Settings on Server
 */
export async function getSettingsServer(): Promise<StoreSettings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SETTINGS}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 } // revalidate 1 hour
    });

    if (!res.ok) return null;
    const data: ApiResponse<StoreSettings> = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}
