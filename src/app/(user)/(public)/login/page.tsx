"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    login: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/account");
    }
  }, [isAuthenticated, router]);

  const handleFillDemo = () => {
    setForm({
      login: "customer@example.com",
      password: "Demo-Password-1!"
    });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.login.trim() || !form.password) {
      setErrorMsg("Please enter both email/phone and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await login({
        login: form.login.trim(),
        password: form.password,
        device_name: "web"
      });
      setSuccessMsg("Signed in successfully! Redirecting...");
      setTimeout(() => {
        router.push("/account");
      }, 700);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Invalid login credentials. Please try again.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/60">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 group select-none">
            <div className="flex items-center">
              <span className="text-3xl font-black text-[#009cae] leading-none">C</span>
              <span className="text-2xl font-black text-gray-900 tracking-tight">embula</span>
              <span className="text-[10px] font-semibold text-gray-400 ml-0.5">.com</span>
            </div>
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900 tracking-tight">
            Sign in to your customer account
          </h2>
          <p className="mt-1.5 text-xs text-gray-500">
            Access your orders, track shipments, and manage wishlist
          </p>
        </div>

        {/* Demo Credentials Quick-Fill Banner */}
        <div className="bg-teal-50/80 border border-teal-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-teal-900 shadow-2xs">
          <div className="space-y-0.5">
            <span className="font-bold flex items-center gap-1 text-[#009cae]">
              <Sparkles className="w-3.5 h-3.5" />
              Customer Demo Account:
            </span>
            <div className="text-[11px] text-teal-800 font-mono">
              customer@example.com / Demo-Password-1!
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1.5 bg-[#009cae] hover:bg-[#008998] text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs shrink-0 active:scale-95"
          >
            Auto Fill
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl shadow-xl border border-gray-100/90">
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email or Phone Input */}
            <div>
              <label htmlFor="login" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email or Mobile Number
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login"
                  type="text"
                  required
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  placeholder="e.g. customer@example.com or 01712345678"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#009cae] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#009cae] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#009cae] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-[#009cae] hover:bg-[#008998] active:scale-[0.99] transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-bold text-[#009cae] hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-gray-400 text-xs">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit SSL Encrypted</span>
          </div>
          <span>•</span>
          <span>Fast Bangladeshi Delivery</span>
        </div>

      </div>
    </div>
  );
}
