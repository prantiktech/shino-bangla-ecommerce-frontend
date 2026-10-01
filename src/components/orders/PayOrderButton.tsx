"use client";

import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { payOrderAction } from "@/app/(user)/actions/orders";

/**
 * Start (or retry) an online payment for an order and hand over to the gateway.
 * Guests must confirm the mobile number the order was placed with.
 */
export function PayOrderButton({
  orderNumber,
  askPhone = false,
  label = "Pay now",
  className = "",
}: {
  orderNumber: string;
  askPhone?: boolean;
  label?: string;
  className?: string;
}) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (askPhone && !/^(?:\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) {
      setError("Enter the mobile number used for this order (01XXXXXXXXX).");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await payOrderAction(orderNumber, askPhone ? phone.replace(/[\s-]/g, "") : undefined);
    if (!res.success) {
      setBusy(false);
      setError(res.error.message);
      return;
    }
    const data = res.data as { gateway_url?: string; payment?: { gateway_url?: string } };
    const url = data.gateway_url ?? data.payment?.gateway_url;
    if (url) {
      window.location.href = url;
    } else {
      setBusy(false);
      setError("The payment page could not be opened. Please try again.");
    }
  };

  return (
    <form onSubmit={pay} className="space-y-2">
      {askPhone && (
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number used for the order"
          aria-label="Mobile number used for the order"
          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      )}
      <button
        type="submit"
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm disabled:opacity-60 ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {busy ? "Opening secure payment…" : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
