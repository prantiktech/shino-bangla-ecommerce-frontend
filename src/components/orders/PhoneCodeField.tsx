"use client";

/**
 * Order phone verification. When the shop turns on `order_phone_verification`, an order is accepted only
 * with the 6-digit code texted to its mobile number (POST /orders/phone-code, then `phone_code` on the order).
 *
 * Render it with `key={phone}` so a new number starts a fresh verification.
 */
import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { requestOrderPhoneCodeAction } from "@/app/(user)/actions/checkout";

const RESEND_SECONDS = 60;

export function isValidBdMobile(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(normaliseBdMobile(phone));
}

export function normaliseBdMobile(phone: string): string {
  return phone.replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, "");
}

export function PhoneCodeField({
  phone,
  code,
  onCodeChange,
  onNotRequired,
  error,
  disabled,
}: {
  phone: string;
  code: string;
  onCodeChange: (code: string) => void;
  /** The API said this shop does not ask for a code after all. */
  onNotRequired: () => void;
  /** A field error from placing the order (e.g. a wrong or expired code). */
  error?: string | null;
  disabled?: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const valid = isValidBdMobile(phone);

  const send = async () => {
    if (!valid) return setSendError("Enter a valid mobile number (01XXXXXXXXX) first.");
    setSending(true);
    setSendError(null);
    const res = await requestOrderPhoneCodeAction(phone);
    setSending(false);
    if (!res.success) {
      setSendError(res.error.message);
      if (res.error.status === 429) setCooldown(RESEND_SECONDS);
      return;
    }
    if (!res.data.required) {
      onNotRequired();
      return;
    }
    setSent(true);
    setMessage(res.data.message);
    setCooldown(Math.max(15, Number(res.data.retry_after) || RESEND_SECONDS));
  };

  const complete = /^\d{6}$/.test(code);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600">
          <p className="font-bold text-slate-900">Verify your mobile number</p>
          <p>
            We&apos;ll text a 6-digit code to <span className="font-mono font-semibold text-slate-800">{valid ? normaliseBdMobile(phone) : "your number"}</span> to confirm
            the order.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            disabled={disabled || !sent}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={sent ? "Enter the 6-digit code" : "Send the code first"}
            aria-label="Verification code"
            aria-invalid={!!error}
            className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-mono tracking-[0.3em] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-100 disabled:text-slate-400 disabled:tracking-normal disabled:font-sans"
          />
          {complete && <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />}
        </div>
        <button
          type="button"
          onClick={send}
          disabled={disabled || sending || cooldown > 0 || !valid}
          className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : sent ? "Resend code" : "Send code"}
        </button>
      </div>

      {message && !sendError && !error && <p className="text-[11px] text-emerald-700">{message}</p>}
      {(sendError || error) && (
        <p role="alert" className="text-[11px] font-semibold text-rose-600">
          {error || sendError}
        </p>
      )}
    </div>
  );
}
