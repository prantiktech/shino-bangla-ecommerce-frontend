"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit2, Loader2, MessageSquareText, Trash2, X } from "lucide-react";
import {
  CustomerReview,
  ReviewableItem,
  deleteMyReviewAction,
  getMyReviewsAction,
  getReviewableItemsAction,
} from "@/app/(user)/actions/reviews";
import { ReviewFormDialog, ReviewFormTarget, StarRating as Stars } from "@/components/reviews/ReviewFormDialog";

const photoUrl = (p: unknown): string | null =>
  typeof p === "string" ? p : p && typeof p === "object" && "url" in p ? String((p as { url: string }).url) : null;

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-rose-50 text-rose-700",
};

/** Prompts to review delivered items, and the shopper's existing reviews. Any product on sale can also be reviewed from its page. */
export function ReviewsTab({ initialReviewables, initialReviews }: { initialReviewables: ReviewableItem[]; initialReviews: CustomerReview[] }) {
  const [reviewables, setReviewables] = useState(initialReviewables);
  const [reviews, setReviews] = useState(initialReviews);
  const [target, setTarget] = useState<ReviewFormTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = async () => {
    const [a, b] = await Promise.all([getReviewableItemsAction(), getMyReviewsAction()]);
    if (a.success) setReviewables(a.data);
    if (b.success) setReviews(b.data);
  };

  const openWrite = (item: ReviewableItem) => setTarget({ mode: "write", product: { id: item.product_id, name: item.name } });
  const openEdit = (r: CustomerReview) => setTarget({ mode: "edit", review: r });

  const remove = async (r: CustomerReview) => {
    if (!window.confirm(`Delete your review of ${r.product.name}?`)) return;
    setDeletingId(r.id);
    const res = await deleteMyReviewAction(r.id);
    setDeletingId(null);
    if (!res.success) return setNotice(res.error.message);
    setReviews((list) => list.filter((x) => x.id !== r.id));
    setNotice("Review deleted.");
    refresh();
  };

  return (
    <div className="space-y-8">
      {notice && (
        <div role="status" className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-800 flex justify-between gap-3">
          {notice}
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Waiting for your review</h2>
        {reviewables.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white rounded-2xl ring-1 ring-slate-200/70 px-5 py-6">
            Nothing waiting right now. Delivered products appear here, and you can review any product from its page.
          </p>
        ) : (
          <ul className="bg-white rounded-2xl ring-1 ring-slate-200/70 divide-y divide-slate-100">
            {reviewables.map((it) => (
              <li key={`${it.order_id}-${it.product_id}`} className="flex items-center gap-4 px-5 py-4">
                <span className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="w-full h-full object-cover" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${it.slug}`} className="text-sm font-semibold text-slate-900 hover:text-primary line-clamp-1">
                    {it.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Order #{it.order_number} · delivered {new Date(it.delivered_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openWrite(it)}
                  className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shrink-0"
                >
                  Write a review
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Your reviews</h2>
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-10 text-center">
            <MessageSquareText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">You haven&apos;t reviewed anything yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${r.product.slug}`} className="text-sm font-semibold text-slate-900 hover:text-primary">
                      {r.product.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars value={r.rating} />
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLE[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                      {r.is_edited && <span className="text-[11px] text-slate-400">edited</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(r)} aria-label="Edit review" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-brand-50">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r)}
                      disabled={deletingId === r.id}
                      aria-label="Delete review"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-slate-700 whitespace-pre-line">{r.comment}</p>}
                {r.photos && r.photos.length > 0 && (
                  <div className="flex gap-2">
                    {r.photos.map((p, i) => {
                      const url = photoUrl(p);
                      return url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="Review photo" className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200" />
                      ) : null;
                    })}
                  </div>
                )}
                {r.status === "rejected" && r.rejection_reason && (
                  <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2">Not published: {r.rejection_reason}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {target && (
        <ReviewFormDialog
          key={target.mode === "write" ? `w-${target.product.id}` : `e-${target.review.id}`}
          target={target}
          onClose={() => setTarget(null)}
          onSaved={(message) => {
            setTarget(null);
            setNotice(message);
            refresh();
          }}
        />
      )}
    </div>
  );
}
