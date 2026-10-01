"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContactAction } from "@/app/(user)/actions/content";
import { useAuth } from "@/context/AuthContext";

const EMAIL = /^\S+@\S+\.\S+$/;
const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;
const input =
  "w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

export function ContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [prefilled, setPrefilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  // Prefill from the signed-in account once (adjusted during render).
  if (user && !prefilled) {
    setPrefilled(true);
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email || "", phone: f.phone || user.phone || "" }));
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    const phone = form.phone.trim().replace(/[\s-]/g, "").replace(/^\+?88/, "");
    if (!form.name.trim()) return setError("Enter your name.");
    if (!email && !phone) return setError("Give us an email address or a phone number so we can reply.");
    if (email && !EMAIL.test(email)) return setError("Enter a valid email address.");
    if (phone && !BD_MOBILE.test(phone)) return setError("Enter a valid mobile number (01XXXXXXXXX).");
    if (form.message.trim().length < 5) return setError("Write a short message.");
    setBusy(true);
    setError(null);
    const res = await submitContactAction({
      name: form.name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      subject: form.subject.trim() || undefined,
      message: form.message.trim(),
      website: form.website,
    });
    setBusy(false);
    if (!res.success) return setError(res.error.message);
    setSent(res.data.message || "Thank you. We will be in touch.");
  };

  if (sent) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">Message sent</h2>
        <p className="mt-1 text-sm text-slate-600">{sent}</p>
        <button
          type="button"
          onClick={() => {
            setSent(null);
            setForm((f) => ({ ...f, subject: "", message: "" }));
          }}
          className="mt-6 text-sm font-semibold text-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="c-name" className="text-sm font-medium text-slate-700">Name</label>
          <input id="c-name" value={form.name} onChange={set("name")} autoComplete="name" maxLength={255} className={input} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="c-email" className="text-sm font-medium text-slate-700">Email</label>
          <input id="c-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" maxLength={255} className={input} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="c-phone" className="text-sm font-medium text-slate-700">Mobile number</label>
          <input id="c-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="01XXXXXXXXX" className={input} />
        </div>
        <p className="sm:col-span-2 -mt-2 text-xs text-slate-500">Either an email or a mobile number is enough.</p>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="c-subject" className="text-sm font-medium text-slate-700">
            Subject <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input id="c-subject" value={form.subject} onChange={set("subject")} maxLength={255} className={input} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="c-message" className="text-sm font-medium text-slate-700">Message</label>
          <textarea
            id="c-message"
            value={form.message}
            onChange={set("message")}
            rows={6}
            maxLength={5000}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>
      {/* Spam trap: hidden from people, filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send message
      </button>
    </form>
  );
}
