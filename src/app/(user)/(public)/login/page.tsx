"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useAuth, AuthError } from "@/context/AuthContext";
import { verifyOtpAction } from "@/app/(user)/actions/auth";
import { AuthAlert, AuthCard, AuthField, authButton, authInput } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { OtpStep } from "@/components/auth/OtpStep";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { safeRedirect } from "@/components/auth/redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, setSessionUser } = useAuth();

  const rawRedirect = searchParams.get("redirect");
  const redirectTarget = safeRedirect(rawRedirect);
  const isCheckoutRedirect = redirectTarget === "/checkout";
  const resetDone = searchParams.get("reset") === "1";

  const [form, setForm] = useState({ login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) router.replace(redirectTarget);
  }, [isAuthenticated, redirectTarget, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.login.trim() || !form.password) {
      setErrorMsg("Enter your email or mobile number and your password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await login({ login: form.login.trim(), password: form.password, device_name: "web" });
      router.replace(redirectTarget);
    } catch (err) {
      if (err instanceof AuthError && err.code === "ACCOUNT_NOT_VERIFIED") {
        // The API has just sent a fresh code; move to the code entry step.
        setNeedsVerify(true);
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const registerHref = rawRedirect ? `/register?redirect=${encodeURIComponent(rawRedirect)}` : "/register";

  if (needsVerify) {
    return (
      <AuthCard title="Verify your account" subtitle="Your account isn't verified yet. Enter the code we just sent.">
        <OtpStep
          login={form.login.trim()}
          purpose="verify"
          submitLabel="Verify and sign in"
          onSubmit={async (code) => {
            const res = await verifyOtpAction({ login: form.login.trim(), code, purpose: "verify" });
            if (!res.success) return res.error.message;
            setSessionUser(res.data.user, res.data.token);
            router.replace(redirectTarget);
          }}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Track orders, save addresses and check out faster."
      footer={
        <>
          New to Nogod Bazar?{" "}
          <Link href={registerHref} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {isCheckoutRedirect && (
          <AuthAlert tone="info">
            <span className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Sign in to place your order. You&apos;ll come straight back to checkout.
            </span>
          </AuthAlert>
        )}
        {resetDone && <AuthAlert tone="success">Your password has been reset. Sign in with your new password.</AuthAlert>}

        {process.env.NODE_ENV !== "production" && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 ring-1 ring-brand-200 px-3.5 py-2.5 text-xs text-brand-900">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Demo: customer@example.com / Demo-Password-1!
            </span>
            <button
              type="button"
              onClick={() => setForm({ login: "customer@example.com", password: "Demo-Password-1!" })}
              className="font-semibold text-primary hover:underline"
            >
              Fill
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}
          <AuthField label="Email or mobile number" htmlFor="login">
            <input
              id="login"
              type="text"
              autoComplete="username"
              value={form.login}
              onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
              placeholder="you@example.com or 01XXXXXXXXX"
              className={authInput}
              autoFocus
            />
          </AuthField>
          <AuthField
            label="Password"
            htmlFor="password"
            aside={
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            }
          >
            <PasswordInput id="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
          </AuthField>
          <button type="submit" disabled={loading} className={authButton}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <GoogleSignInButton
          onSignedIn={(user, token) => {
            setSessionUser(user, token);
            router.replace(redirectTarget);
          }}
          onError={setErrorMsg}
        />
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
