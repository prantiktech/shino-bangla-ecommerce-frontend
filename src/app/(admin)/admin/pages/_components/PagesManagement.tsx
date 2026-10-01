"use client";

import React, { useState } from "react";
import { Edit2, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import {
  AdminPage,
  createAdminPageAction,
  deleteAdminPageAction,
  getAdminPageAction,
  getAdminPagesAction,
  updateAdminPageAction,
} from "@/app/(admin)/actions/content";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  HtmlEditor,
  IconButton,
  InlineError,
  Input,
  Modal,
  NoticeBanner,
  PageHeader,
  TableShell,
  TBody,
  Textarea,
  THead,
  Toggle,
  td,
  th,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime, slugify } from "@/app/(admin)/components/format";

interface FormState {
  title: string;
  slug: string;
  content: string;
  is_active: boolean;
  seo_title: string;
  seo_description: string;
}

const emptyForm: FormState = { title: "", slug: "", content: "", is_active: true, seo_title: "", seo_description: "" };

export function PagesManagement({ initial, initialError }: { initial: AdminPage[]; initialError: string | null }) {
  const [pages, setPages] = useState(initial);
  const { notice, success, error, clear } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPage | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminPage | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = async () => {
    const res = await getAdminPagesAction();
    if (res.success) setPages(res.data ?? []);
  };
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };
  const pageToForm = (p: AdminPage): FormState => ({
    title: p.title,
    slug: p.slug,
    content: p.content ?? "",
    is_active: p.is_active,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
  });

  const openEdit = (p: AdminPage) => {
    setEditing(p);
    setForm(pageToForm(p));
    setFormError(null);
    setFormOpen(true);
    getAdminPageAction(p.id).then((r) => {
      if (r.success) {
        setEditing(r.data);
        setForm(pageToForm(r.data));
      }
    });
  };

  const save = async () => {
    if (!form.title.trim()) return setFormError("Give the page a title.");
    if (form.slug && !/^[A-Za-z0-9_-]+$/.test(form.slug)) return setFormError("The slug may only use letters, numbers, - and _.");
    setSaving(true);
    setFormError(null);
    const payload = {
      title: form.title.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      content: form.content || null,
      is_active: form.is_active,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
    };
    const res = editing ? await updateAdminPageAction(editing.id, payload) : await createAdminPageAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? `Page "${res.data.title}" saved.` : `Page "${res.data.title}" created.`);
    reload();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminPageAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`Page "${deleting.title}" deleted.`);
      reload();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileText}
        title="Pages"
        description="Standing pages such as About us, Delivery and Returns. Active pages appear in the storefront footer."
        actions={<Button icon={Plus} onClick={openCreate}>New page</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <TableShell>
        <THead>
          <th className={th}>Title</th>
          <th className={th}>URL</th>
          <th className={th}>Status</th>
          <th className={th}>Last updated</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {pages.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={FileText} title="No pages yet" action={<Button icon={Plus} onClick={openCreate}>New page</Button>} />
              </td>
            </tr>
          ) : (
            pages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className={`${td} font-semibold text-slate-900`}>{p.title}</td>
                <td className={`${td} font-mono text-xs text-slate-500`}>/pages/{p.slug}</td>
                <td className={td}>
                  <Badge tone={p.is_active ? "green" : "slate"}>{p.is_active ? "Published" : "Draft"}</Badge>
                </td>
                <td className={`${td} text-xs`}>{formatDateTime(p.updated_at)}</td>
                <td className={`${td} text-right`}>
                  <span className="inline-flex gap-1">
                    {p.is_active && (
                      <a
                        href={`/pages/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View on storefront"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <IconButton label="Edit page" icon={Edit2} tone="primary" onClick={() => openEdit(p)} />
                    <IconButton label="Delete page" icon={Trash2} tone="danger" onClick={() => setDeleting(p)} />
                  </span>
                </td>
              </tr>
            ))
          )}
        </TBody>
      </TableShell>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.title}` : "New page"}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? "Save page" : "Create page"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <InlineError message={formError} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({ ...f, title, slug: editing || f.slug !== slugify(f.title) ? f.slug : slugify(title) }));
                }}
                maxLength={255}
                autoFocus
              />
            </Field>
            <Field label="URL slug" hint={`Storefront address: /pages/${form.slug || "…"}`}>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} maxLength={200} />
            </Field>
          </div>
          <Field label="Content">
            <HtmlEditor value={form.content} onChange={(v) => set("content", v)} rows={14} placeholder="<p>Write the page here…</p>" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SEO title">
              <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} maxLength={255} />
            </Field>
            <Field label="SEO description">
              <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} maxLength={500} rows={2} />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => set("is_active", v)} label="Published" description="Drafts are not visible on the storefront." />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete page?"
        message={<>The page <strong className="text-slate-900">{deleting?.title}</strong> and its link will stop working.</>}
        confirmLabel="Delete page"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
