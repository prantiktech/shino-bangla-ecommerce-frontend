"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { User } from "@/lib/api/types";
import { googleAuthAction } from "@/app/(user)/actions/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const RAW_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
/** Only a real OAuth client ID enables the button; placeholders and blanks are ignored. */
const CLIENT_ID = RAW_CLIENT_ID && /\.apps\.googleusercontent\.com$/.test(RAW_CLIENT_ID) ? RAW_CLIENT_ID : undefined;

/**
 * "Continue with Google" via Google Identity Services.
 * Renders nothing unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 */
export function GoogleSignInButton({
  onSignedIn,
  onError,
}: {
  onSignedIn: (user: User, token: string | null) => void;
  onError: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onSignedIn, onError });
  useEffect(() => {
    handlers.current = { onSignedIn, onError };
  }, [onSignedIn, onError]);

  useEffect(() => {
    if (!ready || !CLIENT_ID || !ref.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async ({ credential }) => {
        const res = await googleAuthAction(credential);
        if (res.success) handlers.current.onSignedIn(res.data.user, res.data.token ?? null);
        else handlers.current.onError(res.error.message || "Google sign-in failed.");
      },
    });
    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: ref.current.offsetWidth || 320,
    });
  }, [ready]);

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <p className="relative text-center">
          <span className="bg-white px-3 text-xs text-slate-400">or</span>
        </p>
      </div>
      <div ref={ref} className="w-full flex justify-center min-h-[44px]" />
    </>
  );
}
