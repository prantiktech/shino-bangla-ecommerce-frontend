"use client";

import React, { useEffect, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Refund, createAdminOrderRefundAction, getAdminOrderRefundsAction } from "@/app/(admin)/actions/refunds";
import { Button, Field, InlineError, MoneyInput, Spinner, Textarea } from "@/app/(admin)/components/ui";
import { downloadUrl, formatDateTime, formatTaka, takaToPoisha } from "@/app/(admin)/components/format";

/** Invoice download link for an order (admin endpoint, proxied with the staff token). */
export function AdminInvoiceButton({ orderId }: { orderId: number }) {
  return (
    <a
      href={downloadUrl(`/admin/orders/${orderId}/invoice`)}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white ring-1 ring-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      <Download className="w-3.5 h-3.5" />
      Invoice PDF
    </a>
  );
}

/**
 * Refund history plus a form to refund online payments.
 * The API refuses refunds for orders not paid online (e.g. cash on delivery).
 */
export function OrderRefundsPanel({ orderId, onRefunded }: { orderId: number; onRefunded: () => void }) {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundable, setRefundable] = useState(0);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAdminOrderRefundsAction(orderId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success) {
        setRefunds(res.data.refunds);
        setRefundable(res.data.refundable);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, version]);

  const submit = async () => {
    if (!reason.trim()) return setErr("Give a reason for the refund.");
    const poisha = amount ? takaToPoisha(amount) : undefined;
    if (poisha !== undefined && (poisha === null || poisha < 1)) return setErr("Enter a valid amount, or leave it blank for the full amount.");
    if (poisha && poisha > refundable) return setErr(`At most ${formatTaka(refundable)} can be refunded.`);
    setBusy(true);
    setErr(null);
    const res = await createAdminOrderRefundAction(orderId, reason.trim(), poisha ?? undefined);
    setBusy(false);
    if (!res.success) return setErr(res.error.message);
    setDone(`Refunded ${formatTaka(res.data.amount)}.`);
    setOpen(false);
    setAmount("");
    setReason("");
    setVersion((v) => v + 1);
    onRefunded();
  };

  return (
    <div className="rounded-xl ring-1 ring-slate-200 p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4 text-slate-400" />
          Refunds
        </h4>
        {loading ? (
          <Spinner className="w-4 h-4" />
        ) : (
          <span className="text-xs text-slate-500">
            Refundable: <strong className="text-slate-900 tabular-nums">{formatTaka(refundable)}</strong>
          </span>
        )}
      </div>

      {done && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{done}</p>}

      {refunds.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg bg-slate-50">
          {refunds.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="block text-slate-800">{r.reason || "Refund"}</span>
                <span className="block text-xs text-slate-500">
                  {formatDateTime(r.created_at)}
                  {r.refunded_by ? ` · ${r.refunded_by}` : ""}
                  {r.status ? ` · ${r.status}` : ""}
                </span>
              </span>
              <span className="font-semibold tabular-nums text-rose-600">−{formatTaka(r.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {!loading && refunds.length === 0 && !open && (
        <p className="text-xs text-slate-500">
          {refundable > 0 ? "No refunds yet." : "Nothing to refund. Refunds go back through the online payment gateway, so cash-on-delivery orders cannot be refunded here."}
        </p>
      )}

      {refundable > 0 &&
        (open ? (
          <div className="space-y-3 pt-1">
            <InlineError message={err} />
            <Field label="Amount" hint={`Leave blank to refund the full ${formatTaka(refundable)}.`}>
              <MoneyInput value={amount} onChange={setAmount} placeholder={(refundable / 100).toFixed(2)} />
            </Field>
            <Field label="Reason" required>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} placeholder="One item returned" />
            </Field>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" loading={busy} onClick={submit}>
                Send refund
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => { setOpen(true); setErr(null); setDone(null); }}>
            Issue refund
          </Button>
        ))}
    </div>
  );
}
