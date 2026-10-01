"use client";

import React, { useState } from "react";
import { Eye, PackagePlus, Plus, Truck, X } from "lucide-react";
import {
  Purchase,
  createAdminPurchaseAction,
  getAdminPurchaseAction,
  getAdminPurchasesAction,
} from "@/app/(admin)/actions/purchases";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Button,
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
  Spinner,
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
import { VariantPicker } from "@/app/(admin)/components/pickers";
import { formatDate, formatDateTime, formatTaka, poishaToTaka, takaToPoisha, todayInput } from "@/app/(admin)/components/format";

interface Line {
  variant_id: number;
  name: string;
  sku: string;
  quantity: string;
  unit_cost: string;
}

export function PurchasesManagement({ initial, initialError }: { initial: Paginated<Purchase>; initialError: string | null }) {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [formOpen, setFormOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [supplier, setSupplier] = useState("");
  const [receivedOn, setReceivedOn] = useState(todayInput());
  const [note, setNote] = useState("");
  const [updateCost, setUpdateCost] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [viewing, setViewing] = useState<Purchase | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = async (opts: { q?: string; page?: number } = {}) => {
    setLoading(true);
    const res = await getAdminPurchasesAction({ q: opts.q ?? q, page: opts.page ?? page });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };
  const debounced = useDebouncedCallback((term: string) => {
    setPage(1);
    load({ q: term, page: 1 });
  });

  const openCreate = () => {
    setReference("");
    setSupplier("");
    setReceivedOn(todayInput());
    setNote("");
    setUpdateCost(true);
    setLines([]);
    setFormError(null);
    setFormOpen(true);
  };

  const view = async (p: Purchase) => {
    setViewing(p);
    setViewLoading(true);
    const res = await getAdminPurchaseAction(p.id);
    setViewLoading(false);
    if (res.success) setViewing(res.data);
  };

  const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (takaToPoisha(l.unit_cost) ?? 0), 0);

  const save = async () => {
    if (!receivedOn) return setFormError("Enter the date the delivery arrived.");
    if (receivedOn > todayInput()) return setFormError("The received date cannot be in the future.");
    if (lines.length === 0) return setFormError("Add at least one product received.");
    const items = lines.map((l) => ({
      variant_id: l.variant_id,
      quantity: Math.round(Number(l.quantity)),
      unit_cost: takaToPoisha(l.unit_cost),
    }));
    if (items.some((i) => !i.quantity || i.quantity < 1)) return setFormError("Every line needs a quantity of at least 1.");

    setSaving(true);
    setFormError(null);
    const res = await createAdminPurchaseAction({
      reference_no: reference.trim() || null,
      supplier_name: supplier.trim() || null,
      received_on: receivedOn,
      note: note.trim() || null,
      update_cost_price: updateCost,
      items,
    });
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(`Delivery recorded. Stock added for ${items.length} product${items.length === 1 ? "" : "s"}.`);
    setPage(1);
    load({ page: 1 });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Truck}
        title="Purchases"
        description="Record supplier deliveries. Recording one adds the quantities to stock."
        actions={<Button icon={Plus} onClick={openCreate}>Record delivery</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <SearchInput
        value={q}
        onChange={(v) => {
          setQ(v);
          debounced(v);
        }}
        placeholder="Search reference or supplier"
        className="sm:w-80"
      />

      <TableShell>
        <THead>
          <th className={th}>Received</th>
          <th className={th}>Reference</th>
          <th className={th}>Supplier</th>
          <th className={`${th} text-right`}>Total cost</th>
          <th className={th}>Recorded by</th>
          <th className={`${th} text-right`}>Details</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={6} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={PackagePlus}
                  title="No deliveries recorded"
                  description="Record a delivery when stock arrives from a supplier."
                  action={<Button icon={Plus} onClick={openCreate}>Record delivery</Button>}
                />
              </td>
            </tr>
          ) : (
            list.data.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className={td}>{formatDate(p.received_on)}</td>
                <td className={`${td} font-mono text-xs`}>{p.reference_no ?? "—"}</td>
                <td className={td}>{p.supplier_name ?? "—"}</td>
                <td className={`${td} text-right tabular-nums font-semibold text-slate-900`}>{formatTaka(p.total_cost)}</td>
                <td className={`${td} text-xs`}>{p.recorded_by ?? "—"}</td>
                <td className={`${td} text-right`}>
                  <IconButton label="View delivery" icon={Eye} tone="primary" onClick={() => view(p)} />
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
        title="Record delivery"
        description="Quantities are added to stock as soon as you save."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              Save and add stock
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <InlineError message={formError} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Received on" required>
              <Input type="date" value={receivedOn} max={todayInput()} onChange={(e) => setReceivedOn(e.target.value)} />
            </Field>
            <Field label="Supplier">
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={255} placeholder="Firex Bangladesh" />
            </Field>
            <Field label="Invoice / reference no.">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={64} placeholder="INV-8821" />
            </Field>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Products received</h3>
            <VariantPicker
              excludeIds={lines.map((l) => l.variant_id)}
              onPick={(v) =>
                setLines((ls) => [
                  ...ls,
                  {
                    variant_id: v.variant_id,
                    name: v.label ? `${v.product.name} · ${v.label}` : v.product.name,
                    sku: v.sku,
                    quantity: "1",
                    unit_cost: poishaToTaka(v.cost_price),
                  },
                ])
              }
            />
            {lines.length === 0 ? (
              <p className="text-sm text-slate-500 rounded-xl bg-slate-50 px-4 py-5 text-center">Search above to add products.</p>
            ) : (
              <div className="rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100">
                {lines.map((l, i) => (
                  <div key={l.variant_id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_6rem_9rem_auto] gap-2 items-center px-4 py-3">
                    <div className="min-w-0 col-span-2 sm:col-span-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{l.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{l.sku}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={l.quantity}
                      aria-label={`Quantity of ${l.name}`}
                      onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                    />
                    <MoneyInput
                      value={l.unit_cost}
                      aria-label={`Unit cost of ${l.name}`}
                      placeholder="Unit cost"
                      onChange={(v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unit_cost: v } : x)))}
                    />
                    <IconButton label="Remove line" icon={X} tone="danger" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} />
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-slate-50 text-sm">
                  <span className="text-slate-600">Total cost</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatTaka(total)}</span>
                </div>
              </div>
            )}
          </div>

          <Toggle
            checked={updateCost}
            onChange={setUpdateCost}
            label="Update cost prices"
            description="Use these unit costs as each product's new cost price for margin reports."
          />
          <Field label="Note">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.reference_no ? `Delivery ${viewing.reference_no}` : "Delivery"}
        description={viewing ? `${viewing.supplier_name ?? "Unknown supplier"} · received ${formatDate(viewing.received_on)}` : undefined}
        size="lg"
      >
        {viewLoading || !viewing?.items ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className={th}>Product</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Unit cost</th>
                  <th className={`${th} text-right`}>Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewing.items.map((it) => (
                  <tr key={it.variant_id}>
                    <td className={td}>
                      <span className="block font-medium text-slate-800">{it.product}</span>
                      <span className="block text-xs font-mono text-slate-500">{it.sku}</span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{it.quantity}</td>
                    <td className={`${td} text-right tabular-nums`}>{it.unit_cost !== null ? formatTaka(it.unit_cost) : "—"}</td>
                    <td className={`${td} text-right tabular-nums`}>{it.unit_cost !== null ? formatTaka(it.unit_cost * it.quantity) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className={`${td} font-bold`} colSpan={3}>
                    Total
                  </td>
                  <td className={`${td} text-right font-bold tabular-nums`}>{formatTaka(viewing.total_cost)}</td>
                </tr>
              </tfoot>
            </table>
            {viewing.note && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{viewing.note}</p>}
            <p className="text-xs text-slate-500">
              Recorded by {viewing.recorded_by ?? "staff"} on {formatDateTime(viewing.created_at)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
