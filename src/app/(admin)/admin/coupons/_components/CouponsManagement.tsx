"use client";

import React, { useState } from "react";
import { Copy, Edit2, Plus, Ticket, Trash2 } from "lucide-react";
import {
  Coupon,
  CouponPayload,
  createAdminCouponAction,
  deleteAdminCouponAction,
  getAdminCouponAction,
  getAdminCouponsAction,
  updateAdminCouponAction,
} from "@/app/(admin)/actions/discounts";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  BadgeTone,
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
  SearchInput,
  Select,
  TableShell,
  TBody,
  THead,
  Toggle,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import {
  bpToPercent,
  formatDate,
  formatTaka,
  percentToBp,
  poishaToTaka,
  takaToPoisha,
  toDateInput,
} from "@/app/(admin)/components/format";

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "green",
  scheduled: "blue",
  expired: "slate",
  used_up: "amber",
  inactive: "slate",
};

interface FormState {
  code: string;
  type: "percent" | "fixed";
  value: string;
  min_purchase: string;
  max_discount: string;
  starts_at: string;
  expires_at: string;
  usage_limit: string;
  per_user_limit: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: "",
  type: "percent",
  value: "",
  min_purchase: "",
  max_discount: "",
  starts_at: "",
  expires_at: "",
  usage_limit: "",
  per_user_limit: "",
  is_active: true,
};

const intOrNull = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v))));

export function CouponsManagement({ initial, initialError }: { initial: Paginated<Coupon>; initialError: string | null }) {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async (opts: { q?: string; status?: string; page?: number } = {}) => {
    setLoading(true);
    const res = await getAdminCouponsAction({
      q: opts.q ?? q,
      status: opts.status ?? status,
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

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const couponToForm = (c: Coupon): FormState => ({
    code: c.code,
    type: c.type,
    value: c.type === "percent" ? bpToPercent(c.value) : poishaToTaka(c.value),
    min_purchase: poishaToTaka(c.min_purchase),
    max_discount: poishaToTaka(c.max_discount),
    starts_at: toDateInput(c.starts_at),
    expires_at: toDateInput(c.expires_at),
    usage_limit: c.usage_limit?.toString() ?? "",
    per_user_limit: c.per_user_limit?.toString() ?? "",
    is_active: c.is_active,
  });

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm(couponToForm(c));
    setFormError(null);
    setFormOpen(true);
    getAdminCouponAction(c.id).then((r) => {
      if (r.success) {
        setEditing(r.data);
        setForm(couponToForm(r.data));
      }
    });
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(code)) {
      setFormError("Code must be 3 to 32 characters: letters, numbers, dot, dash or underscore.");
      return;
    }
    const value = form.type === "percent" ? percentToBp(form.value) : takaToPoisha(form.value);
    if (!value || value < 1) {
      setFormError("Enter a discount value greater than zero.");
      return;
    }
    if (form.type === "percent" && value > 10000) {
      setFormError("A percentage discount cannot exceed 100%.");
      return;
    }
    if (form.starts_at && form.expires_at && form.expires_at <= form.starts_at) {
      setFormError("The expiry date must be after the start date.");
      return;
    }
    const payload: CouponPayload = {
      code,
      type: form.type,
      value,
      min_purchase: takaToPoisha(form.min_purchase),
      max_discount: form.type === "percent" ? takaToPoisha(form.max_discount) : null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      usage_limit: intOrNull(form.usage_limit),
      per_user_limit: intOrNull(form.per_user_limit),
      is_active: form.is_active,
    };
    if (editing && payload.code === editing.code) delete payload.code;
    setSaving(true);
    setFormError(null);
    const res = editing ? await updateAdminCouponAction(editing.id, payload) : await createAdminCouponAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? `Coupon ${res.data.code} updated.` : `Coupon ${res.data.code} created.`);
    load();
  };

  const toggleActive = async (c: Coupon) => {
    const res = await updateAdminCouponAction(c.id, { is_active: !c.is_active });
    if (!res.success) return error(res.error.message);
    success(`Coupon ${c.code} ${c.is_active ? "deactivated" : "activated"}.`);
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminCouponAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`Coupon ${deleting.code} deleted.`);
      load();
    }
    setDeleting(null);
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      success(`Copied ${code}.`);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Ticket}
        title="Coupons"
        description="Discount codes customers enter at checkout."
        actions={<Button icon={Plus} onClick={openCreate}>New coupon</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            debounced(v);
          }}
          placeholder="Search codes"
          className="w-full sm:w-72"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
            load({ status: e.target.value, page: 1 });
          }}
          className="sm:w-48"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="used_up">Used up</option>
        </Select>
      </div>

      <TableShell>
        <THead>
          <th className={th}>Code</th>
          <th className={th}>Discount</th>
          <th className={th}>Min. order</th>
          <th className={th}>Validity</th>
          <th className={th}>Usage</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={7} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={Ticket}
                  title="No coupons found"
                  description={q || status ? "Try a different filter." : "Create a coupon to offer customers a discount."}
                  action={!q && !status && <Button icon={Plus} onClick={openCreate}>New coupon</Button>}
                />
              </td>
            </tr>
          ) : (
            list.data.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className={td}>
                  <button
                    type="button"
                    onClick={() => copy(c.code)}
                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-900 hover:text-primary cursor-pointer"
                    title="Copy code"
                  >
                    {c.code}
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </td>
                <td className={td}>
                  <span className="font-semibold text-slate-900">
                    {c.summary || (c.type === "percent" ? `${bpToPercent(c.value)}% off` : `${formatTaka(c.value)} off`)}
                  </span>
                  {c.max_discount ? <span className="block text-xs text-slate-500">up to {formatTaka(c.max_discount)}</span> : null}
                </td>
                <td className={`${td} tabular-nums`}>{c.min_purchase ? formatTaka(c.min_purchase) : "—"}</td>
                <td className={`${td} text-xs text-slate-600`}>
                  {c.starts_at || c.expires_at ? (
                    <>
                      {c.starts_at ? formatDate(c.starts_at) : "Now"} – {c.expires_at ? formatDate(c.expires_at) : "No end"}
                    </>
                  ) : (
                    "Always"
                  )}
                </td>
                <td className={`${td} tabular-nums text-xs`}>
                  <span className="font-semibold text-slate-900">{c.used_count}</span>
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  {c.per_user_limit ? <span className="block text-slate-500">{c.per_user_limit} per customer</span> : null}
                </td>
                <td className={td}>
                  <Badge tone={STATUS_TONE[c.status] ?? "slate"}>{c.status.replace("_", " ")}</Badge>
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <span className="inline-flex items-center gap-2">
                    <Toggle checked={c.is_active} onChange={() => toggleActive(c)} />
                    <IconButton label="Edit coupon" icon={Edit2} tone="primary" onClick={() => openEdit(c)} />
                    <IconButton label="Delete coupon" icon={Trash2} tone="danger" onClick={() => setDeleting(c)} />
                  </span>
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
          load({ page: p });
        }}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.code}` : "New coupon"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? "Save changes" : "Create coupon"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-5"
        >
          <InlineError message={formError} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Code" required hint="Customers type this at checkout.">
              <Input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="EID25"
                className="font-mono uppercase"
                maxLength={32}
                autoFocus
              />
            </Field>
            <Field label="Discount type" required>
              <Select value={form.type} onChange={(e) => set("type", e.target.value as FormState["type"])}>
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </Select>
            </Field>
            <Field label={form.type === "percent" ? "Percentage" : "Amount"} required>
              {form.type === "percent" ? (
                <div className="relative">
                  <Input type="number" min={0.01} max={100} step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} className="pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                </div>
              ) : (
                <MoneyInput value={form.value} onChange={(v) => set("value", v)} />
              )}
            </Field>
            {form.type === "percent" && (
              <Field label="Maximum discount" hint="Optional cap on the discount.">
                <MoneyInput value={form.max_discount} onChange={(v) => set("max_discount", v)} placeholder="No cap" />
              </Field>
            )}
            <Field label="Minimum order value" hint="Optional.">
              <MoneyInput value={form.min_purchase} onChange={(v) => set("min_purchase", v)} placeholder="No minimum" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Starts on">
              <Input type="date" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
            </Field>
            <Field label="Expires on">
              <Input type="date" value={form.expires_at} min={form.starts_at || undefined} onChange={(e) => set("expires_at", e.target.value)} />
            </Field>
            <Field label="Total uses allowed" hint="Leave blank for unlimited.">
              <Input type="number" min={1} value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} />
            </Field>
            <Field label="Uses per customer" hint="Leave blank for unlimited.">
              <Input type="number" min={1} value={form.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)} />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => set("is_active", v)} label="Active" description="Inactive coupons are refused at checkout." />
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete coupon?"
        message={<>Coupon <strong className="font-mono text-slate-900">{deleting?.code}</strong> will stop working immediately.</>}
        confirmLabel="Delete coupon"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
