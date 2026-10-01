"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { cookies } from "next/headers";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

export async function adminLoginAction(
  email: string,
  password: string,
  deviceName: string = "web"
): Promise<ActionResponse<{ user: AdminUser; token: string }>> {
  try {
    const res = await serverPost<any>("ADMIN_LOGIN", {
      login: email.trim(),
      password,
      device_name: deviceName,
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      const rawToken = data.token?.token || data.token || data.access_token;
      const user = data.user || data;

      // Verify that this user is staff or administrator
      const isStaffOrAdmin =
        user.is_staff ||
        (Array.isArray(user.roles) && (user.roles.includes("super-admin") || user.roles.includes("admin")));

      if (!isStaffOrAdmin) {
        return {
          success: false,
          error: {
            message: "Access denied. Administrator privileges are required to access this portal.",
            code: "FORBIDDEN",
          },
        };
      }

      if (rawToken) {
        const cookieStore = await cookies();
        const cookieOpts = {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          maxAge: 60 * 60 * 24 * 7,
        };

        cookieStore.set("admin_token", rawToken, {
          ...cookieOpts,
          httpOnly: true,
        });

        cookieStore.set("admin_client_token", rawToken, {
          ...cookieOpts,
          httpOnly: false,
        });

        cookieStore.set("token", rawToken, {
          ...cookieOpts,
          httpOnly: true,
        });

        cookieStore.set("client-token", rawToken, {
          ...cookieOpts,
          httpOnly: false,
        });
      }

      return {
        success: true,
        data: { user, token: rawToken },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Invalid admin credentials") : "Admin login failed",
        code: "ADMIN_LOGIN_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function adminLogoutAction(): Promise<ActionResponse<boolean>> {
  try {
    await serverPost("ADMIN_LOGOUT").catch(() => {});
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    cookieStore.delete("admin_client_token");
    return { success: true, data: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAdminMeAction(): Promise<ActionResponse<AdminUser>> {
  try {
    const res = await serverGet<any>("GET_ADMIN_ME");
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Unauthorized") : "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
