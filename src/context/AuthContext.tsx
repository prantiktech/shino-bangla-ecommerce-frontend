"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, LoginPayload, authService } from "@/lib/api";
import { loginAction, logoutAction, getCurrentUserAction } from "@/lib/actions/auth.actions";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state securely from Next.js HttpOnly cookies on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user: serverUser, token: serverToken } = await getCurrentUserAction();
        if (serverUser && serverToken) {
          setUser(serverUser);
          setToken(serverToken);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      // Execute Next.js 16 Server Action which writes HttpOnly secure cookie
      const res = await loginAction(payload);
      if (!res.success || !res.user) {
        throw new Error(res.error || "Failed to sign in. Please check your credentials.");
      }

      setUser(res.user);
      setToken(res.token || null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Execute Server Action to clear HttpOnly cookie
      await logoutAction();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const updateName = useCallback(async (name: string) => {
    const updated = await authService.updateProfile(name);
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: serverUser, token: serverToken } = await getCurrentUserAction();
      if (serverUser) {
        setUser(serverUser);
        setToken(serverToken);
      }
    } catch {
      // ignore
    }
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
        refreshUser
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
