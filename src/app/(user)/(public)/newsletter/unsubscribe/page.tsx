import type { Metadata } from "next";
import { UnsubscribeConfirm } from "./UnsubscribeConfirm";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-8 text-center">
        <UnsubscribeConfirm token={token ?? ""} />
      </div>
    </div>
  );
}
