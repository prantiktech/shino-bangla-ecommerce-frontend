"use client";

import React, { useState } from "react";
import { Award, Edit2, Plus, Trash2 } from "lucide-react";
import {
  AdminBrand,
  AdminBrandPayload,
  createAdminBrandAction,
  deleteAdminBrandAction,
  getAdminBrandAction,
  getAdminBrandsAction,
  updateAdminBrandAction,
} from "@/app/(admin)/actions/brands";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  ImageUpload,
  InlineError,
  Input,
  LoadingRows,
  MediaValue,
  Modal,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  TableShell,
  TBody,
  Textarea,
  THead,
  Toggle,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { slugify } from "@/app/(admin)/components/format";

interface FormState {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  logo: MediaValue | null;
  banner: MediaValue | null;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  is_active: true,
  sort_order: "0",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  logo: null,
  banner: null,
};

function toForm(b: AdminBrand): FormState {
  return {
    name: b.name,
    slug: b.slug,
    description: b.description || "",
    is_active: b.is_active,
    sort_order: String(b.sort_order ?? 0),
    seo_title: b.seo_title || "",
    seo_description: b.seo_description || "",
    seo_keywords: b.seo_keywords || "",
    logo: b.logo ? { id: b.logo.id, url: b.logo.url } : null,
    banner: b.banner ? { id: b.banner.id, url: b.banner.url } : null,
  };
}

function toPayload(f: FormState): AdminBrandPayload {
  return {
    name: f.name.trim(),
    slug: f.slug.trim() || null,
    description: f.description.trim() || null,
    is_active: f.is_active,
    sort_order: Number(f.sort_order) || 0,
    seo_title: f.seo_title.trim() || null,
    seo_description: f.seo_description.trim() || null,
    seo_keywords: f.seo_keywords.trim() || null,
    logo_image_id: f.logo?.id ?? null,
    banner_image_id: f.banner?.id ?? null,
  };
}

export function BrandsManagement({
  initial,
  initialError,
}: {
  initial: Paginated<AdminBrand>;
  initialError: string | null;
}) {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminBrand | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async (nextQ = q, nextPage = page) => {
    setLoading(true);
    const res = await getAdminBrandsAction({ q: nextQ, page: nextPage });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };

  const debouncedSearch = useDebouncedCallback((term: string) => {
    setPage(1);
    load(term, 1);
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (b: AdminBrand) => {
    setEditing(b);
    setForm(toForm(b));
    setFormError(null);
    setFormOpen(true);
    // Refresh from the server so edits start from the latest saved version.
    getAdminBrandAction(b.id).then((r) => r.success && setForm(toForm(r.data)));
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      setFormError("Brand name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = toPayload(form);
    const res = editing ? await updateAdminBrandAction(editing.id, payload) : await createAdminBrandAction(payload);
    setSaving(false);
    if (!res.success) {
      setFormError(res.error.message);
      return;
    }
    setFormOpen(false);
    success(editing ? `Brand "${res.data.name}" updated.` : `Brand "${res.data.name}" created.`);
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminBrandAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) {
      error(res.error.message);
    } else {
      success(`Brand "${deleting.name}" deleted.`);
      load();
    }
    setDeleting(null);
  };

  const brands = list.data;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Award}
        title="Brands"
        description="Manufacturers and labels shown on product pages and brand listings."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add brand
          </Button>
        }
      />

      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            debouncedSearch(v);
          }}
          placeholder="Search brands"
          className="w-full sm:w-80"
        />
      </div>

      <TableShell>
        <THead>
          <th className={th}>Brand</th>
          <th className={th}>Slug</th>
          <th className={th}>Products</th>
          <th className={th}>Order</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={6} />
          ) : brands.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={Award}
                  title={q ? "No brands match your search" : "No brands yet"}
                  description={q ? "Try a different name." : "Add your first brand so products can be grouped by manufacturer."}
                  action={!q && <Button icon={Plus} onClick={openCreate}>Add brand</Button>}
                />
              </td>
            </tr>
          ) : (
            brands.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/60">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-slate-100 ring-1 ring-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {b.logo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo.url} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-slate-400">{b.name[0]}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900 truncate">{b.name}</span>
                      {b.description && <span className="block text-xs text-slate-500 truncate max-w-xs">{b.description}</span>}
                    </span>
                  </div>
                </td>
                <td className={`${td} font-mono text-xs text-slate-500`}>{b.slug}</td>
                <td className={`${td} tabular-nums`}>{b.products_count ?? 0}</td>
                <td className={`${td} tabular-nums`}>{b.sort_order ?? 0}</td>
                <td className={td}>
                  <Badge tone={b.is_active ? "green" : "slate"}>{b.is_active ? "Active" : "Hidden"}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  <div className="inline-flex gap-1">
                    <IconButton label="Edit brand" icon={Edit2} tone="primary" onClick={() => openEdit(b)} />
                    <IconButton
                      label={b.products_count ? "Brands with products cannot be deleted" : "Delete brand"}
                      icon={Trash2}
                      tone="danger"
                      disabled={!!b.products_count}
                      onClick={() => setDeleting(b)}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </TBody>
      </TableShell>

      <Pagination
        meta={list.meta}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          load(q, p);
        }}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add brand"}
        description="Logo and banner images appear on the brand page."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => save()}>
              {editing ? "Save changes" : "Create brand"}
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-5">
          <InlineError message={formError} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: editing || f.slug !== slugify(f.name) ? f.slug : slugify(name) }));
                }}
                placeholder="e.g. Firex"
                autoFocus
              />
            </Field>
            <Field label="Slug" hint="Used in the brand URL. Leave blank to generate.">
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="firex" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Logo">
              <ImageUpload value={form.logo} onChange={(v) => set("logo", v)} label="Upload logo" />
            </Field>
            <Field label="Banner" className="sm:col-span-2">
              <ImageUpload value={form.banner} onChange={(v) => set("banner", v)} label="Upload banner" aspect="aspect-[16/7]" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Field label="Sort order" hint="Lower numbers appear first.">
              <Input type="number" min={0} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
            </Field>
            <Toggle checked={form.is_active} onChange={(v) => set("is_active", v)} label="Active" description="Visible on the storefront" />
          </div>
          <details className="rounded-xl ring-1 ring-slate-200 p-4 group">
            <summary className="text-sm font-semibold text-slate-800 cursor-pointer">Search engine (SEO)</summary>
            <div className="mt-4 space-y-4">
              <Field label="SEO title">
                <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} maxLength={255} />
              </Field>
              <Field label="SEO description">
                <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={2} maxLength={500} />
              </Field>
              <Field label="SEO keywords" hint="Comma separated.">
                <Input value={form.seo_keywords} onChange={(e) => set("seo_keywords", e.target.value)} maxLength={500} />
              </Field>
            </div>
          </details>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete brand?"
        message={
          <>
            <strong className="text-slate-900">{deleting?.name}</strong> will be removed permanently. Brands that products
            still use cannot be deleted.
          </>
        }
        confirmLabel="Delete brand"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
