"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, LoginPayload } from "@/lib/api/types";
import {
  loginAction,
  logoutAction,
  updateMeAction,
  getSessionUserAction,
} from "@/app/(user)/actions/auth";

/** Error thrown by `login`, carrying the API's error code (e.g. ACCOUNT_NOT_VERIFIED). */
export class AuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Adopt a user whose session cookie a server action has already set (sign-up, OTP, Google). */
  setSessionUser: (user: User, token?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore the session from the HttpOnly cookie on first load.
  useEffect(() => {
    let cancelled = false;
    getSessionUserAction()
      .then(({ user: u, token: t }) => {
        if (cancelled) return;
        setUser(u);
        setToken(t);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginAction(payload.login, payload.password, payload.device_name);
      if (!res.success) {
        throw new AuthError(res.error.message || "Failed to sign in. Please check your credentials.", res.error.code);
      }
      setUser(res.data.user);
      setToken(res.data.token || null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutAction();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const updateName = useCallback(async (name: string) => {
    const res = await updateMeAction(name);
    if (!res.success) throw new AuthError(res.error.message, res.error.code);
    setUser(res.data);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u, token: t } = await getSessionUserAction();
      if (u) {
        setUser(u);
        setToken(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const setSessionUser = useCallback((u: User, t?: string | null) => {
    setUser(u);
    if (t !== undefined) setToken(t);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateName,
        refreshUser,
        setSessionUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
