import React from "react";
import { Logo } from "@/components/common/Logo";

/** Centered card shell shared by sign-in, sign-up and password reset. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 md:py-16 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <Logo size="lg" className="justify-center" />
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 p-6 sm:p-8">{children}</div>
        {footer && <div className="text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthAlert({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles =
    tone === "error"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-sky-50 text-sky-800 ring-sky-200";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-3.5 py-2.5 text-sm ring-1 ${styles}`}>
      {children}
    </div>
  );
}

export const authInput =
  "w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-colors disabled:bg-slate-50";

export const authButton =
  "w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm shadow-brand-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export function AuthField({ label, htmlFor, children, aside }: { label: string; htmlFor: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}
