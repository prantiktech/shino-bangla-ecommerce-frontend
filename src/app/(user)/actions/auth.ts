"use server";

import type { User } from "@/lib/api/types";

import { serverGet, serverPost, serverPut, serverDelete } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";
import { cookies } from "next/headers";

/** The signed-in shopper, as returned by GET /me. */
export type UserProfile = User;

export interface VerificationData {
  channel: "phone" | "email" | string;
  destination: string;
  expires_in_minutes: number;
}

export interface AuthTokenItem {
  id: number;
  name: string;
  abilities: string[];
  is_current: boolean;
  last_used_at: string | null;
  expires_at: string;
  created_at: string;
}

async function setSessionCookies(rawToken: string, user?: any) {
  const cookieStore = await cookies();
  cookieStore.set("customer_token", rawToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookieStore.set("token", rawToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("client-token", rawToken, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (
    user?.is_staff ||
    (Array.isArray(user?.roles) &&
      (user.roles.includes("super-admin") || user.roles.includes("admin")))
  ) {
    cookieStore.set("admin_token", rawToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("admin_client_token", rawToken, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  // Claim guest cart if exists
  const guestCartToken = cookieStore.get("cart_token")?.value;
  if (guestCartToken) {
    try {
      await serverPost("CLAIM_CART", undefined, {
        headers: { "X-Cart-Token": guestCartToken },
      });
      cookieStore.delete("cart_token");
    } catch {
      // ignore
    }
  }
}

async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("customer_token");
  cookieStore.delete("token");
  cookieStore.delete("client-token");
  cookieStore.delete("admin_token");
  cookieStore.delete("admin_client_token");
}

/**
 * 01. Register new customer account
 * POST /api/v1/auth/register
 */
export async function registerAction(payload: {
  name: string;
  login: string;
  password: string;
  password_confirmation: string;
}): Promise<ActionResponse<{ message: string; verification: VerificationData }>> {
  try {
    const res = await serverPost<any>("REGISTER", {
      name: payload.name.trim(),
      login: payload.login.trim(),
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      return {
        success: true,
        data: {
          message: res.data.message || "We have sent you a code to verify your account.",
          verification: data.verification,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Registration failed") : "Registration failed",
        code: "AUTH_REGISTER_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 02. Verify account with OTP
 * POST /api/v1/auth/otp/verify
 */
export async function verifyOtpAction(payload: {
  login: string;
  code: string;
  device_name?: string;
  purpose?: string;
}): Promise<ActionResponse<{ user: UserProfile; token: string }>> {
  try {
    const res = await serverPost<any>("VERIFY_OTP", {
      login: payload.login.trim(),
      code: payload.code.trim(),
      device_name: payload.device_name || "web",
      purpose: payload.purpose || "verify",
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      const rawToken = data.token?.token || data.token || data.access_token;
      const user: UserProfile = data.user || data;

      if (rawToken) {
        await setSessionCookies(rawToken, user);
      }

      return {
        success: true,
        data: { user, token: rawToken },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Invalid or expired code") : "Verification failed",
        code: "AUTH_OTP_VERIFY_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 03. Resend OTP code
 * POST /api/v1/auth/otp/resend
 */
export async function resendOtpAction(payload: {
  login: string;
  purpose?: "verify" | "password_reset";
}): Promise<ActionResponse<{ message: string; verification?: VerificationData }>> {
  try {
    const res = await serverPost<any>("RESEND_OTP", {
      login: payload.login.trim(),
      purpose: payload.purpose || "verify",
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      return {
        success: true,
        data: {
          message: res.data.message || "A new code is on its way.",
          verification: data?.verification,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to resend code") : "Failed to resend code",
        code: "AUTH_OTP_RESEND_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 04. Login customer with email/phone & password
 * POST /api/v1/auth/login
 */
export async function loginAction(
  login: string,
  password: string,
  device_name?: string
): Promise<ActionResponse<{ user: UserProfile; token: string }>> {
  try {
    const res = await serverPost<any>("LOGIN", {
      login: login.trim(),
      password,
      device_name: device_name || "web",
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      const rawToken = data.token?.token || data.token || data.access_token;
      const user: UserProfile = data.user || data;

      if (rawToken) {
        await setSessionCookies(rawToken, user);
      }

      return {
        success: true,
        data: { user, token: rawToken },
      };
    }

    // Keep the API's own code (e.g. ACCOUNT_NOT_VERIFIED) so the UI can react to it.
    const apiCode = !res.success ? (res.error?.details as { code?: string } | undefined)?.code : undefined;
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Invalid credentials") : "Login failed",
        code: apiCode || "AUTH_LOGIN_FAILED",
        status: !res.success ? res.error?.status : undefined,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 05. Sign in or up with Google ID token
 * POST /api/v1/auth/google
 */
export async function googleAuthAction(
  idToken: string,
  deviceName?: string
): Promise<ActionResponse<{ user: UserProfile; token: string }>> {
  try {
    const res = await serverPost<any>("AUTH_GOOGLE", {
      id_token: idToken,
      device_name: deviceName || "web",
    });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      const rawToken = data.token?.token || data.token;
      const user: UserProfile = data.user;

      if (rawToken) {
        await setSessionCookies(rawToken, user);
      }

      return {
        success: true,
        data: { user, token: rawToken },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Google sign-in unavailable") : "Google sign-in failed",
        code: "AUTH_GOOGLE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 06. Send password reset code
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPasswordAction(
  login: string
): Promise<ActionResponse<{ message: string; verification?: VerificationData }>> {
  try {
    const res = await serverPost<any>("FORGOT_PASSWORD", { login: login.trim() });

    if (res.success && res.data) {
      const data = res.data.data || res.data;
      return {
        success: true,
        data: {
          message: res.data.message || "A reset code is on its way.",
          verification: data?.verification,
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to send reset code") : "Failed to send reset code",
        code: "AUTH_FORGOT_PASSWORD_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 07. Reset password with OTP code
 * POST /api/v1/auth/reset-password
 */
export async function resetPasswordAction(payload: {
  login: string;
  code: string;
  password: string;
  password_confirmation: string;
}): Promise<ActionResponse<{ message: string }>> {
  try {
    const res = await serverPost<any>("RESET_PASSWORD", {
      login: payload.login.trim(),
      code: payload.code.trim(),
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    });

    if (res.success) {
      return {
        success: true,
        data: {
          message: res.data?.message || "Your password has been reset. Please sign in again.",
        },
      };
    }

    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to reset password") : "Failed to reset password",
        code: "AUTH_RESET_PASSWORD_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 08. Logout customer
 * POST /api/v1/auth/logout
 */
export async function logoutAction(): Promise<ActionResponse<boolean>> {
  try {
    await serverPost("LOGOUT").catch(() => {});
    await clearSessionCookies();
    return { success: true, data: true };
  } catch (error) {
    await clearSessionCookies();
    return handleActionError(error);
  }
}

/**
 * 09. Logout from all devices
 * POST /api/v1/auth/logout-all
 */
export async function logoutAllAction(): Promise<ActionResponse<boolean>> {
  try {
    await serverPost("LOGOUT_ALL").catch(() => {});
    await clearSessionCookies();
    return { success: true, data: true };
  } catch (error) {
    await clearSessionCookies();
    return handleActionError(error);
  }
}

/**
 * 11. List active devices / tokens
 * GET /api/v1/auth/tokens
 */
export async function getAuthTokensAction(): Promise<ActionResponse<AuthTokenItem[]>> {
  try {
    const res = await serverGet<any>("AUTH_TOKENS");
    if (res.success && res.data) {
      const items = res.data.data || res.data;
      return { success: true, data: Array.isArray(items) ? items : [] };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load devices") : "Failed to load devices",
        code: "GET_TOKENS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 12. Revoke one device token
 * DELETE /api/v1/auth/tokens/{token}
 */
export async function revokeAuthTokenAction(
  token: number | string
): Promise<ActionResponse<boolean>> {
  try {
    const res = await serverDelete<any>("REVOKE_TOKEN", {
      pathParams: { token },
    });
    if (res.success) {
      return { success: true, data: true };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to revoke token") : "Failed to revoke token",
        code: "REVOKE_TOKEN_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 14. Update customer name
 * PUT /api/v1/me
 */
export async function updateMeAction(name: string): Promise<ActionResponse<UserProfile>> {
  try {
    const res = await serverPut<any>("UPDATE_ME", { name: name.trim() });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to update profile") : "Failed to update profile",
        code: "UPDATE_ME_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 15. Change email or mobile number: send code
 * POST /api/v1/me/contact
 */
export async function changeContactAction(
  login: string
): Promise<ActionResponse<{ message: string; verification?: VerificationData }>> {
  try {
    const res = await serverPost<any>("CHANGE_CONTACT", { login: login.trim() });
    if (res.success && res.data) {
      const data = res.data.data || res.data;
      return {
        success: true,
        data: {
          message: res.data.message || "We have sent a code to confirm it.",
          verification: data?.verification,
        },
      };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to send contact code") : "Failed to send contact code",
        code: "CHANGE_CONTACT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 16. Verify & switch email or mobile number with code
 * POST /api/v1/me/contact/verify
 */
export async function verifyContactAction(
  login: string,
  code: string
): Promise<ActionResponse<UserProfile>> {
  try {
    const res = await serverPost<any>("VERIFY_CONTACT", {
      login: login.trim(),
      code: code.trim(),
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to verify contact change") : "Failed to verify contact change",
        code: "VERIFY_CONTACT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}


/**
 * The signed-in shopper from the session cookie, or nulls when signed out.
 * Clears stale cookies when the API no longer accepts the token.
 */
export async function getSessionUserAction(): Promise<{ user: User | null; token: string | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value || cookieStore.get("token")?.value || null;
  if (!token) return { user: null, token: null };

  const res = await serverGet<{ data?: User }>("GET_ME", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.success) {
    if (res.error?.status === 401) await clearSessionCookies();
    return { user: null, token: null };
  }
  const user = (res.data?.data ?? res.data) as User;
  return { user, token };
}
