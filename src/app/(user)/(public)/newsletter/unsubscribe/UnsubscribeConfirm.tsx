"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import { unsubscribeNewsletterAction } from "@/app/(user)/actions/content";

/** Asks before unsubscribing, so link scanners in mail clients can't unsubscribe people by accident. */
export function UnsubscribeConfirm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(token ? null : "This unsubscribe link is incomplete. Use the link from the bottom of one of our emails.");

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const res = await unsubscribeNewsletterAction(token);
    setBusy(false);
    if (!res.success) return setError(res.error.message);
    setDone(res.data.message || "You have been unsubscribed.");
  };

  if (done) {
    return (
      <>
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">You&apos;re unsubscribed</h1>
        <p className="mt-2 text-sm text-slate-600">{done}</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center px-5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to the shop
        </Link>
      </>
    );
  }

  return (
    <>
      <MailX className="w-12 h-12 text-slate-400 mx-auto" />
      <h1 className="mt-4 text-xl font-bold text-slate-900">Unsubscribe from our emails?</h1>
      <p className="mt-2 text-sm text-slate-600">You&apos;ll stop receiving offers and product updates. Order emails are not affected.</p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-rose-600">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !token}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Unsubscribe
        </button>
        <Link href="/" className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold text-primary hover:bg-brand-50">
          Keep me subscribed
        </Link>
      </div>
    </>
  );
}
