import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";
import { getSessionUserAction } from "@/app/(user)/actions/auth";
import { getOrderDetailAction } from "@/app/(user)/actions/orders";
import { PayOrderButton } from "@/components/orders/PayOrderButton";
import { ClearCartOnSuccess } from "./ClearCartOnSuccess";
import { formatPoisha } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Payment status", robots: { index: false } };

type Status = "paid" | "failed" | "cancelled" | "late" | "unknown";

const COPY: Record<Status, { title: string; text: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: {
    title: "Payment successful",
    text: "Thank you! Your payment was confirmed and your order is being prepared.",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    icon: CheckCircle2,
  },
  failed: {
    title: "Payment failed",
    text: "Your payment didn't go through and you have not been charged. Your order is saved, so you can try again.",
    tone: "bg-rose-50 text-rose-600 ring-rose-100",
    icon: XCircle,
  },
  cancelled: {
    title: "Payment cancelled",
    text: "You cancelled the payment. Your order is saved, so you can pay whenever you're ready.",
    tone: "bg-amber-50 text-amber-600 ring-amber-100",
    icon: AlertTriangle,
  },
  late: {
    title: "Payment received late",
    text: "We received your payment after this order had expired. Our team will contact you to refund it or restore the order.",
    tone: "bg-sky-50 text-sky-600 ring-sky-100",
    icon: Clock,
  },
  unknown: {
    title: "We're confirming your payment",
    text: "We couldn't confirm the payment yet. This usually resolves within a few minutes. Check your order status before paying again.",
    tone: "bg-slate-100 text-slate-600 ring-slate-200",
    icon: HelpCircle,
  },
};

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; order?: string }>;
}) {
  const { status: rawStatus, order } = await searchParams;
  const status: Status = (["paid", "failed", "cancelled", "late", "unknown"] as const).includes(rawStatus as Status)
    ? (rawStatus as Status)
    : "unknown";
  const copy = COPY[status];
  const Icon = copy.icon;

  const { user } = await getSessionUserAction();
  const orderRes = user && order ? await getOrderDetailAction(order) : null;
  const detail = orderRes && orderRes.success ? orderRes.data : null;
  const canRetry = (status === "failed" || status === "cancelled") && !!order;

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-16">
      {status === "paid" && <ClearCartOnSuccess />}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-6 sm:p-10 text-center space-y-5">
        <span className={`mx-auto w-16 h-16 rounded-2xl ring-8 flex items-center justify-center ${copy.tone}`}>
          <Icon className="w-8 h-8" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{copy.text}</p>
        </div>

        {order && (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Order</span>
              <span className="font-mono font-semibold text-slate-900">#{order}</span>
            </div>
            {detail?.totals?.grand_total !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">{formatPoisha(Number(detail.totals.grand_total))}</span>
              </div>
            )}
            {detail?.payment_status && (
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold capitalize text-slate-900">{String(detail.payment_status).replace(/_/g, " ")}</span>
              </div>
            )}
          </div>
        )}

        {canRetry && (
          <div className="pt-1">
            <PayOrderButton orderNumber={order!} askPhone={!user} label="Try paying again" className="w-full" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          {order && user ? (
            <Link href={`/orders/${order}`} className="inline-flex items-center justify-center h-11 px-5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View order
            </Link>
          ) : (
            <Link href="/track-order" className="inline-flex items-center justify-center h-11 px-5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Track your order
            </Link>
          )}
          <Link href="/products" className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-semibold text-primary hover:bg-brand-50">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
