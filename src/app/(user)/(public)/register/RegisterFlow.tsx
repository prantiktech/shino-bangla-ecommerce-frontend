"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { registerAction, verifyOtpAction } from "@/app/(user)/actions/auth";
import { useAuth } from "@/context/AuthContext";
import { AuthAlert, AuthCard, AuthField, authButton, authInput } from "@/components/auth/AuthCard";
import { PasswordInput, passwordIsStrong } from "@/components/auth/PasswordInput";
import { OtpStep } from "@/components/auth/OtpStep";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { safeRedirect } from "@/components/auth/redirect";

const EMAIL = /^\S+@\S+\.\S+$/;
const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;

export function RegisterFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTarget = safeRedirect(params.get("redirect"));
  const { setSessionUser, isAuthenticated } = useAuth();

  // Already signed in: nothing to register.
  React.useEffect(() => {
    if (isAuthenticated) router.replace(redirectTarget);
  }, [isAuthenticated, redirectTarget, router]);

  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginValue = login.trim().replace(/[\s-]/g, "");
    if (!name.trim()) return setError("Enter your name.");
    if (!EMAIL.test(loginValue) && !BD_MOBILE.test(loginValue))
      return setError("Enter a valid email address or a Bangladeshi mobile number (01XXXXXXXXX).");
    if (!passwordIsStrong(password)) return setError("Choose a stronger password that meets every rule below.");
    if (password !== confirm) return setError("The two passwords do not match.");

    setBusy(true);
    setError(null);
    const res = await registerAction({ name, login: loginValue, password, password_confirmation: confirm });
    setBusy(false);
    if (!res.success) return setError(res.error.message);
    setLogin(loginValue);
    setDestination(res.data.verification?.destination ?? null);
    setStep("verify");
  };

  if (step === "verify") {
    return (
      <AuthCard title="Confirm it's you" subtitle="One last step to activate your account.">
        <OtpStep
          login={login}
          destination={destination}
          purpose="verify"
          submitLabel="Verify and continue"
          onSubmit={async (code) => {
            const res = await verifyOtpAction({ login, code, purpose: "verify" });
            if (!res.success) return res.error.message;
            setSessionUser(res.data.user, res.data.token);
            router.replace(redirectTarget);
          }}
        />
        <button type="button" onClick={() => setStep("details")} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-800">
          Use a different email or number
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up with your email address or mobile number."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={params.get("redirect") ? `/login?redirect=${encodeURIComponent(params.get("redirect")!)}` : "/login"}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <AuthAlert tone="error">{error}</AuthAlert>}
        <AuthField label="Full name" htmlFor="name">
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={255} className={authInput} autoFocus />
        </AuthField>
        <AuthField label="Email or mobile number" htmlFor="login">
          <input
            id="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            placeholder="you@example.com or 01XXXXXXXXX"
            className={authInput}
          />
        </AuthField>
        <AuthField label="Password" htmlFor="password">
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" showRules />
        </AuthField>
        <AuthField label="Confirm password" htmlFor="confirm">
          <PasswordInput id="confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </AuthField>
        <button type="submit" disabled={busy} className={authButton}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Create account
        </button>
        <p className="text-xs text-slate-500 text-center">
          By creating an account you agree to our store policies.
        </p>
      </form>
      <GoogleSignInButton
        onSignedIn={(user, token) => {
          setSessionUser(user, token);
          router.replace(redirectTarget);
        }}
        onError={setError}
      />
    </AuthCard>
  );
}
