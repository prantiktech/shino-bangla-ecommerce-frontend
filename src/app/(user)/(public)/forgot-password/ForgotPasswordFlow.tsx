"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/(user)/actions/auth";
import { AuthAlert, AuthCard, AuthField, authButton, authInput } from "@/components/auth/AuthCard";
import { PasswordInput, passwordIsStrong } from "@/components/auth/PasswordInput";
import { OtpStep } from "@/components/auth/OtpStep";

export function ForgotPasswordFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [login, setLogin] = useState("");
  const [destination, setDestination] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = login.trim().replace(/[\s-]/g, "");
    if (!value) return setError("Enter the email or mobile number on your account.");
    setBusy(true);
    setError(null);
    const res = await forgotPasswordAction(value);
    setBusy(false);
    if (!res.success) return setError(res.error.message);
    setLogin(value);
    setDestination(res.data.verification?.destination ?? null);
    setStep("reset");
  };

  if (step === "reset") {
    return (
      <AuthCard title="Choose a new password" subtitle="Enter the code we sent and your new password.">
        <OtpStep
          login={login}
          destination={destination}
          purpose="password_reset"
          submitLabel="Reset password"
          onSubmit={async (code) => {
            if (!passwordIsStrong(password)) return "Choose a stronger password that meets every rule.";
            if (password !== confirm) return "The two passwords do not match.";
            const res = await resetPasswordAction({ login, code, password, password_confirmation: confirm });
            if (!res.success) return res.error.message;
            router.replace("/login?reset=1");
          }}
        >
          <AuthField label="New password" htmlFor="new-password">
            <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" showRules />
          </AuthField>
          <AuthField label="Confirm new password" htmlFor="confirm-password">
            <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </AuthField>
        </OtpStep>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="We'll send a 6-digit code to reset it."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={request} className="space-y-4">
        {error && <AuthAlert tone="error">{error}</AuthAlert>}
        <AuthField label="Email or mobile number" htmlFor="login">
          <input
            id="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            placeholder="you@example.com or 01XXXXXXXXX"
            className={authInput}
            autoFocus
          />
        </AuthField>
        <button type="submit" disabled={busy} className={authButton}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Send reset code
        </button>
      </form>
    </AuthCard>
  );
}
