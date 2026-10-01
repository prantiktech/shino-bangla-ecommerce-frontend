"use client";

import React, { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { authInput } from "./AuthCard";

/** The API's password rule: 12+ characters with upper and lower case, a number and a symbol. */
export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 12 characters", test: (p) => p.length >= 12 },
  { label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const passwordIsStrong = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = "current-password",
  placeholder = "••••••••••••",
  showRules = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  showRules?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${authInput} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {showRules && value.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-slate-500"}`}>
                {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                {r.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
