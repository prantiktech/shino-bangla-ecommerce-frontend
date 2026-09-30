"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { cookies } from "next/headers";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roles?: string[];
  permissions?: string[];
}

export async function loginAction(
  login: string,
  password: string
): Promise<ActionResponse<{ user: UserProfile; token: string }>> {
  try {
    const res = await serverPost<any>("LOGIN", { login, password });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      const rawToken = data.token?.token || data.token || data.access_token;
      const user = data.user || data;

      if (rawToken) {
        const cookieStore = await cookies();
        cookieStore.set("token", rawToken, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        cookieStore.set("client-token", rawToken, {
          path: "/",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        // Also claim guest cart if any
        const guestCartToken = cookieStore.get("cart_token")?.value;
        if (guestCartToken) {
          try {
            await serverPost("CLAIM_CART", { token: guestCartToken });
          } catch {
            // ignore
          }
        }
      }

      return {
        success: true,
        data: { user, token: rawToken },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Invalid credentials") : "Login failed",
        code: "AUTH_LOGIN_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function logoutAction(): Promise<ActionResponse<boolean>> {
  try {
    await serverPost("LOGOUT").catch(() => {});
    const cookieStore = await cookies();
    cookieStore.delete("token");
    cookieStore.delete("client-token");
    return { success: true, data: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getMeAction(): Promise<ActionResponse<UserProfile>> {
  try {
    const res = await serverGet<any>("GET_ME");
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Unauthenticated") : "Unauthenticated",
        code: "UNAUTHENTICATED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
