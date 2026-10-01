import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserAction } from "@/lib/actions/auth.actions";
import { getOrderDetailAction } from "@/app/(user)/actions/orders";
import { OrderDetailView } from "./_components/OrderDetailView";
import { ShoppingBag, ArrowLeft } from "lucide-react";

interface SingleOrderPageProps {
  params: Promise<{
    number: string;
  }>;
}

export async function generateMetadata({
  params,
}: SingleOrderPageProps): Promise<Metadata> {
  const resolved = await params;
  return {
    title: `Order #${resolved.number} Details | Storefront`,
    description: `Track and view line items, payments, delivery status and invoices for order #${resolved.number}.`,
  };
}

export default async function SingleOrderPage({ params }: SingleOrderPageProps) {
  const { user } = await getCurrentUserAction();
  if (!user) {
    redirect("/login");
  }

  const resolved = await params;
  const orderNumber = decodeURIComponent(resolved.number);

  const res = await getOrderDetailAction(orderNumber);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">
              We couldn&apos;t find order details for{" "}
              <strong className="font-mono text-slate-800">#{orderNumber}</strong>. It may have been archived or belongs to another account.
            </p>
          </div>
          <Link
            href="/account?tab=orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  return <OrderDetailView order={res.data} />;
}
