"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  getAdminIncompleteOrdersAction,
  updateAdminIncompleteOrderAction,
} from "@/app/(admin)/actions/incomplete-orders";
import type { Paginated } from "@/app/(admin)/actions/_request";
import type { IncompleteOrder, IncompleteOrderStatus } from "@/types/admin-orders";
import {
  AutoPollToggle,
  Badge,
  Button,
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
  syncUrlParams,
  TableShell,
  Tabs,
  TBody,
  Textarea,
  THead,
  td,
  th,
  useAutoPoll,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime, formatTaka } from "@/app/(admin)/components/format";
import { INCOMPLETE_ORDER_STATUS_META, metaFor, timeAgo } from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";

interface Filters {
  status: IncompleteOrderStatus | "";
  source: "" | "cart" | "buy_now";
  has_phone: "" | "1" | "0";
  q: string;
}

const INITIAL_FILTERS: Filters = {
  status: "incomplete",
  source: "",
  has_phone: "",
  q: "",
};

export function IncompleteOrdersManagement({
  initial,
  initialError,
}: {
  initial: Paginated<IncompleteOrder>;
  initialError: string | null;
}) {
  const can = useCan();
  const [list, setList] = useState(initial);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IncompleteOrder | null>(null);
  const { notice, success, error, clear } = useNotice();

  const load = async (
    next: Filters,
    nextPage: number,
    nextPerPage = perPage,
    silent = false
  ) => {
    if (!silent) setLoading(true);
    const res = await getAdminIncompleteOrdersAction({
      status: next.status || undefined,
      source: next.source || undefined,
      has_phone: next.has_phone || undefined,
      q: next.q || undefined,
      page: nextPage,
      per_page: nextPerPage,
    });
    if (!silent) setLoading(false);
    if (res.success) setList(res.data);
    else if (!silent) error(res.error.message);
  };

  const autoPoll = useAutoPoll(
    async () => {
      await load(filters, page, perPage, true);
    },
    { intervalMs: 60000, paused: selected !== null }
  );

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setPage(1);
    syncUrlParams({
      status: next.status || null,
      source: next.source || null,
      has_phone: next.has_phone || null,
      q: next.q || null,
      page: null,
    });
    void load(next, 1, perPage);
  };

  const debouncedSearch = useDebouncedCallback((q: string, current: Filters) => {
    const next = { ...current, q };
    setPage(1);
    syncUrlParams({ q: q || null, page: null });
    void load(next, 1, perPage);
  });

  const handleUpdated = (updated: IncompleteOrder) => {
    setSelected(updated);
    setList((prev) => ({
      ...prev,
      data: prev.data.map((row) => (row.id === updated.id ? updated : row)),
    }));
    success("Incomplete order updated.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShoppingCart}
        title="Incomplete Orders"
        description="Abandoned carts and Buy Now checkouts captured as shoppers enter their details."
        actions={<AutoPollToggle controller={autoPoll} loading={loading} label="Live 1m" />}
      />

      <NoticeBanner
        notice={notice ?? (initialError ? { type: "error", message: initialError } : null)}
        onClose={clear}
      />

      <Tabs
        tabs={[
          { value: "incomplete", label: "Incomplete" },
          { value: "recovered", label: "Recovered" },
          { value: "dismissed", label: "Dismissed" },
          { value: "all", label: "All" },
        ]}
        value={filters.status || "all"}
        onChange={(v) =>
          update({ status: v === "all" ? "" : (v as IncompleteOrderStatus) })
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchInput
          value={filters.q}
          onChange={(v) => {
            setFilters((f) => ({ ...f, q: v }));
            debouncedSearch(v, filters);
          }}
          placeholder="Customer name, phone or email"
        />
        <Select
          value={filters.source}
          onChange={(e) =>
            update({ source: e.target.value as Filters["source"] })
          }
          aria-label="Source"
        >
          <option value="">All sources (Cart & Buy Now)</option>
          <option value="cart">Cart checkout</option>
          <option value="buy_now">Buy now</option>
        </Select>
        <Select
          value={filters.has_phone}
          onChange={(e) =>
            update({ has_phone: e.target.value as Filters["has_phone"] })
          }
          aria-label="Phone filter"
        >
          <option value="">With or without phone</option>
          <option value="1">Has phone number (callable)</option>
          <option value="0">Missing phone number</option>
        </Select>
        {(filters.q || filters.source || filters.has_phone) && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() =>
                update({ q: "", source: "", has_phone: "" })
              }
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <TableShell>
        <THead>
          <th className={`${th} w-12`}>#</th>
          <th className={th}>Contact</th>
          <th className={th}>Source</th>
          <th className={th}>Items</th>
          <th className={th}>Subtotal</th>
          <th className={th}>Status</th>
          <th className={th}>Staff Note</th>
          <th className={th}>Last Activity</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={9} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <EmptyState
                  icon={ShoppingCart}
                  title="No incomplete orders found"
                  description="Abandoned carts and Buy Now drafts appear here automatically when shoppers start checking out."
                />
              </td>
            </tr>
          ) : (
            list.data.map((row, idx) => {
              const rowNum =
                ((list.meta?.current_page || page) - 1) *
                  (list.meta?.per_page || 20) +
                idx +
                1;
              const st = metaFor(INCOMPLETE_ORDER_STATUS_META, row.status);
              const firstItem = row.items?.[0];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/60 cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <td className={`${td} text-xs font-mono text-slate-400 tabular-nums`}>
                    {rowNum}
                  </td>
                  <td className={td}>
                    <div className="font-medium text-slate-900">
                      {row.contact?.name || (
                        <span className="text-slate-400 italic">Anonymous shopper</span>
                      )}
                    </div>
                    {row.contact?.phone ? (
                      <div className="text-xs font-mono text-slate-600">
                        {row.contact.phone}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">No phone yet</div>
                    )}
                    {row.contact?.address && (
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {row.contact.address}
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    <Badge tone={row.source === "buy_now" ? "orange" : "blue"}>
                      {row.source === "buy_now" ? "Buy now" : "Cart"}
                    </Badge>
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2.5 max-w-[260px]">
                      {firstItem?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstItem.image_url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">
                          {firstItem ? firstItem.name : `${row.item_count} items`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {row.item_count} item{row.item_count === 1 ? "" : "s"}
                          {row.items?.length > 1
                            ? ` (+${row.items.length - 1} more)`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} tabular-nums font-semibold text-slate-900`}>
                    {formatTaka(row.subtotal)}
                  </td>
                  <td className={td}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {row.recovered_order && (
                      <Link
                        href={`/admin/orders?open=${row.recovered_order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block text-[11px] font-mono font-semibold text-primary hover:underline mt-0.5"
                      >
                        {row.recovered_order.number}
                      </Link>
                    )}
                  </td>
                  <td className={`${td} max-w-[200px]`}>
                    {row.staff_note ? (
                      <span className="text-xs text-slate-700 line-clamp-2">
                        {row.staff_note}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`}>
                    <div>{timeAgo(row.last_activity_at)}</div>
                    <div className="text-[11px] text-slate-400">
                      {formatDateTime(row.last_activity_at)}
                    </div>
                  </td>
                  <td className={`${td} text-right`}>
                    <IconButton
                      label="Inspect incomplete order"
                      icon={Eye}
                      tone="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(row);
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
          void load(filters, p, perPage);
        }}
        onPerPageChange={(pp) => {
          setPerPage(pp);
          setPage(1);
          void load(filters, 1, pp);
        }}
      />

      {selected && (
        <IncompleteOrderModal
          item={selected}
          canUpdate={can("incomplete-orders.update")}
          onClose={() => setSelected(null)}
          onSaved={handleUpdated}
        />
      )}
    </div>
  );
}

function IncompleteOrderModal({
  item,
  canUpdate,
  onClose,
  onSaved,
}: {
  item: IncompleteOrder;
  canUpdate: boolean;
  onClose: () => void;
  onSaved: (updated: IncompleteOrder) => void;
}) {
  const [status, setStatus] = useState<IncompleteOrderStatus>(item.status);
  const [staffNote, setStaffNote] = useState(item.staff_note ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const stMeta = metaFor(INCOMPLETE_ORDER_STATUS_META, item.status);

  const save = async (nextStatus?: IncompleteOrderStatus) => {
    setSaving(true);
    setErr(null);
    const res = await updateAdminIncompleteOrderAction(item.id, {
      status: nextStatus ?? status,
      staff_note: staffNote.trim() || null,
    });
    setSaving(false);
    if (!res.success) {
      setErr(res.error.message);
      return;
    }
    onSaved(res.data);
  };

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      size="lg"
      title={`Incomplete Order #${item.id}`}
      description={`Last active ${formatDateTime(item.last_activity_at)} · Created ${formatDateTime(item.created_at)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Close
          </Button>
          {canUpdate && (
            <Button loading={saving} onClick={() => save()}>
              Save follow-up
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <InlineError message={err} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={stMeta.tone}>{stMeta.label}</Badge>
            <Badge tone={item.source === "buy_now" ? "orange" : "blue"}>
              {item.source === "buy_now" ? "Buy Now checkout" : "Cart checkout"}
            </Badge>
            {item.recovered_order && (
              <Link
                href={`/admin/orders?open=${item.recovered_order.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Order {item.recovered_order.number}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          {canUpdate && (
            <div className="flex items-center gap-2">
              {item.status !== "recovered" && (
                <Button
                  size="sm"
                  variant="success"
                  icon={CheckCircle2}
                  disabled={saving}
                  onClick={() => {
                    setStatus("recovered");
                    save("recovered");
                  }}
                >
                  Mark recovered
                </Button>
              )}
              {item.status !== "dismissed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={XCircle}
                  disabled={saving}
                  onClick={() => {
                    setStatus("dismissed");
                    save("dismissed");
                  }}
                >
                  Dismiss
                </Button>
              )}
              {item.status !== "incomplete" && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Clock}
                  disabled={saving}
                  onClick={() => {
                    setStatus("incomplete");
                    save("incomplete");
                  }}
                >
                  Reopen
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Contact details */}
        <section className="rounded-xl ring-1 ring-slate-200 p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" /> Shopper Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-xs text-slate-400">Name</div>
              <div className="font-medium text-slate-900">
                {item.contact?.name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Phone</div>
              {item.contact?.phone ? (
                <a
                  href={`tel:${item.contact.phone}`}
                  className="inline-flex items-center gap-1.5 font-mono font-semibold text-primary hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {item.contact.phone}
                </a>
              ) : (
                <div className="text-slate-400">—</div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400">Email</div>
              {item.contact?.email ? (
                <a
                  href={`mailto:${item.contact.email}`}
                  className="inline-flex items-center gap-1.5 text-slate-700 hover:text-primary"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {item.contact.email}
                </a>
              ) : (
                <div className="text-slate-400">—</div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400">Address</div>
              <div className="text-slate-700 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{item.contact?.address || "—"}</span>
              </div>
            </div>
          </div>
          {item.note && (
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Shopper note: </span>
              {item.note}
            </div>
          )}
        </section>

        {/* Items table */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" /> Items ({item.items?.length || 0})
            </h3>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              Subtotal: {formatTaka(item.subtotal)}
            </span>
          </div>
          <div className="rounded-xl ring-1 ring-slate-200 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold w-10">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Product</th>
                  <th className="px-3 py-2 text-left font-semibold">SKU</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Unit</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(item.items || []).map((it, idx) => (
                  <tr key={`${it.variant_id}-${idx}`}>
                    <td className="px-3 py-2.5 text-xs font-mono text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {it.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.image_url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 bg-white shrink-0"
                          />
                        ) : null}
                        <div>
                          <div className="font-medium text-slate-900">{it.name}</div>
                          {it.label && (
                            <div className="text-xs text-slate-500">{it.label}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                      {it.sku || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {it.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatTaka(it.unit_price)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                      {formatTaka(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Staff Follow-up Note & Status */}
        {canUpdate ? (
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Status">
                <Select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as IncompleteOrderStatus)
                  }
                >
                  <option value="incomplete">Incomplete (Needs follow-up)</option>
                  <option value="recovered">Recovered</option>
                  <option value="dismissed">Dismissed</option>
                </Select>
              </Field>
            </div>
            <Field
              label="Staff Follow-up Note"
              hint="Record call outcomes or follow-up details (up to 1,000 characters)."
            >
              <Textarea
                rows={3}
                maxLength={1000}
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                placeholder="e.g. Called customer, confirmed delivery address, will place order this evening."
              />
            </Field>
          </section>
        ) : (
          item.staff_note && (
            <section className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 text-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Staff Note
              </div>
              <p className="text-slate-800 whitespace-pre-line">{item.staff_note}</p>
            </section>
          )
        )}
      </div>
    </Modal>
  );
}
