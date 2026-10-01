"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Edit2, Eye, EyeOff, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import {
  HomeSection,
  HomeSectionPayload,
  HomeSectionType,
  createAdminHomeSectionAction,
  deleteAdminHomeSectionAction,
  getAdminHomeSectionAction,
  getAdminHomeSectionsAction,
  reorderAdminHomeSectionsAction,
  updateAdminHomeSectionAction,
} from "@/app/(admin)/actions/home-sections";
import { getAdminProductAction } from "@/app/(admin)/actions/products";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  InlineError,
  Input,
  Modal,
  NoticeBanner,
  PageHeader,
  Select,
  Spinner,
  Toggle,
  useNotice,
} from "@/app/(admin)/components/ui";
import { ProductPicker, ProductRef } from "@/app/(admin)/components/pickers";
import { formatDate, fromDateTimeLocal, toDateTimeLocal } from "@/app/(admin)/components/format";

type Option = { id: number; name: string; depth?: number };

const TYPE_LABELS: Record<string, string> = {
  slider: "Hero slider",
  categories: "Category tiles",
  brands: "Brand logos",
  featured: "Featured products",
  trending: "Trending products",
  new_arrivals: "New arrivals",
  popular: "Popular products",
  best_sellers: "Best sellers",
  flash_sale: "Flash sale",
  offer_banners: "Offer banners",
  featured_reviews: "Customer reviews",
  newsletter: "Newsletter sign-up",
  custom: "Hand-picked products",
  category: "Products from a category",
};

const MODES = [
  { value: "latest", label: "Newest first" },
  { value: "best_selling", label: "Best selling" },
  { value: "popular", label: "Most viewed" },
  { value: "rating", label: "Highest rated" },
  { value: "discounted", label: "Discounted" },
];

/** Which kind of item a `picks_items` section holds. */
function itemKind(type: string): "category" | "brand" | "product" | null {
  if (type === "categories") return "category";
  if (type === "brands") return "brand";
  if (type === "custom") return "product";
  return null;
}

interface FormState {
  type: string;
  title: string;
  subtitle: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  limit: string;
  category_id: string;
  mode: string;
  item_ids: number[];
  products: ProductRef[];
}

export function HomeSectionsManagement({
  initial,
  types,
  categories,
  brands,
  initialError,
}: {
  initial: HomeSection[];
  types: HomeSectionType[];
  categories: Option[];
  brands: Option[];
  initialError: string | null;
}) {
  const [sections, setSections] = useState(() => [...initial].sort((a, b) => a.position - b.position));
  const [reordering, setReordering] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [deleting, setDeleting] = useState<HomeSection | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const typeInfo = (t: string) => types.find((x) => x.type === t);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const brandName = new Map(brands.map((b) => [b.id, b.name]));

  const reload = async () => {
    const res = await getAdminHomeSectionsAction();
    if (res.success) setSections([...(res.data ?? [])].sort((a, b) => a.position - b.position));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    setReordering(true);
    const res = await reorderAdminHomeSectionsAction(next.map((s) => s.id));
    setReordering(false);
    if (!res.success) {
      error(res.error.message);
      reload();
    } else if (res.data) {
      setSections([...res.data].sort((a, b) => a.position - b.position));
    }
  };

  const toggleActive = async (s: HomeSection) => {
    const res = await updateAdminHomeSectionAction(s.id, { is_active: !s.is_active });
    if (!res.success) return error(res.error.message);
    setSections((ls) => ls.map((x) => (x.id === s.id ? res.data : x)));
    success(`"${res.data.heading || TYPE_LABELS[res.data.type]}" ${res.data.is_active ? "shown" : "hidden"} on the home page.`);
  };

  const openCreate = () => {
    const first = types[0]?.type ?? "featured";
    setEditing(null);
    setForm({
      type: first,
      title: typeInfo(first)?.default_title ?? "",
      subtitle: "",
      is_active: true,
      starts_at: "",
      ends_at: "",
      limit: "8",
      category_id: "",
      mode: "latest",
      item_ids: [],
      products: [],
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = async (listed: HomeSection) => {
    const fresh = await getAdminHomeSectionAction(listed.id);
    const s = fresh.success ? fresh.data : listed;
    setEditing(s);
    setForm({
      type: s.type,
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      is_active: s.is_active,
      starts_at: toDateTimeLocal(s.starts_at),
      ends_at: toDateTimeLocal(s.ends_at),
      limit: String(s.settings?.limit ?? 8),
      category_id: s.settings?.category_id ? String(s.settings.category_id) : "",
      mode: s.settings?.mode ?? "latest",
      item_ids: s.item_ids ?? [],
      products: [],
    });
    setFormError(null);
    setFormOpen(true);
    if (itemKind(s.type) === "product" && s.item_ids?.length) {
      setLoadingItems(true);
      const found = await Promise.all(s.item_ids.slice(0, 48).map((id) => getAdminProductAction(id)));
      setLoadingItems(false);
      setForm((f) =>
        f
          ? {
              ...f,
              products: s.item_ids.map((id, i) => {
                const r = found[i];
                return { id, name: r && r.success ? r.data.name : `Product #${id}` };
              }),
            }
          : f
      );
    }
  };

  const save = async () => {
    if (!form) return;
    const info = typeInfo(form.type);
    const kind = itemKind(form.type);
    if (info?.needs_category && !form.category_id) return setFormError("Choose the category to show products from.");
    const s = fromDateTimeLocal(form.starts_at);
    const e = fromDateTimeLocal(form.ends_at);
    if (s && e && new Date(e) <= new Date(s)) return setFormError("The end time must be after the start time.");

    const settings: HomeSectionPayload["settings"] = {};
    if (info?.shows_products || info?.picks_items) settings.limit = Math.min(48, Math.max(1, Number(form.limit) || 8));
    if (info?.needs_category) {
      settings.category_id = Number(form.category_id);
      settings.mode = form.mode as NonNullable<HomeSectionPayload["settings"]>["mode"];
    }

    const payload: HomeSectionPayload = {
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      is_active: form.is_active,
      starts_at: s,
      ends_at: e,
      settings: Object.keys(settings).length ? settings : null,
    };
    if (kind) payload.item_ids = kind === "product" ? form.products.map((p) => p.id) : form.item_ids;
    if (!editing) {
      payload.type = form.type;
      payload.position = sections.length;
    }

    setSaving(true);
    setFormError(null);
    const res = editing ? await updateAdminHomeSectionAction(editing.id, payload) : await createAdminHomeSectionAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? "Section updated." : "Section added to the home page.");
    reload();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminHomeSectionAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success("Section removed.");
      reload();
    }
    setDeleting(null);
  };

  const info = form ? typeInfo(form.type) : undefined;
  const kind = form ? itemKind(form.type) : null;
  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const toggleItem = (id: number) =>
    setF("item_ids", form!.item_ids.includes(id) ? form!.item_ids.filter((x) => x !== id) : [...form!.item_ids, id]);

  const describeItems = (s: HomeSection) => {
    const k = itemKind(s.type);
    if (!k || !s.item_ids?.length) return null;
    const names =
      k === "category"
        ? s.item_ids.map((id) => catName.get(id) ?? `#${id}`)
        : k === "brand"
        ? s.item_ids.map((id) => brandName.get(id) ?? `#${id}`)
        : null;
    return names ? names.join(", ") : `${s.item_ids.length} hand-picked product${s.item_ids.length === 1 ? "" : "s"}`;
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        icon={LayoutTemplate}
        title="Home page"
        description="The sections of the storefront home page, top to bottom. Use the arrows to reorder."
        actions={<Button icon={Plus} onClick={openCreate}>Add section</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      {sections.length === 0 ? (
        <Card>
          <EmptyState icon={LayoutTemplate} title="The home page is empty" description="Add sections to build the storefront home page." />
        </Card>
      ) : (
        <ol className="space-y-2">
          {sections.map((s, i) => {
            const items = describeItems(s);
            const scheduled = s.starts_at || s.ends_at;
            return (
              <li key={s.id}>
                <Card className="flex items-center gap-4 !py-4">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.heading || s.title || TYPE_LABELS[s.type] || s.type}</p>
                      <Badge tone="slate">{TYPE_LABELS[s.type] ?? s.type}</Badge>
                      {!s.is_active && <Badge tone="amber">Hidden</Badge>}
                      {scheduled && (
                        <Badge tone="blue">
                          {s.starts_at ? formatDate(s.starts_at) : "Now"} – {s.ends_at ? formatDate(s.ends_at) : "no end"}
                        </Badge>
                      )}
                    </div>
                    {(s.subtitle || items) && <p className="text-xs text-slate-500 mt-1 truncate">{items ?? s.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <IconButton label="Move up" icon={ArrowUp} disabled={i === 0 || reordering} onClick={() => move(i, -1)} />
                    <IconButton label="Move down" icon={ArrowDown} disabled={i === sections.length - 1 || reordering} onClick={() => move(i, 1)} />
                    <IconButton label={s.is_active ? "Hide section" : "Show section"} icon={s.is_active ? Eye : EyeOff} onClick={() => toggleActive(s)} />
                    <IconButton label="Edit section" icon={Edit2} tone="primary" onClick={() => openEdit(s)} />
                    <IconButton label="Remove section" icon={Trash2} tone="danger" onClick={() => setDeleting(s)} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      <Modal
        open={formOpen && !!form}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit section" : "Add section"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? "Save section" : "Add section"}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-5">
            <InlineError message={formError} />
            <Field label="Section type" hint={editing ? "The type cannot be changed after the section is created." : undefined}>
              <Select
                value={form.type}
                disabled={!!editing}
                onChange={(e) => {
                  const t = e.target.value;
                  setForm((f) => (f ? { ...f, type: t, title: typeInfo(t)?.default_title ?? "", item_ids: [], products: [] } : f));
                }}
              >
                {types.map((t) => (
                  <option key={t.type} value={t.type}>
                    {TYPE_LABELS[t.type] ?? t.type}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Heading" hint={info?.default_title ? `Defaults to "${info.default_title}".` : undefined}>
                <Input value={form.title} onChange={(e) => setF("title", e.target.value)} maxLength={255} />
              </Field>
              <Field label="Subtitle">
                <Input value={form.subtitle} onChange={(e) => setF("subtitle", e.target.value)} maxLength={500} />
              </Field>
            </div>

            {info?.needs_category && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required>
                  <Select value={form.category_id} onChange={(e) => setF("category_id", e.target.value)}>
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {"— ".repeat(c.depth ?? 0)}
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Order products by">
                  <Select value={form.mode} onChange={(e) => setF("mode", e.target.value)}>
                    {MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            {(info?.shows_products || info?.picks_items) && (
              <Field label="Items to show" hint="Between 1 and 48." className="sm:w-48">
                <Input type="number" min={1} max={48} value={form.limit} onChange={(e) => setF("limit", e.target.value)} />
              </Field>
            )}

            {kind === "product" && (
              <Field label="Products" hint="Shown in the order picked.">
                {loadingItems ? <Spinner /> : <ProductPicker value={form.products} onChange={(v) => setF("products", v)} max={48} />}
              </Field>
            )}
            {(kind === "category" || kind === "brand") && (
              <Field
                label={kind === "category" ? "Categories" : "Brands"}
                hint={`Leave empty to show the top ${kind === "category" ? "categories" : "brands"} automatically.`}
              >
                <div className="rounded-xl ring-1 ring-slate-200 max-h-60 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(kind === "category" ? categories : brands).length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing to choose yet.</p>
                  ) : (
                    (kind === "category" ? categories : brands).map((o) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[var(--color-primary)] w-4 h-4"
                          checked={form.item_ids.includes(o.id)}
                          onChange={() => toggleItem(o.id)}
                        />
                        <span className="truncate">
                          {"— ".repeat(o.depth ?? 0)}
                          {o.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Show from" hint="Optional schedule.">
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setF("starts_at", e.target.value)} />
              </Field>
              <Field label="Show until">
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setF("ends_at", e.target.value)} />
              </Field>
            </div>
            <Toggle checked={form.is_active} onChange={(v) => setF("is_active", v)} label="Visible on the home page" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove section?"
        message={<>Remove <strong className="text-slate-900">{deleting?.heading || TYPE_LABELS[deleting?.type ?? ""]}</strong> from the home page?</>}
        confirmLabel="Remove"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
