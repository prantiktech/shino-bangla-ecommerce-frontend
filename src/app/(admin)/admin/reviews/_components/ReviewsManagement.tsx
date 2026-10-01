"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Edit2, Eye, EyeOff, MessageSquareText, Sparkles, Star, Trash2, XCircle } from "lucide-react";
import {
  AdminReview,
  approveAdminReviewAction,
  deleteAdminReviewAction,
  getAdminReviewAction,
  getAdminReviewsAction,
  rejectAdminReviewAction,
  setAdminReviewFeaturedAction,
  setAdminReviewHiddenAction,
  updateAdminReviewAction,
} from "@/app/(admin)/actions/reviews";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  InlineError,
  Modal,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Spinner,
  Tabs,
  Textarea,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime } from "@/app/(admin)/components/format";

type StatusTab = "pending" | "approved" | "rejected" | "hidden" | "featured";

/** Map a tab to documented query filters. Hidden / featured only apply to approved reviews. */
function tabParams(tab: StatusTab) {
  if (tab === "hidden") return { status: "approved", is_hidden: 1 };
  if (tab === "featured") return { status: "approved", is_featured: 1 };
  return { status: tab };
}

/** Does a review still belong on the given tab after a change? */
function belongs(r: AdminReview, tab: StatusTab) {
  if (tab === "hidden") return r.status === "approved" && r.is_hidden;
  if (tab === "featured") return r.status === "approved" && r.is_featured;
  return r.status === tab;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="cursor-pointer">
            <Star className={`w-5 h-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ) : (
          <Star key={n} className={`w-4 h-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        )
      )}
    </span>
  );
}

export function ReviewsManagement({ initial, initialError }: { initial: Paginated<AdminReview>; initialError: string | null }) {
  const [list, setList] = useState(initial);
  const [status, setStatus] = useState<StatusTab>("pending");
  const [rating, setRating] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { notice, success, error, clear } = useNotice();

  const [rejecting, setRejecting] = useState<AdminReview | null>(null);
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState<AdminReview | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);

  const load = async (opts: { status?: StatusTab; rating?: string; q?: string; page?: number } = {}) => {
    setLoading(true);
    const s = opts.status ?? status;
    const res = await getAdminReviewsAction({
      ...tabParams(s),
      rating: opts.rating ?? rating,
      q: opts.q ?? q,
      page: opts.page ?? page,
    });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };
  const debounced = useDebouncedCallback((term: string) => {
    setPage(1);
    load({ q: term, page: 1 });
  });

  /** Run a moderation action and replace the row (or drop it when it leaves the current tab). */
  const act = async (r: AdminReview, fn: () => Promise<{ success: boolean; data?: AdminReview; error?: { message: string } }>, msg: string) => {
    setBusyId(r.id);
    const res = await fn();
    setBusyId(null);
    if (!res.success || !res.data) return error(res.error?.message || "Action failed.");
    const updated = res.data;
    setList((l) => ({
      ...l,
      data: belongs(updated, status)
        ? l.data.map((x) => (x.id === r.id ? updated : x))
        : l.data.filter((x) => x.id !== r.id),
    }));
    success(msg);
  };

  const submitReject = async () => {
    if (!rejecting) return;
    setModalBusy(true);
    setModalError(null);
    const res = await rejectAdminReviewAction(rejecting.id, reason);
    setModalBusy(false);
    if (!res.success) return setModalError(res.error.message);
    setList((l) => ({
      ...l,
      data: belongs(res.data, status)
        ? l.data.map((x) => (x.id === res.data.id ? res.data : x))
        : l.data.filter((x) => x.id !== res.data.id),
    }));
    setRejecting(null);
    success("Review rejected.");
  };

  const submitEdit = async () => {
    if (!editing) return;
    setModalBusy(true);
    setModalError(null);
    const res = await updateAdminReviewAction(editing.id, { comment: editComment.trim() || null, rating: editRating });
    setModalBusy(false);
    if (!res.success) return setModalError(res.error.message);
    setList((l) => ({ ...l, data: l.data.map((x) => (x.id === res.data.id ? res.data : x)) }));
    setEditing(null);
    success("Review updated. It is marked as edited by the shop.");
  };

  const submitDelete = async () => {
    if (!deleting) return;
    setModalBusy(true);
    const res = await deleteAdminReviewAction(deleting.id);
    setModalBusy(false);
    if (!res.success) error(res.error.message);
    else {
      setList((l) => ({ ...l, data: l.data.filter((x) => x.id !== deleting.id), meta: { ...l.meta, total: l.meta.total - 1 } }));
      success("Review deleted.");
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={MessageSquareText} title="Reviews" description="Approve, reject, hide and feature customer reviews." />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <Tabs
          tabs={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "hidden", label: "Hidden" },
            { value: "featured", label: "Featured" },
          ]}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
            load({ status: v, page: 1 });
          }}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              debounced(v);
            }}
            placeholder="Search comments or products"
            className="sm:w-72"
          />
          <Select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
              load({ rating: e.target.value, page: 1 });
            }}
            className="sm:w-40"
            aria-label="Filter by rating"
          >
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? "s" : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <Card className="flex justify-center py-12">
          <Spinner />
        </Card>
      ) : list.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquareText}
            title={status === "pending" ? "No reviews waiting" : "No reviews found"}
            description={status === "pending" ? "New customer reviews appear here for approval." : "Try another filter."}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.data.map((r) => (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars value={r.rating} />
                    <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}>{r.status}</Badge>
                    {r.is_hidden && <Badge tone="slate">Hidden</Badge>}
                    {r.is_featured && <Badge tone="orange">Featured</Badge>}
                    {r.edited_by_shop && <Badge tone="purple">Edited by shop</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{r.author?.name ?? "Customer"}</span> on{" "}
                    {r.product ? (
                      <Link href={`/products/${r.product.slug}`} target="_blank" className="font-medium text-primary hover:underline">
                        {r.product.name}
                      </Link>
                    ) : (
                      "a deleted product"
                    )}{" "}
                    · {formatDateTime(r.created_at)}
                  </p>
                </div>
                {busyId === r.id && <Spinner className="w-4 h-4" />}
              </div>

              <p className="text-sm text-slate-700 whitespace-pre-line">{r.comment || <span className="italic text-slate-400">No comment, rating only.</span>}</p>

              {r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.photos.map((p) => (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="Review photo" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {r.rejection_reason && (
                <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2">Rejected: {r.rejection_reason}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {r.status !== "approved" && (
                  <Button
                    size="sm"
                    variant="success"
                    icon={Check}
                    disabled={busyId === r.id}
                    onClick={() => act(r, () => approveAdminReviewAction(r.id), "Review approved and published.")}
                  >
                    Approve
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={XCircle}
                    disabled={busyId === r.id}
                    onClick={() => {
                      setRejecting(r);
                      setReason("");
                      setModalError(null);
                    }}
                  >
                    Reject
                  </Button>
                )}
                {r.status === "approved" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={r.is_hidden ? Eye : EyeOff}
                    disabled={busyId === r.id}
                    onClick={() =>
                      act(r, () => setAdminReviewHiddenAction(r.id, !r.is_hidden), r.is_hidden ? "Review is visible again." : "Review hidden from the shop.")
                    }
                  >
                    {r.is_hidden ? "Unhide" : "Hide"}
                  </Button>
                )}
                {r.is_visible || r.is_featured ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Sparkles}
                    disabled={busyId === r.id}
                    onClick={() =>
                      act(r, () => setAdminReviewFeaturedAction(r.id, !r.is_featured), r.is_featured ? "Removed from the home page." : "Featured on the home page.")
                    }
                  >
                    {r.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Edit2}
                  onClick={() => {
                    setEditing(r);
                    setEditComment(r.comment ?? "");
                    setEditRating(r.rating);
                    setModalError(null);
                    getAdminReviewAction(r.id).then((fresh) => {
                      if (!fresh.success) return;
                      setEditing(fresh.data);
                      setEditComment(fresh.data.comment ?? "");
                      setEditRating(fresh.data.rating);
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" icon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleting(r)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        meta={list.meta}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          load({ page: p });
        }}
      />

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject review"
        description="The reason is kept for your records."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)} disabled={modalBusy}>
              Cancel
            </Button>
            <Button variant="danger" loading={modalBusy} onClick={submitReject}>
              Reject review
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <InlineError message={modalError} />
          <Field label="Reason" hint="Optional, up to 500 characters.">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} placeholder="Contains a phone number" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit review"
        description="Edited reviews are labelled as changed by the shop."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={modalBusy}>
              Cancel
            </Button>
            <Button loading={modalBusy} onClick={submitEdit}>
              Save review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InlineError message={modalError} />
          <Field label="Rating">
            <Stars value={editRating} onChange={setEditRating} />
          </Field>
          <Field label="Comment">
            <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} maxLength={2000} rows={5} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete review?"
        message="The review and its photos are removed permanently. To take it down temporarily, hide it instead."
        confirmLabel="Delete review"
        loading={modalBusy}
        onConfirm={submitDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
