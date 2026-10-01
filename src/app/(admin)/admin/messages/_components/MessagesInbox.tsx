"use client";

import React, { useState } from "react";
import { CheckCheck, Inbox, Mail, Phone, Trash2, User } from "lucide-react";
import {
  ContactMessage,
  deleteAdminMessageAction,
  getAdminMessageAction,
  getAdminMessagesAction,
  markAdminMessageRepliedAction,
} from "@/app/(admin)/actions/content";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Spinner,
  Tabs,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime } from "@/app/(admin)/components/format";
import { cn } from "@/lib/utils";

export function MessagesInbox({ initial, initialError }: { initial: Paginated<ContactMessage>; initialError: string | null }) {
  const [list, setList] = useState(initial);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const load = async (opts: { tab?: "all" | "unread"; q?: string; page?: number } = {}) => {
    setLoading(true);
    const t = opts.tab ?? tab;
    const res = await getAdminMessagesAction({ unread: t === "unread" ? 1 : undefined, q: opts.q ?? q, page: opts.page ?? page });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };
  const debounced = useDebouncedCallback((term: string) => {
    setPage(1);
    load({ q: term, page: 1 });
  });

  const open = async (m: ContactMessage) => {
    setSelected(m);
    if (m.is_read) return;
    setOpening(true);
    const res = await getAdminMessageAction(m.id); // opening marks it read
    setOpening(false);
    if (res.success) {
      setSelected(res.data);
      setList((l) => ({ ...l, data: l.data.map((x) => (x.id === m.id ? res.data : x)) }));
    }
  };

  const markReplied = async () => {
    if (!selected) return;
    setBusy(true);
    const res = await markAdminMessageRepliedAction(selected.id);
    setBusy(false);
    if (!res.success) return error(res.error.message);
    setSelected(res.data);
    setList((l) => ({ ...l, data: l.data.map((x) => (x.id === res.data.id ? res.data : x)) }));
    success("Marked as replied.");
  };

  const remove = async () => {
    if (!selected) return;
    setBusy(true);
    const res = await deleteAdminMessageAction(selected.id);
    setBusy(false);
    setDeleting(false);
    if (!res.success) return error(res.error.message);
    setList((l) => ({ ...l, data: l.data.filter((x) => x.id !== selected.id) }));
    setSelected(null);
    success("Message deleted.");
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Inbox} title="Inbox" description="Messages sent through the storefront contact form." />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <Tabs
          tabs={[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setPage(1);
            load({ tab: v, page: 1 });
          }}
        />
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            debounced(v);
          }}
          placeholder="Search messages"
          className="sm:w-72"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card padded={false} className={cn("lg:col-span-2 overflow-hidden", selected && "hidden lg:block")}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : list.data.length === 0 ? (
            <EmptyState icon={Inbox} title={tab === "unread" ? "No unread messages" : "No messages"} />
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
              {list.data.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => open(m)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer",
                      selected?.id === m.id && "bg-brand-50/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", m.is_read ? "text-slate-700" : "font-bold text-slate-900")}>
                        {!m.is_read && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />}
                        {m.name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">{formatDateTime(m.created_at)}</span>
                    </div>
                    <p className={cn("text-sm truncate mt-0.5", m.is_read ? "text-slate-500" : "text-slate-800 font-medium")}>
                      {m.subject || "(no subject)"}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{m.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={cn("lg:col-span-3 min-h-[320px]", !selected && "hidden lg:block")}>
          {!selected ? (
            <EmptyState icon={Mail} title="Select a message" description="Choose a message on the left to read it." />
          ) : (
            <div className="space-y-5">
              <button type="button" className="lg:hidden text-sm text-primary font-medium" onClick={() => setSelected(null)}>
                ← Back to inbox
              </button>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selected.subject || "(no subject)"}</h2>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(selected.created_at)}</p>
                </div>
                {selected.replied_at ? (
                  <Badge tone="green">Replied {formatDateTime(selected.replied_at)}</Badge>
                ) : (
                  <Badge tone="amber">Awaiting reply</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 rounded-xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {selected.name}
                  {selected.customer && <Badge tone="blue">Customer</Badge>}
                </span>
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Mail className="w-4 h-4" />
                    {selected.email}
                  </a>
                )}
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="w-4 h-4" />
                    {selected.phone}
                  </a>
                )}
              </div>
              {opening ? <Spinner /> : <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{selected.message}</p>}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {selected.email && (
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject ?? "Your message"}`)}`}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
                  >
                    <Mail className="w-4 h-4" />
                    Reply by email
                  </a>
                )}
                {!selected.replied_at && (
                  <Button variant="secondary" icon={CheckCheck} loading={busy} onClick={markReplied}>
                    Mark as replied
                  </Button>
                )}
                <Button variant="ghost" icon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleting(true)}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Pagination
        meta={list.meta}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          load({ page: p });
        }}
      />

      <ConfirmDialog
        open={deleting}
        title="Delete message?"
        message="This message is removed permanently."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(false)}
      />
    </div>
  );
}
