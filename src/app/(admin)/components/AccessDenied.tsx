import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldOff } from "lucide-react";
import { Card } from "./ui";

/** Shown in place of a back-office page the signed-in staff member has no permission for. */
export function AccessDenied({ needed, fallback }: { needed: string; fallback: string | null }) {
  return (
    <div className="max-w-xl mx-auto pt-10">
      <Card className="text-center py-10 px-6">
        <span className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100 flex items-center justify-center">
          <ShieldOff className="w-7 h-7" />
        </span>
        <h1 className="text-lg font-bold text-slate-900">You don&apos;t have access to this page</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your role doesn&apos;t include the permission this page needs. Ask the store owner to add it to your role if you need it.
        </p>
        {needed && (
          <p className="mt-3 text-xs text-slate-500">
            Needs: <code className="font-mono font-semibold text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">{needed}</code>
          </p>
        )}
        {fallback ? (
          <Link
            href={fallback}
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
          >
            <ArrowLeft className="w-4 h-4" /> Go to a page you can open
          </Link>
        ) : (
          <p className="mt-6 text-sm text-slate-600">No back-office pages are open to your account yet.</p>
        )}
      </Card>
    </div>
  );
}
