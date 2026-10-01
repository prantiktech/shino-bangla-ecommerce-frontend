"use server";

import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api/config";
import { ApiResponse, LoginResponseData, User } from "@/lib/api/types";

const COOKIE_NAME = "customer_token";
const CART_COOKIE_NAME = "cart_token";

/**
 * Server Action: Authenticate Customer and securely store token in HttpOnly Cookie
 */
export async function loginAction(payload: {
  login: string;
  password: string;
  device_name?: string;
}): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGIN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        login: payload.login,
        password: payload.password,
        device_name: payload.device_name || "web"
      }),
      cache: "no-store"
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || "Invalid credentials. Please try again."
      };
    }

    const loginData: LoginResponseData = data.data;
    const token = loginData.token.token;

    // Securely set cookies
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    cookieStore.set("client-token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    // If this account has staff or admin privileges, activate admin cookies as well
    const isStaffOrAdmin =
      loginData.user.is_staff ||
      (Array.isArray(loginData.user.roles) &&
        (loginData.user.roles.includes("super-admin") || loginData.user.roles.includes("admin")));

    if (isStaffOrAdmin) {
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookieStore.set("admin_client_token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // If there is an existing guest cart token, claim it on the backend
    const guestCartToken = cookieStore.get(CART_COOKIE_NAME)?.value;
    if (guestCartToken) {
      try {
        await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART_CLAIM}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "X-Cart-Token": guestCartToken
          },
          cache: "no-store"
        });
        // Clear guest cart cookie once claimed
        cookieStore.delete(CART_COOKIE_NAME);
      } catch {
        // Continue even if claim fails
      }
    }

    return {
      success: true,
      user: loginData.user,
      token
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred during login."
    };
  }
}

/**
 * Server Action: Invalidate session and delete customer cookie
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get("token")?.value;

  if (token) {
    try {
      await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGOUT}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Ignore network errors on logout
    }
  }

  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("token");
  cookieStore.delete("client-token");
  cookieStore.delete("admin_token");
  cookieStore.delete("admin_client_token");
  return { success: true };
}

/**
 * Server Action: Get currently logged-in customer profile from secure cookie
 */
export async function getCurrentUserAction(): Promise<{
  user: User | null;
  token: string | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get("token")?.value || null;

  if (!token) {
    return { user: null, token: null };
  }

  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ME}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      // Token is invalid/expired: delete cookie
      cookieStore.delete(COOKIE_NAME);
      cookieStore.delete("token");
      cookieStore.delete("client-token");
      return { user: null, token: null };
    }

    const data: ApiResponse<User> = await res.json();
    return { user: data.data, token };
  } catch {
    return { user: null, token: null };
  }
}

/**
 * Server Action: Read/Write guest cart token in cookie
 */
export async function getCartTokenAction(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value || null;
}

export async function setCartTokenAction(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}
