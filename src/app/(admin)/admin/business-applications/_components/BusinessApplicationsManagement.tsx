"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Building2, ExternalLink, FileText, Image as ImageIcon, Mail, MapPin, Phone, Trash2, User } from "lucide-react";
import {
  deleteAdminBusinessApplicationAction,
  getAdminBusinessApplicationAction,
  getAdminBusinessApplicationsAction,
  updateAdminBusinessApplicationAction,
} from "@/app/(admin)/actions/business-applications";
import type { Paginated } from "@/app/(admin)/actions/_request";
import type { BusinessApplication, BusinessApplicationStatus } from "@/types/admin-orders";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  InlineError,
  LoadingRows,
  Modal,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Spinner,
  TableShell,
  TBody,
  THead,
  Tabs,
  Textarea,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { downloadUrl, formatBytes, formatDateTime } from "@/app/(admin)/components/format";
import { BUSINESS_STATUS_META, metaFor } from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";

type StatusTab = "" | BusinessApplicationStatus;
const STATUSES: BusinessApplicationStatus[] = ["new", "contacted", "approved", "rejected"];

function ApplicationDetail({
  id,
  onClose,
  onUpdated,
  onDeleted,
}: {
  id: number;
  onClose: () => void;
  onUpdated: (a: BusinessApplication) => void;
  onDeleted: (id: number) => void;
}) {
  const can = useCan();
  const [app, setApp] = useState<BusinessApplication | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<BusinessApplicationStatus>("new");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminBusinessApplicationAction(id).then((res) => {
      if (cancelled) return;
      if (!res.success) return setLoadError(res.error.message);
      setApp(res.data);
      setStatus(res.data.status);
      setNote(res.data.admin_note ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const dirty = !!app && (status !== app.status || (note.trim() || null) !== (app.admin_note ?? null));

  const save = async () => {
    if (!app) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    const payload: { status?: BusinessApplicationStatus; admin_note?: string | null } = {};
    if (status !== app.status) payload.status = status;
    if ((note.trim() || null) !== (app.admin_note ?? null)) payload.admin_note = note.trim() || null;
    const res = await updateAdminBusinessApplicationAction(app.id, payload);
    setBusy(false);
    if (!res.success) return setErr(res.error.message);
    setApp(res.data);
    setStatus(res.data.status);
    setNote(res.data.admin_note ?? "");
    onUpdated(res.data);
    setOk("Application updated.");
  };

  const remove = async () => {
    if (!app) return;
    setBusy(true);
    const res = await deleteAdminBusinessApplicationAction(app.id);
    setBusy(false);
    setConfirmDelete(false);
    if (!res.success) return setErr(res.error.message);
    onDeleted(app.id);
  };

  const editable = can("business-applications.update");
  const st = app ? metaFor(BUSINESS_STATUS_META, app.status) : null;

  return (
    <>
      <Modal
        open
        onClose={() => !busy && !confirmDelete && onClose()}
        size="lg"
        title={app ? app.business.name : "Business application"}
        description={app ? `Applied ${formatDateTime(app.created_at)}` : undefined}
        footer={
          app ? (
            <>
              {can("business-applications.delete") && (
                <Button variant="ghost" icon={Trash2} className="text-rose-600 hover:bg-rose-50 sm:mr-auto" disabled={busy} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )}
              <Button variant="secondary" onClick={onClose} disabled={busy}>
                Close
              </Button>
              {editable && (
                <Button loading={busy} disabled={!dirty} onClick={save}>
                  Save
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {loadError ? (
          <InlineError message={loadError} />
        ) : !app ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <InlineError message={err} />
            {ok && <p className="rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-3 py-2 text-emerald-800">{ok}</p>}

            <div className="flex items-center gap-2 flex-wrap">
              {st && <Badge tone={st.tone}>{st.label}</Badge>}
              {app.reviewed_by && (
                <span className="text-xs text-slate-500">
                  Last reviewed by {app.reviewed_by} · {formatDateTime(app.reviewed_at)}
                </span>
              )}
              {app.customer_id && <Badge tone="blue">Customer #{app.customer_id}</Badge>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="rounded-xl ring-1 ring-slate-200 p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" /> Business
                </h3>
                <Detail label="Type" value={app.business.type_label} />
                <Detail label="Trade licence no." value={app.business.trade_license_number} mono />
                <Detail label="BIN / TIN" value={app.business.bin_tin} mono />
                <Detail
                  label="Address"
                  value={
                    <span className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                      {[app.business.address, app.business.district].filter(Boolean).join(", ")}
                    </span>
                  }
                />
                <Detail label="Interested in" value={app.business.interested_in} />
              </section>
              <section className="rounded-xl ring-1 ring-slate-200 p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" /> Contact
                </h3>
                <Detail label="Name" value={[app.contact.name, app.contact.designation].filter(Boolean).join(", ")} />
                <Detail
                  label="Phone"
                  value={
                    <a href={`tel:${app.contact.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Phone className="w-3.5 h-3.5" /> {app.contact.phone}
                    </a>
                  }
                />
                {app.contact.alternate_phone && <Detail label="Alternate phone" value={app.contact.alternate_phone} mono />}
                {app.contact.email && (
                  <Detail
                    label="Email"
                    value={
                      <a href={`mailto:${app.contact.email}`} className="inline-flex items-center gap-1 text-primary hover:underline break-all">
                        <Mail className="w-3.5 h-3.5" /> {app.contact.email}
                      </a>
                    }
                  />
                )}
              </section>
            </div>

            {app.message && (
              <section className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-1">Message</h3>
                <p className="text-slate-700 whitespace-pre-line">{app.message}</p>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-semibold text-slate-900">Documents</h3>
              {!app.documents?.length ? (
                <p className="text-slate-500">No documents attached.</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {app.documents.map((d) => (
                    <li key={d.id}>
                      <a
                        href={downloadUrl(`/admin/business-applications/${app.id}/documents/${d.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg ring-1 ring-slate-200 px-3 py-2.5 hover:bg-slate-50"
                      >
                        <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          {d.mime_type.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-800">{d.label}</span>
                          <span className="block text-xs text-slate-500 truncate">
                            {d.original_name} · {formatBytes(d.size_bytes)}
                          </span>
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {editable ? (
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <Field label="Status">
                  <Select value={status} disabled={busy} onChange={(e) => setStatus(e.target.value as BusinessApplicationStatus)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {BUSINESS_STATUS_META[s].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Internal note" hint={`Only staff see this. ${note.length}/2000`} className="sm:col-span-2">
                  <Textarea value={note} rows={3} maxLength={2000} disabled={busy} onChange={(e) => setNote(e.target.value)} placeholder="Called, sending a price list" />
                </Field>
              </section>
            ) : (
              app.admin_note && (
                <section className="pt-2 border-t border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-1">Internal note</h3>
                  <p className="text-slate-700 whitespace-pre-line">{app.admin_note}</p>
                </section>
              )
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this application?"
        message="The application and its trade licence and NID files are erased permanently."
        confirmLabel="Delete application"
        loading={busy}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-slate-500 text-xs pt-0.5">{label}</span>
      <span className={`col-span-2 text-slate-800 break-words ${mono ? "font-mono text-xs" : ""}`}>{value || <span className="text-slate-400">—</span>}</span>
    </div>
  );
}

export function BusinessApplicationsManagement({
  initial,
  initialError,
}: {
  initial: Paginated<BusinessApplication>;
  initialError: string | null;
}) {
  const [list, setList] = useState(initial);
  const [status, setStatus] = useState<StatusTab>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const { notice, success, error, clear } = useNotice();

  const load = async (opts: { status?: StatusTab; q?: string; page?: number } = {}) => {
    setLoading(true);
    const res = await getAdminBusinessApplicationsAction({ status: opts.status ?? status, q: opts.q ?? q, page: opts.page ?? page });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };
  const debounced = useDebouncedCallback((term: string) => {
    setPage(1);
    load({ q: term, page: 1 });
  });

  const newCount = list.meta.counts?.new;

  return (
    <div className="space-y-5">
      <PageHeader icon={Briefcase} title="Business applications" description="Wholesale requests from businesses, with their trade licence and NID." />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <Tabs
          tabs={[
            { value: "all", label: "All" },
            { value: "new", label: "New", count: newCount },
            { value: "contacted", label: "Contacted" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
          value={status || "all"}
          onChange={(v) => {
            const s = (v === "all" ? "" : v) as StatusTab;
            setStatus(s);
            setPage(1);
            load({ status: s, page: 1 });
          }}
        />
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            debounced(v);
          }}
          placeholder="Business, contact, phone or licence"
          className="lg:w-80"
        />
      </div>

      <TableShell>
        <THead>
          <th className={th}>Business</th>
          <th className={th}>Contact</th>
          <th className={th}>District</th>
          <th className={th}>Status</th>
          <th className={th}>Applied</th>
          <th className={`${th} text-right`}>
            <span className="sr-only">Actions</span>
          </th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={6} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState icon={Briefcase} title="No applications" description={status || q ? "Try another filter." : "Applications from the wholesale form appear here."} />
              </td>
            </tr>
          ) : (
            list.data.map((a) => {
              const st = metaFor(BUSINESS_STATUS_META, a.status);
              return (
                <tr key={a.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setViewing(a.id)}>
                  <td className={td}>
                    <div className="font-medium text-slate-900">{a.business.name}</div>
                    <div className="text-xs text-slate-500">
                      {a.business.type_label}
                      {a.documents_count ? ` · ${a.documents_count} document${a.documents_count === 1 ? "" : "s"}` : ""}
                    </div>
                  </td>
                  <td className={td}>
                    <div className="text-slate-800">{a.contact.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{a.contact.phone}</div>
                  </td>
                  <td className={`${td} text-slate-600`}>{a.business.district ?? "—"}</td>
                  <td className={td}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </td>
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`}>{formatDateTime(a.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <IconButton
                      label={`Open ${a.business.name}`}
                      icon={ExternalLink}
                      tone="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(a.id);
                      }}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </TBody>
      </TableShell>

      <Pagination
        meta={list.meta}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          load({ page: p });
        }}
      />

      {viewing !== null && (
        <ApplicationDetail
          key={viewing}
          id={viewing}
          onClose={() => setViewing(null)}
          onUpdated={(a) => {
            setList((l) => {
              const before = l.data.find((x) => x.id === a.id)?.status;
              const delta = (before === "new" ? -1 : 0) + (a.status === "new" && before !== "new" ? 1 : 0);
              const counts = l.meta.counts?.new !== undefined ? { ...l.meta.counts, new: Math.max(0, l.meta.counts.new + delta) } : l.meta.counts;
              return {
                data: status && a.status !== status ? l.data.filter((x) => x.id !== a.id) : l.data.map((x) => (x.id === a.id ? { ...x, ...a } : x)),
                meta: { ...l.meta, counts },
              };
            });
          }}
          onDeleted={(deletedId) => {
            setViewing(null);
            setList((l) => ({ ...l, data: l.data.filter((x) => x.id !== deletedId), meta: { ...l.meta, total: Math.max(0, l.meta.total - 1) } }));
            success("Application deleted.");
          }}
        />
      )}
    </div>
  );
}
