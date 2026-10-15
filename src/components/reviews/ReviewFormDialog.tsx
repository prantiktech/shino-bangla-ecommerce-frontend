"use client";

/**
 * Write or edit a product review. Writing works for any product on sale (once per customer);
 * new reviews are held until the shop approves them. Used by the account page and the product page.
 */
import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { CustomerReview, submitReviewAction, updateReviewAction, uploadReviewPhotoAction } from "@/app/(user)/actions/reviews";

type Photo = { id: number; url: string };

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function StarRating({ value, onChange, size = "w-4 h-4" }: { value: number; onChange?: (v: number) => void; size?: string }) {
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

export type ReviewFormTarget =
  | { mode: "write"; product: { id: number; name: string } }
  | { mode: "edit"; review: CustomerReview };

export function ReviewFormDialog({
  target,
  onClose,
  onSaved,
}: {
  target: ReviewFormTarget;
  onClose: () => void;
  /** Called after a successful save with a message to show the customer. */
  onSaved: (message: string) => void;
}) {
  const writing = target.mode === "write";
  const [rating, setRating] = useState(writing ? 5 : target.review.rating);
  const [comment, setComment] = useState(writing ? "" : target.review.comment ?? "");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const productName = writing ? target.product.name : target.review.product.name;

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    for (const f of Array.from(files).slice(0, 5 - photos.length)) {
      if (f.size > MAX_PHOTO_BYTES) {
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
    if (target.mode === "write") {
      const res = await submitReviewAction({
        product_id: target.product.id,
        rating,
        comment: comment.trim() || undefined,
        photo_ids: photos.map((p) => p.id),
      });
      setSaving(false);
      if (!res.success) return setError(res.error.message);
      onSaved("Thanks! Your review will appear once it has been checked.");
    } else {
      const res = await updateReviewAction(target.review.id, { rating, comment: comment.trim() });
      setSaving(false);
      if (!res.success) return setError(res.error.message);
      onSaved("Your review was updated.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={() => !saving && onClose()} aria-hidden="true" />
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
            <p className="text-sm text-slate-500 line-clamp-1">{productName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <div className="text-center">
          <StarRating value={rating} onChange={setRating} />
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
              Photos <span className="text-slate-400 font-normal">(up to 5, 2 MB each)</span>
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
        {writing && <p className="text-xs text-slate-500">You can review each product once. Reviews appear after the shop checks them.</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 px-5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
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
  );
}
