"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Mail, Monitor, Phone, ShieldCheck } from "lucide-react";
import {
  AuthTokenItem,
  changeContactAction,
  getAuthTokensAction,
  logoutAllAction,
  revokeAuthTokenAction,
  verifyContactAction,
} from "@/app/(user)/actions/auth";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

const EMAIL = /^\S+@\S+\.\S+$/;
const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;

function formatWhen(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Contact details and signed-in devices. */
export function SecurityTab({ user }: { user: User }) {
  const router = useRouter();
  const { logout, setSessionUser } = useAuth();

  const [tokens, setTokens] = useState<AuthTokenItem[] | null>(null);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [contact, setContact] = useState("");
  const [codeSent, setCodeSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactDone, setContactDone] = useState<string | null>(null);
  const [me, setMe] = useState(user);

  useEffect(() => {
    let cancelled = false;
    getAuthTokensAction().then((res) => {
      if (cancelled) return;
      if (res.success) setTokens(res.data);
      else {
        setTokens([]);
        setSessionsError(res.error.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const revoke = async (t: AuthTokenItem) => {
    setRevoking(t.id);
    const res = await revokeAuthTokenAction(t.id);
    setRevoking(null);
    if (!res.success) return setSessionsError(res.error.message);
    setTokens((list) => (list ?? []).filter((x) => x.id !== t.id));
  };

  const signOutEverywhere = async () => {
    if (!window.confirm("Sign out of every device, including this one?")) return;
    setSigningOutAll(true);
    await logoutAllAction();
    await logout();
    router.replace("/login");
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = contact.trim().replace(/[\s-]/g, "");
    if (!EMAIL.test(value) && !BD_MOBILE.test(value)) {
      return setContactError("Enter a valid email address or mobile number (01XXXXXXXXX).");
    }
    setContactBusy(true);
    setContactError(null);
    setContactDone(null);
    const res = await changeContactAction(value);
    setContactBusy(false);
    if (!res.success) return setContactError(res.error.message);
    setContact(value);
    setCodeSent(res.data.verification?.destination ?? value);
  };

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setContactError("Enter the 6-digit code.");
    setContactBusy(true);
    setContactError(null);
    const res = await verifyContactAction(contact, code);
    setContactBusy(false);
    if (!res.success) return setContactError(res.error.message);
    setMe(res.data);
    setSessionUser(res.data);
    setContactDone(`Updated to ${contact}.`);
    setCodeSent(null);
    setContact("");
    setCode("");
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Email and mobile number</h2>
          <p className="text-sm text-slate-500">Used to sign in and for order updates.</p>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </dt>
            <dd className="font-medium text-slate-900 mt-0.5 break-all">
              {me.email || "Not added"}
              {me.email && me.email_verified && <span className="ml-2 text-xs text-emerald-600">verified</span>}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-xs text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Mobile
            </dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {me.phone || "Not added"}
              {me.phone && me.phone_verified && <span className="ml-2 text-xs text-emerald-600">verified</span>}
            </dd>
          </div>
        </dl>

        {contactDone && <p role="status" className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">{contactDone}</p>}
        {contactError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-xl px-3 py-2">{contactError}</p>}

        {!codeSent ? (
          <form onSubmit={sendCode} className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="new-contact" className="sr-only">
              New email or mobile number
            </label>
            <input
              id="new-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="New email or mobile number"
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={contactBusy || !contact.trim()}
              className="h-11 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {contactBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              Send code
            </button>
          </form>
        ) : (
          <form onSubmit={confirmCode} className="space-y-3">
            <p className="text-sm text-slate-600">
              Enter the 6-digit code sent to <strong>{codeSent}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                aria-label="Verification code"
                className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-center font-mono tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                autoFocus
              />
              <button
                type="submit"
                disabled={contactBusy || code.length !== 6}
                className="h-11 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {contactBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
            <button type="button" onClick={() => setCodeSent(null)} className="text-sm text-slate-500 hover:text-slate-800">
              Use a different email or number
            </button>
          </form>
        )}
      </section>

      <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Signed-in devices
            </h2>
            <p className="text-sm text-slate-500">Sign out any device you don&apos;t recognise.</p>
          </div>
          <button
            type="button"
            onClick={signOutEverywhere}
            disabled={signingOutAll}
            className="h-10 px-4 rounded-xl ring-1 ring-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 inline-flex items-center gap-2 disabled:opacity-50"
          >
            {signingOutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign out everywhere
          </button>
        </div>
        {sessionsError && <p role="alert" className="text-sm text-rose-600">{sessionsError}</p>}
        {tokens === null ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        ) : tokens.length === 0 ? (
          <p className="text-sm text-slate-500">No active sessions found.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <Monitor className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {t.name || "Device"}
                    {t.is_current && <span className="ml-2 text-xs font-semibold text-emerald-600 normal-case">This device</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    Last active {formatWhen(t.last_used_at)} · signed in {formatWhen(t.created_at)}
                  </p>
                </div>
                {!t.is_current && (
                  <button
                    type="button"
                    onClick={() => revoke(t)}
                    disabled={revoking === t.id}
                    className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {revoking === t.id ? "Signing out…" : "Sign out"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
