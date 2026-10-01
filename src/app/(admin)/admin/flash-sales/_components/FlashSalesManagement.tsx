"use client";

import React, { useState } from "react";
import { Edit2, Plus, Timer, Trash2, X, Zap } from "lucide-react";
import {
  FlashSale,
  createAdminFlashSaleAction,
  deleteAdminFlashSaleAction,
  getAdminFlashSaleAction,
  getAdminFlashSalesAction,
  updateAdminFlashSaleAction,
} from "@/app/(admin)/actions/discounts";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  InlineError,
  Input,
  LoadingRows,
  Modal,
  MoneyInput,
  NoticeBanner,
  PageHeader,
  Pagination,
  Spinner,
  TableShell,
  Tabs,
  TBody,
  THead,
  Toggle,
  td,
  th,
  useNotice,
} from "@/app/(admin)/components/ui";
import { VariantPicker } from "@/app/(admin)/components/pickers";
import {
  formatDateTime,
  formatTaka,
  fromDateTimeLocal,
  poishaToTaka,
  takaToPoisha,
  toDateTimeLocal,
} from "@/app/(admin)/components/format";

interface Line {
  variant_id: number;
  name: string;
  sku: string;
  usual_price?: number;
  sale_price: string;
}

function saleState(s: FlashSale): { label: string; tone: "green" | "blue" | "slate" | "amber" } {
  if (!s.is_active) return { label: "Inactive", tone: "slate" };
  if (s.is_running) return { label: "Running", tone: "green" };
  const now = Date.now();
  if (new Date(s.starts_at).getTime() > now) return { label: "Scheduled", tone: "blue" };
  return { label: "Ended", tone: "amber" };
}

export function FlashSalesManagement({ initial, initialError }: { initial: Paginated<FlashSale>; initialError: string | null }) {
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState<"all" | "running">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [formOpen, setFormOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editing, setEditing] = useState<FlashSale | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<FlashSale | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async (opts: { filter?: "all" | "running"; page?: number } = {}) => {
    setLoading(true);
    const f = opts.filter ?? filter;
    const res = await getAdminFlashSalesAction({ running: f === "running" ? 1 : undefined, page: opts.page ?? page });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 2 * 24 * 3600 * 1000);
    setStartsAt(toDateTimeLocal(start.toISOString()));
    setEndsAt(toDateTimeLocal(end.toISOString()));
    setIsActive(true);
    setLines([]);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = async (s: FlashSale) => {
    setEditing(s);
    setTitle(s.title);
    setStartsAt(toDateTimeLocal(s.starts_at));
    setEndsAt(toDateTimeLocal(s.ends_at));
    setIsActive(s.is_active);
    setLines([]);
    setFormError(null);
    setFormOpen(true);
    setLoadingDetail(true);
    const res = await getAdminFlashSaleAction(s.id);
    setLoadingDetail(false);
    if (!res.success) return setFormError(res.error.message);
    setLines(
      (res.data.items ?? []).map((i) => ({
        variant_id: i.variant_id,
        name: i.product || i.sku || `Variant #${i.variant_id}`,
        sku: i.sku || "",
        usual_price: i.usual_price,
        sale_price: poishaToTaka(i.sale_price),
      }))
    );
  };

  const save = async () => {
    if (!title.trim()) return setFormError("Give the sale a title.");
    const s = fromDateTimeLocal(startsAt);
    const e = fromDateTimeLocal(endsAt);
    if (!s || !e) return setFormError("Choose a start and end time.");
    if (new Date(e) <= new Date(s)) return setFormError("The sale must end after it starts.");
    if (lines.length === 0) return setFormError("Add at least one product to the sale.");
    const items = lines.map((l) => ({ variant_id: l.variant_id, sale_price: takaToPoisha(l.sale_price) }));
    if (items.some((i) => i.sale_price === null)) return setFormError("Every product needs a sale price.");
    const bad = lines.find((l) => l.usual_price && (takaToPoisha(l.sale_price) ?? 0) >= l.usual_price);
    if (bad) return setFormError(`The sale price for ${bad.name} should be lower than its usual price.`);

    setSaving(true);
    setFormError(null);
    const payload = {
      title: title.trim(),
      starts_at: s,
      ends_at: e,
      is_active: isActive,
      items: items as { variant_id: number; sale_price: number }[],
    };
    const res = editing ? await updateAdminFlashSaleAction(editing.id, payload) : await createAdminFlashSaleAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? `Flash sale "${res.data.title}" updated.` : `Flash sale "${res.data.title}" created.`);
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminFlashSaleAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`Flash sale "${deleting.title}" deleted.`);
      load();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Zap}
        title="Flash sales"
        description="Time-limited sale prices on selected product variants."
        actions={<Button icon={Plus} onClick={openCreate}>New flash sale</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <Tabs
        tabs={[
          { value: "all", label: "All sales" },
          { value: "running", label: "Running now" },
        ]}
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setPage(1);
          load({ filter: v, page: 1 });
        }}
      />

      <TableShell>
        <THead>
          <th className={th}>Sale</th>
          <th className={th}>Starts</th>
          <th className={th}>Ends</th>
          <th className={th}>Products</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={6} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={Timer}
                  title={filter === "running" ? "No sale is running right now" : "No flash sales yet"}
                  description="Create a sale to show discounted prices for a limited time."
                  action={<Button icon={Plus} onClick={openCreate}>New flash sale</Button>}
                />
              </td>
            </tr>
          ) : (
            list.data.map((s) => {
              const st = saleState(s);
              return (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className={`${td} font-semibold text-slate-900`}>{s.title}</td>
                  <td className={`${td} text-xs`}>{formatDateTime(s.starts_at)}</td>
                  <td className={`${td} text-xs`}>{formatDateTime(s.ends_at)}</td>
                  <td className={`${td} tabular-nums`}>{s.items_count ?? s.items?.length ?? 0}</td>
                  <td className={td}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </td>
                  <td className={`${td} text-right`}>
                    <span className="inline-flex gap-1">
                      <IconButton label="Edit sale" icon={Edit2} tone="primary" onClick={() => openEdit(s)} />
                      <IconButton label="Delete sale" icon={Trash2} tone="danger" onClick={() => setDeleting(s)} />
                    </span>
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.title}` : "New flash sale"}
        description="Sale prices apply automatically between the start and end time."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save} disabled={loadingDetail}>
              {editing ? "Save changes" : "Create sale"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <InlineError message={formError} />
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend sale" maxLength={255} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Starts" required>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </Field>
            <Field label="Ends" required>
              <Input type="datetime-local" value={endsAt} min={startsAt || undefined} onChange={(e) => setEndsAt(e.target.value)} />
            </Field>
          </div>
          <Toggle checked={isActive} onChange={setIsActive} label="Active" description="Inactive sales never apply, even inside their dates." />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Products on sale</h3>
              <span className="text-xs text-slate-500">{lines.length} selected</span>
            </div>
            <VariantPicker
              excludeIds={lines.map((l) => l.variant_id)}
              onPick={(v) =>
                setLines((ls) => [
                  ...ls,
                  {
                    variant_id: v.variant_id,
                    name: v.label ? `${v.product.name} · ${v.label}` : v.product.name,
                    sku: v.sku,
                    sale_price: "",
                  },
                ])
              }
            />
            {loadingDetail ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : lines.length === 0 ? (
              <p className="text-sm text-slate-500 rounded-xl bg-slate-50 px-4 py-5 text-center">
                Search above to add products to this sale.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                {lines.map((l, i) => (
                  <li key={l.variant_id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{l.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono">{l.sku}</span>
                        {l.usual_price ? <> · usually {formatTaka(l.usual_price)}</> : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-36">
                        <MoneyInput
                          value={l.sale_price}
                          aria-label={`Sale price for ${l.name}`}
                          onChange={(v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, sale_price: v } : x)))}
                        />
                      </div>
                      <IconButton label="Remove" icon={X} tone="danger" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete flash sale?"
        message={<>Sale prices from <strong className="text-slate-900">{deleting?.title}</strong> will stop applying.</>}
        confirmLabel="Delete sale"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
