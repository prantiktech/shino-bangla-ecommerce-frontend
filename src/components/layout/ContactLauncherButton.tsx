"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

export interface ContactChannels {
  /** International number without "+", e.g. 8801712345678. */
  whatsapp: string | null;
  messenger: string | null;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.18 8.18 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.43 3.14 7.17.16.15.26.35.27.57l.05 1.78a.8.8 0 0 0 1.12.71l1.98-.88a.8.8 0 0 1 .53-.04c.91.25 1.88.39 2.91.39 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
    </svg>
  );
}

/** Floating button that opens a small card with the shop's chat channels. */
export function ContactLauncherButton({ channels, storeName }: { channels: ContactChannels; storeName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on Escape or a click outside the card.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Start the WhatsApp chat with a link to the page the shopper is looking at.
  const whatsappHref = channels.whatsapp
    ? `https://wa.me/${channels.whatsapp}?text=${encodeURIComponent(
        `Hi ${storeName}, I have a question.${typeof window !== "undefined" && pathname?.startsWith("/products/") ? ` ${window.location.origin}${pathname}` : ""}`
      )}`
    : null;

  return (
    <div ref={rootRef} className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end">
      {open && (
        <div
          role="dialog"
          aria-label="Contact us"
          className="mb-3 w-64 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="bg-primary text-white px-4 py-3">
            <p className="text-sm font-bold">Chat with us</p>
            <p className="text-[11px] text-white/80">Pick an app and we&apos;ll reply there.</p>
          </div>
          <div className="p-2 space-y-1">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-emerald-50 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">WhatsApp</span>
                  <span className="block text-[11px] text-slate-500">Message us on WhatsApp</span>
                </span>
              </a>
            )}
            {channels.messenger && (
              <a
                href={channels.messenger}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-blue-50 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white flex items-center justify-center shrink-0">
                  <MessengerIcon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Messenger</span>
                  <span className="block text-[11px] text-slate-500">Chat with us on Facebook</span>
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close contact options" : "Contact us"}
        aria-expanded={open}
        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
      >
        {open ? <X className="w-6 h-6 stroke-[2.5]" /> : <MessageCircle className="w-6 h-6 md:w-7 md:h-7 stroke-[2.5]" />}
      </button>
    </div>
  );
}
