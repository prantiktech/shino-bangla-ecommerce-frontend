"use client";

import React, { useState } from "react";
import { Edit2, Mail, MailCheck, Plus, Send, Trash2, Users } from "lucide-react";
import {
  Campaign,
  Subscriber,
  createAdminCampaignAction,
  deleteAdminCampaignAction,
  getAdminCampaignAction,
  getAdminCampaignsAction,
  getAdminSubscribersAction,
  sendAdminCampaignAction,
  updateAdminCampaignAction,
} from "@/app/(admin)/actions/newsletter";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  BadgeTone,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  HtmlEditor,
  IconButton,
  InlineError,
  Input,
  LoadingRows,
  Modal,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  TableShell,
  Tabs,
  TBody,
  THead,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime, fromDateTimeLocal, toDateTimeLocal } from "@/app/(admin)/components/format";

const CAMPAIGN_TONE: Record<string, BadgeTone> = { draft: "slate", scheduled: "blue", sending: "amber", sent: "green" };

export function NewsletterManagement({
  initialSubscribers,
  initialCampaigns,
  activeCount,
  initialError,
}: {
  initialSubscribers: Paginated<Subscriber>;
  initialCampaigns: Paginated<Campaign>;
  activeCount: number | null;
  initialError: string | null;
}) {
  const [tab, setTab] = useState<"campaigns" | "subscribers">("campaigns");
  const { notice, success, error, clear } = useNotice();

  // Subscribers
  const [subs, setSubs] = useState(initialSubscribers);
  const [subQ, setSubQ] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [subLoading, setSubLoading] = useState(false);

  // Campaigns
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [cPage, setCPage] = useState(1);
  const [cLoading, setCLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadSubs = async (opts: { q?: string; filter?: string; page?: number } = {}) => {
    setSubLoading(true);
    const res = await getAdminSubscribersAction({
      q: opts.q ?? subQ,
      subscribed: (opts.filter ?? subFilter) || undefined,
      page: opts.page ?? subPage,
    });
    setSubLoading(false);
    if (res.success) setSubs(res.data);
    else error(res.error.message);
  };
  const debouncedSubs = useDebouncedCallback((term: string) => {
    setSubPage(1);
    loadSubs({ q: term, page: 1 });
  });

  const loadCampaigns = async (page = cPage) => {
    setCLoading(true);
    const res = await getAdminCampaignsAction({ page });
    setCLoading(false);
    if (res.success) setCampaigns(res.data);
    else error(res.error.message);
  };

  const openCreate = () => {
    setEditing(null);
    setSubject("");
    setBody("");
    setScheduledAt("");
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setSubject(c.subject);
    setBody(c.body);
    setScheduledAt(toDateTimeLocal(c.scheduled_at));
    setFormError(null);
    setFormOpen(true);
    getAdminCampaignAction(c.id).then((r) => {
      if (!r.success) return;
      setEditing(r.data);
      setSubject(r.data.subject);
      setBody(r.data.body);
      setScheduledAt(toDateTimeLocal(r.data.scheduled_at));
    });
  };

  const save = async () => {
    if (!subject.trim()) return setFormError("Enter a subject line.");
    if (!body.trim()) return setFormError("Write the email body.");
    const sched = fromDateTimeLocal(scheduledAt);
    if (sched && new Date(sched) <= new Date()) return setFormError("The scheduled time must be in the future.");
    setSaving(true);
    setFormError(null);
    const payload = { subject: subject.trim(), body, scheduled_at: sched };
    const res = editing ? await updateAdminCampaignAction(editing.id, payload) : await createAdminCampaignAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? "Campaign saved." : "Campaign saved as a draft.");
    loadCampaigns();
  };

  const send = async () => {
    if (!sending) return;
    setConfirmBusy(true);
    const res = await sendAdminCampaignAction(sending.id);
    setConfirmBusy(false);
    setSending(null);
    if (!res.success) return error(res.error.message);
    success(`"${res.data.subject}" is being sent to ${res.data.recipient_count} subscribers.`);
    loadCampaigns();
  };

  const remove = async () => {
    if (!deleting) return;
    setConfirmBusy(true);
    const res = await deleteAdminCampaignAction(deleting.id);
    setConfirmBusy(false);
    setDeleting(null);
    if (!res.success) return error(res.error.message);
    success("Campaign deleted.");
    loadCampaigns();
  };

  const editable = (c: Campaign) => c.status === "draft" || c.status === "scheduled";

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Mail}
        title="Newsletter"
        description="Email campaigns and the people who signed up to receive them."
        actions={tab === "campaigns" && <Button icon={Plus} onClick={openCreate}>New campaign</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active subscribers" value={activeCount ?? "—"} icon={Users} tone="orange" />
        <StatCard label="Total sign-ups" value={initialSubscribers.meta.total} icon={MailCheck} tone="blue" />
        <StatCard label="Campaigns" value={campaigns.meta.total} icon={Send} tone="green" />
      </div>

      <Tabs
        tabs={[
          { value: "campaigns", label: "Campaigns" },
          { value: "subscribers", label: "Subscribers" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "campaigns" ? (
        <>
          <TableShell>
            <THead>
              <th className={th}>Subject</th>
              <th className={th}>Status</th>
              <th className={th}>Recipients</th>
              <th className={th}>Scheduled / sent</th>
              <th className={th}>Author</th>
              <th className={`${th} text-right`}>Actions</th>
            </THead>
            <TBody>
              {cLoading ? (
                <LoadingRows cols={6} />
              ) : campaigns.data.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Send} title="No campaigns yet" action={<Button icon={Plus} onClick={openCreate}>New campaign</Button>} />
                  </td>
                </tr>
              ) : (
                campaigns.data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className={`${td} font-semibold text-slate-900 max-w-xs truncate`}>{c.subject}</td>
                    <td className={td}>
                      <Badge tone={CAMPAIGN_TONE[c.status] ?? "slate"}>{c.status}</Badge>
                    </td>
                    <td className={`${td} tabular-nums text-xs`}>
                      {c.status === "sent" || c.status === "sending" ? `${c.sent_count} / ${c.recipient_count}` : "—"}
                    </td>
                    <td className={`${td} text-xs`}>{c.sent_at ? formatDateTime(c.sent_at) : c.scheduled_at ? formatDateTime(c.scheduled_at) : "—"}</td>
                    <td className={`${td} text-xs`}>{c.author ?? "—"}</td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <span className="inline-flex gap-1 items-center">
                        {editable(c) && (
                          <>
                            <Button size="sm" variant="secondary" icon={Send} onClick={() => setSending(c)}>
                              Send now
                            </Button>
                            <IconButton label="Edit campaign" icon={Edit2} tone="primary" onClick={() => openEdit(c)} />
                          </>
                        )}
                        <IconButton label="Delete campaign" icon={Trash2} tone="danger" onClick={() => setDeleting(c)} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </TBody>
          </TableShell>
          <Pagination
            meta={campaigns.meta}
            disabled={cLoading}
            onPageChange={(p) => {
              setCPage(p);
              loadCampaigns(p);
            }}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={subQ}
              onChange={(v) => {
                setSubQ(v);
                debouncedSubs(v);
              }}
              placeholder="Search emails"
              className="sm:w-72"
            />
            <Select
              value={subFilter}
              onChange={(e) => {
                setSubFilter(e.target.value);
                setSubPage(1);
                loadSubs({ filter: e.target.value, page: 1 });
              }}
              className="sm:w-48"
              aria-label="Filter subscribers"
            >
              <option value="">Everyone</option>
              <option value="1">Subscribed</option>
              <option value="0">Unsubscribed</option>
            </Select>
          </div>
          <TableShell>
            <THead>
              <th className={th}>Email</th>
              <th className={th}>Source</th>
              <th className={th}>Status</th>
              <th className={th}>Signed up</th>
              <th className={th}>Unsubscribed</th>
            </THead>
            <TBody>
              {subLoading ? (
                <LoadingRows cols={5} />
              ) : subs.data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={Users} title="No subscribers found" />
                  </td>
                </tr>
              ) : (
                subs.data.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className={`${td} font-medium text-slate-900`}>{s.email}</td>
                    <td className={`${td} text-xs capitalize`}>{s.source ?? "—"}</td>
                    <td className={td}>
                      <Badge tone={s.is_subscribed ? "green" : "slate"}>{s.is_subscribed ? "Subscribed" : "Unsubscribed"}</Badge>
                    </td>
                    <td className={`${td} text-xs`}>{formatDateTime(s.subscribed_at)}</td>
                    <td className={`${td} text-xs`}>{s.unsubscribed_at ? formatDateTime(s.unsubscribed_at) : "—"}</td>
                  </tr>
                ))
              )}
            </TBody>
          </TableShell>
          <Pagination
            meta={subs.meta}
            disabled={subLoading}
            onPageChange={(p) => {
              setSubPage(p);
              loadSubs({ page: p });
            }}
          />
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit campaign" : "New campaign"}
        description="Campaigns are saved as drafts. Send them when ready, or schedule a time."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              Save campaign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InlineError message={formError} />
          <Field label="Subject line" required>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} autoFocus />
          </Field>
          <Field label="Email body" required>
            <HtmlEditor value={body} onChange={setBody} rows={12} />
          </Field>
          <Field label="Schedule" hint="Optional. Leave blank to send manually.">
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="sm:w-72" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!sending}
        title="Send campaign now?"
        tone="primary"
        message={
          <>
            <strong className="text-slate-900">{sending?.subject}</strong> will be emailed to every active subscriber
            {activeCount !== null ? ` (${activeCount})` : ""}. Sent campaigns cannot be edited.
          </>
        }
        confirmLabel="Send now"
        loading={confirmBusy}
        onConfirm={send}
        onClose={() => setSending(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete campaign?"
        message={<>Delete <strong className="text-slate-900">{deleting?.subject}</strong>?</>}
        confirmLabel="Delete"
        loading={confirmBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
