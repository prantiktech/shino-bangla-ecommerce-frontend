import { apiClient } from "../client";
import { API_ENDPOINTS } from "../config";
import { ApiResponse, LoginResponseData, User } from "../types";

export interface LoginPayload {
  login: string;
  password: string;
  device_name?: string;
}

export interface RegisterPayload {
  name: string;
  login: string;
  password: string;
}

export interface OtpVerifyPayload {
  login: string;
  code: string;
  purpose?: "verify" | "login" | "reset_password";
}

export const authService = {
  /**
   * Sign in using email or Bangladeshi mobile number
   */
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>(
      API_ENDPOINTS.AUTH_LOGIN,
      {
        login: payload.login,
        password: payload.password,
        device_name: payload.device_name || "web"
      },
      { skipAuth: true }
    );
    return res.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.ME);
    return res.data;
  },

  /**
   * Update customer name
   */
  async updateProfile(name: string): Promise<User> {
    const res = await apiClient.put<ApiResponse<User>>(API_ENDPOINTS.ME, { name });
    return res.data;
  },

  /**
   * Register a new shopper account
   */
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH_REGISTER, payload, {
      skipAuth: true
    });
  },

  /**
   * Verify registration / login OTP
   */
  async verifyOtp(payload: OtpVerifyPayload): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>(
      API_ENDPOINTS.AUTH_OTP_VERIFY,
      {
        login: payload.login,
        code: payload.code,
        purpose: payload.purpose || "verify"
      },
      { skipAuth: true }
    );
    return res.data;
  },

  /**
   * Sign out customer and invalidate token
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    } catch {
      // Ignore if token is already expired
    }
  }
};
