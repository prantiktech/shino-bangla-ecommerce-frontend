"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Edit2, ImagePlus, Loader2, MessageSquareText, Star, Trash2, X } from "lucide-react";
import {
  CustomerReview,
  ReviewableItem,
  deleteMyReviewAction,
  getMyReviewsAction,
  getReviewableItemsAction,
  submitReviewAction,
  updateReviewAction,
  uploadReviewPhotoAction,
} from "@/app/(user)/actions/reviews";

type Photo = { id: number; url: string };

function Stars({ value, onChange, size = "w-4 h-4" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <span className="inline-flex gap-1" role={onChange ? "radiogroup" : undefined} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star className={`w-7 h-7 transition-colors ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"}`} />
          </button>
        ) : (
          <Star key={n} className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        )
      )}
    </span>
  );
}

const photoUrl = (p: unknown): string | null =>
  typeof p === "string" ? p : p && typeof p === "object" && "url" in p ? String((p as { url: string }).url) : null;

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-rose-50 text-rose-700",
};

/** Write reviews for delivered items and manage the shopper's existing reviews. */
export function ReviewsTab({ initialReviewables, initialReviews }: { initialReviewables: ReviewableItem[]; initialReviews: CustomerReview[] }) {
  const [reviewables, setReviewables] = useState(initialReviewables);
  const [reviews, setReviews] = useState(initialReviews);
  const [writing, setWriting] = useState<ReviewableItem | null>(null);
  const [editing, setEditing] = useState<CustomerReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const [a, b] = await Promise.all([getReviewableItemsAction(), getMyReviewsAction()]);
    if (a.success) setReviewables(a.data);
    if (b.success) setReviews(b.data);
  };

  const openWrite = (item: ReviewableItem) => {
    setWriting(item);
    setEditing(null);
    setRating(5);
    setComment("");
    setPhotos([]);
    setError(null);
  };

  const openEdit = (r: CustomerReview) => {
    setEditing(r);
    setWriting(null);
    setRating(r.rating);
    setComment(r.comment ?? "");
    setPhotos([]);
    setError(null);
  };

  const close = () => {
    setWriting(null);
    setEditing(null);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    for (const f of Array.from(files).slice(0, 5 - photos.length)) {
      if (f.size > 2 * 1024 * 1024) {
        setError(`${f.name} is larger than 2 MB.`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", f);
      const res = await uploadReviewPhotoAction(fd);
      if (res.success) setPhotos((p) => [...p, { id: res.data.id, url: res.data.sizes?.thumb || res.data.url }]);
      else setError(res.error.message);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return setError("Choose a star rating.");
    setSaving(true);
    setError(null);
    if (writing) {
      const res = await submitReviewAction({
        product_id: writing.product_id,
        order_id: writing.order_id,
        rating,
        comment: comment.trim() || undefined,
        photo_ids: photos.map((p) => p.id),
      });
      setSaving(false);
      if (!res.success) return setError(res.error.message);
      setNotice("Thanks! Your review will appear once it has been checked.");
    } else if (editing) {
      const res = await updateReviewAction(editing.id, { rating, comment: comment.trim() });
      setSaving(false);
      if (!res.success) return setError(res.error.message);
      setNotice("Your review was updated.");
    }
    close();
    refresh();
  };

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

  const modalOpen = !!writing || !!editing;
  const modalTitle = writing ? writing.name : editing?.product.name;

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
            Nothing to review right now. Delivered products will appear here.
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

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={close} aria-hidden="true" />
          <form
            onSubmit={save}
            role="dialog"
            aria-modal="true"
            aria-label={writing ? "Write a review" : "Edit review"}
            className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{writing ? "Write a review" : "Edit your review"}</h3>
                <p className="text-sm text-slate-500 line-clamp-1">{modalTitle}</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="text-center">
              <Stars value={rating} onChange={setRating} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-sm font-medium text-slate-700">
                Your review <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What did you like or dislike? How did you use it?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <p className="text-right text-xs text-slate-400">{comment.length}/2000</p>
            </div>
            {writing && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Photos <span className="text-slate-400 font-normal">(up to 5)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {photos.map((p) => (
                    <span key={p.id} className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((list) => list.filter((x) => x.id !== p.id))}
                        aria-label="Remove photo"
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/95 text-slate-600 flex items-center justify-center shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-brand-200"
                      aria-label="Add photos"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={close} className="h-11 px-5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="h-11 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {writing ? "Submit review" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
