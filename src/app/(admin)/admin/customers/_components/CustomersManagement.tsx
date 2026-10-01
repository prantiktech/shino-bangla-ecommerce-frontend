"use client";

import React, { useState } from "react";
import { BadgeCheck, Eye, Mail, MapPin, Phone, ShoppingBag, Trash2, Users } from "lucide-react";
import {
  AdminCustomer,
  deleteAdminCustomerAction,
  getAdminCustomerAction,
  getAdminCustomersAction,
  updateAdminCustomerAction,
} from "@/app/(admin)/actions/customers";
import { getAdminOrdersAction } from "@/app/(admin)/actions/orders";
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
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Spinner,
  TableShell,
  TBody,
  THead,
  Toggle,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDate, formatDateTime, formatTaka } from "@/app/(admin)/components/format";

interface OrderRow {
  id: number;
  number: string;
  status: string;
  payment_status: string;
  grand_total: number;
  placed_at: string;
}

export function CustomersManagement({ initial, initialError }: { initial: Paginated<AdminCustomer>; initialError: string | null }) {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [hasOrders, setHasOrders] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminCustomer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async (opts: { q?: string; active?: string; hasOrders?: string; page?: number } = {}) => {
    setLoading(true);
    const res = await getAdminCustomersAction({
      q: opts.q ?? q,
      is_active: opts.active ?? active,
      has_orders: opts.hasOrders ?? hasOrders,
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

  const open = async (c: AdminCustomer) => {
    setSelected(c);
    setName(c.name);
    setIsActive(c.is_active);
    setDetailError(null);
    setOrders(null);
    setDetailLoading(true);
    const [detail, ord] = await Promise.all([
      getAdminCustomerAction(c.id),
      getAdminOrdersAction({ customer_id: c.id, per_page: 5 }),
    ]);
    setDetailLoading(false);
    if (detail.success) setSelected(detail.data);
    else setDetailError(detail.error.message);
    if (ord.success) {
      const body = ord.data as { data?: OrderRow[] } | OrderRow[];
      setOrders(Array.isArray(body) ? body : body.data ?? []);
    } else setOrders([]);
  };

  const save = async () => {
    if (!selected) return;
    if (!name.trim()) return setDetailError("Name cannot be empty.");
    setSaving(true);
    setDetailError(null);
    const res = await updateAdminCustomerAction(selected.id, { name: name.trim(), is_active: isActive });
    setSaving(false);
    if (!res.success) return setDetailError(res.error.message);
    setSelected({ ...selected, ...res.data });
    setList((l) => ({ ...l, data: l.data.map((x) => (x.id === res.data.id ? { ...x, ...res.data } : x)) }));
    success(`${res.data.name} updated.`);
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminCustomerAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`${deleting.name} deleted.`);
      if (selected?.id === deleting.id) setSelected(null);
      load();
    }
    setDeleting(null);
  };

  const dirty = selected && (name.trim() !== selected.name || isActive !== selected.is_active);

  return (
    <div className="space-y-5">
      <PageHeader icon={Users} title="Customers" description="Registered shoppers, what they have spent, and their account status." />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            debounced(v);
          }}
          placeholder="Search name, email or phone"
          className="md:w-80"
        />
        <Select
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            setPage(1);
            load({ active: e.target.value, page: 1 });
          }}
          className="md:w-44"
          aria-label="Filter by status"
        >
          <option value="">All accounts</option>
          <option value="1">Active</option>
          <option value="0">Deactivated</option>
        </Select>
        <Select
          value={hasOrders}
          onChange={(e) => {
            setHasOrders(e.target.value);
            setPage(1);
            load({ hasOrders: e.target.value, page: 1 });
          }}
          className="md:w-44"
          aria-label="Filter by orders"
        >
          <option value="">Any orders</option>
          <option value="1">Has ordered</option>
          <option value="0">Never ordered</option>
        </Select>
      </div>

      <TableShell>
        <THead>
          <th className={th}>Customer</th>
          <th className={th}>Contact</th>
          <th className={`${th} text-right`}>Orders</th>
          <th className={`${th} text-right`}>Spent</th>
          <th className={th}>Last login</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={7} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState icon={Users} title="No customers found" />
              </td>
            </tr>
          ) : (
            list.data.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className={td}>
                  <button type="button" onClick={() => open(c)} className="flex items-center gap-3 text-left cursor-pointer">
                    <span className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 flex items-center justify-center text-sm font-bold shrink-0">
                      {c.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900 hover:text-primary">{c.name}</span>
                      <span className="block text-xs text-slate-500">Joined {formatDate(c.created_at)}</span>
                    </span>
                  </button>
                </td>
                <td className={`${td} text-xs`}>
                  {c.email && <span className="block truncate max-w-[220px]">{c.email}</span>}
                  {c.phone && <span className="block text-slate-500">{c.phone}</span>}
                </td>
                <td className={`${td} text-right tabular-nums`}>{c.orders_count ?? 0}</td>
                <td className={`${td} text-right tabular-nums font-semibold text-slate-900`}>{formatTaka(c.spent ?? 0)}</td>
                <td className={`${td} text-xs`}>{c.last_login_at ? formatDateTime(c.last_login_at) : "Never"}</td>
                <td className={td}>
                  <Badge tone={c.is_active ? "green" : "red"}>{c.is_active ? "Active" : "Deactivated"}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  <span className="inline-flex gap-1">
                    <IconButton label="View customer" icon={Eye} tone="primary" onClick={() => open(c)} />
                    <IconButton label="Delete customer" icon={Trash2} tone="danger" onClick={() => setDeleting(c)} />
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
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Customer"}
        description={selected ? `Customer since ${formatDate(selected.created_at)}` : undefined}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              icon={Trash2}
              className="sm:mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => selected && setDeleting(selected)}
            >
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button loading={saving} disabled={!dirty} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-6">
            <InlineError message={detailError} />
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Orders</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{selected.orders_count ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Spent</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{formatTaka(selected.spent ?? 0)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Account</p>
                <p className="text-sm font-semibold text-slate-900 capitalize mt-1">{selected.account_type ?? "retail"}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {selected.email && (
                <p className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {selected.email}
                  {selected.email_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" aria-label="Verified" />}
                </p>
              )}
              {selected.phone && (
                <p className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {selected.phone}
                  {selected.phone_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" aria-label="Verified" />}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end rounded-xl ring-1 ring-slate-200 p-4">
              <Field label="Display name">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
              </Field>
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                label="Account active"
                description="Deactivated customers cannot sign in or order."
              />
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Addresses
              </h3>
              {detailLoading ? (
                <Spinner />
              ) : !selected.addresses?.length ? (
                <p className="text-sm text-slate-500">No saved addresses.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.addresses.map((a) => (
                    <div key={a.id} className="rounded-xl ring-1 ring-slate-200 p-3 text-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-slate-900">{a.label || a.name}</span>
                        {a.is_default_shipping && <Badge tone="orange">Shipping</Badge>}
                        {a.is_default_billing && <Badge tone="blue">Billing</Badge>}
                      </div>
                      <p className="text-slate-600">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}
                      </p>
                      <p className="text-slate-600">
                        {[a.area, a.district?.name, a.postcode].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {a.name} · {a.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                Recent orders
              </h3>
              {orders === null ? (
                <Spinner />
              ) : orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span>
                        <span className="font-mono font-semibold text-slate-900">#{o.number}</span>
                        <span className="block text-xs text-slate-500">{formatDateTime(o.placed_at)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge tone="slate">{o.status}</Badge>
                        <span className="font-semibold tabular-nums">{formatTaka(o.grand_total)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete customer?"
        message={
          <>
            <strong className="text-slate-900">{deleting?.name}</strong> and their saved addresses will be removed. Their past orders stay on
            record. To block them temporarily, deactivate the account instead.
          </>
        }
        confirmLabel="Delete customer"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
