"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { adminLoginAction } from "@/app/(admin)/actions/auth";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith("/admin") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleFillOwnerDemo = () => {
    setEmail("owner@example.com");
    setPassword("rRE%++8YrP!%yLcTNAgB");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const res = await adminLoginAction(email, password, "web");
      if (res.success) {
        setSuccess("Signed in successfully as administrator! Redirecting...");
        setTimeout(() => {
          router.push(redirectTarget);
          router.refresh();
        }, 500);
      } else {
        setError(res.error?.message || "Invalid admin credentials");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#FF5B00] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-400">Sign in with your staff or administrator account.</p>
        </div>

        {/* Owner Credentials Quick-Fill Banner */}
        <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-200 shadow-2xs">
          <div className="space-y-0.5">
            <span className="font-bold flex items-center gap-1 text-[#FF5B00]">
              <Sparkles className="w-3.5 h-3.5" />
              Owner Account Demo:
            </span>
            <div className="text-[11px] text-slate-300 font-mono">
              owner@example.com / rRE%++8YrP!%yLcTNAgB
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillOwnerDemo}
            className="px-3 py-1.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs shrink-0 active:scale-95 cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Staff Email or Phone</label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com or 017xxxxxxxx"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Authenticating..." : "Sign in to Admin"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
          <div className="w-8 h-8 border-2 border-[#FF5B00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
