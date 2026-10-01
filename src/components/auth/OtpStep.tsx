"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { resendOtpAction } from "@/app/(user)/actions/auth";
import { AuthAlert, authButton, authInput } from "./AuthCard";

const RESEND_SECONDS = 60;

/**
 * Six-digit code entry with a resend timer.
 * `onSubmit` receives the code; return an error message to show it, or nothing on success.
 */
export function OtpStep({
  login,
  destination,
  purpose,
  submitLabel = "Verify",
  onSubmit,
  children,
}: {
  login: string;
  destination?: string | null;
  purpose: "verify" | "password_reset";
  submitLabel?: string;
  onSubmit: (code: string) => Promise<string | void>;
  children?: React.ReactNode;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError(null);
    const msg = await onSubmit(code);
    setBusy(false);
    if (msg) setError(msg);
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    const res = await resendOtpAction({ login, purpose });
    if (!res.success) return setError(res.error.message);
    setInfo(res.data.message || "A new code is on its way.");
    setCooldown(RESEND_SECONDS);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <AuthAlert tone="info">
        We sent a 6-digit code to <strong>{destination || login}</strong>. It expires in a few minutes.
      </AuthAlert>
      {error && <AuthAlert tone="error">{error}</AuthAlert>}
      {info && <AuthAlert tone="success">{info}</AuthAlert>}
      <div className="space-y-1.5">
        <label htmlFor="otp-code" className="text-sm font-medium text-slate-700">
          Verification code
        </label>
        <input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          className={`${authInput} text-center text-lg tracking-[0.5em] font-mono`}
          autoFocus
        />
      </div>
      {children}
      <button type="submit" disabled={busy || code.length !== 6} className={authButton}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitLabel}
      </button>
      <p className="text-center text-sm text-slate-500">
        Didn&apos;t get it?{" "}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} className="font-semibold text-primary hover:underline">
            Send a new code
          </button>
        )}
      </p>
    </form>
  );
}
