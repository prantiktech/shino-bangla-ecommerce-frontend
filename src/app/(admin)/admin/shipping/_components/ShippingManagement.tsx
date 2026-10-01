"use client";

import React, { useMemo, useState } from "react";
import { Edit2, MapPin, Plus, Star, Trash2, Truck, X } from "lucide-react";
import {
  LocationOption,
  RateBasis,
  ShippingZone,
  ShippingZonePayload,
  ZoneType,
  createAdminShippingZoneAction,
  deleteAdminShippingZoneAction,
  getAdminShippingZoneAction,
  getAdminShippingZonesAction,
  updateAdminShippingZoneAction,
} from "@/app/(admin)/actions/shipping";
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
  MoneyInput,
  NoticeBanner,
  PageHeader,
  SearchInput,
  Select,
  Toggle,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatTaka, poishaToTaka, takaToPoisha } from "@/app/(admin)/components/format";

const TYPE_LABEL: Record<ZoneType, string> = {
  inside_city: "Inside city",
  outside_city: "Outside city",
  custom: "Custom",
};
const BASIS_LABEL: Record<RateBasis, string> = {
  flat: "Flat charge",
  weight: "By parcel weight",
  order_value: "By order value",
};

interface RateRow {
  from: string;
  to: string;
  charge: string;
  extraKg: string;
}

interface FormState {
  name: string;
  type: ZoneType;
  rate_basis: RateBasis;
  free_above: string;
  days_min: string;
  days_max: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: string;
  location_ids: number[];
  rates: RateRow[];
}

const newForm = (): FormState => ({
  name: "",
  type: "custom",
  rate_basis: "flat",
  free_above: "",
  days_min: "",
  days_max: "",
  is_default: false,
  is_active: true,
  sort_order: "0",
  location_ids: [],
  rates: [{ from: "0", to: "", charge: "", extraKg: "" }],
});

/** Range values are grams for weight, poisha for order value. Forms show kg / taka. */
function rangeToInput(v: number | null, basis: RateBasis): string {
  if (v === null || v === undefined) return "";
  if (basis === "weight") return String(v / 1000);
  if (basis === "order_value") return poishaToTaka(v);
  return String(v);
}
function rangeFromInput(v: string, basis: RateBasis): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (basis === "weight") return Math.round(n * 1000);
  if (basis === "order_value") return Math.round(n * 100);
  return Math.round(n);
}

function rateSummary(z: ShippingZone): string {
  if (!z.rates.length) return "No rates";
  if (z.rate_basis === "flat" || z.rates.length === 1) return formatTaka(z.rates[0].charge);
  const charges = z.rates.map((r) => r.charge);
  return `${formatTaka(Math.min(...charges))} – ${formatTaka(Math.max(...charges))}`;
}

export function ShippingManagement({
  initial,
  locations,
  initialError,
}: {
  initial: ShippingZone[];
  locations: LocationOption[];
  initialError: string | null;
}) {
  const [zones, setZones] = useState(initial);
  const { notice, success, error, clear } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState<FormState>(newForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locQuery, setLocQuery] = useState("");
  const [deleting, setDeleting] = useState<ShippingZone | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const divisions = useMemo(() => locations.filter((l) => !l.parent_id), [locations]);
  const childrenOf = useMemo(() => {
    const m = new Map<number, LocationOption[]>();
    for (const l of locations) {
      if (l.parent_id) m.set(l.parent_id, [...(m.get(l.parent_id) ?? []), l]);
    }
    return m;
  }, [locations]);
  const locName = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);

  const reload = async () => {
    const res = await getAdminShippingZonesAction();
    if (res.success) setZones(res.data ?? []);
    else error(res.error.message);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(newForm());
    setFormError(null);
    setLocQuery("");
    setFormOpen(true);
  };

  const zoneToForm = (z: ShippingZone): FormState => ({
      name: z.name,
      type: z.type,
      rate_basis: z.rate_basis,
      free_above: poishaToTaka(z.free_above),
      days_min: z.delivery_days_min?.toString() ?? "",
      days_max: z.delivery_days_max?.toString() ?? "",
      is_default: z.is_default,
      is_active: z.is_active,
      sort_order: String(z.sort_order ?? 0),
      location_ids: z.locations.map((l) => l.id),
      rates: z.rates.length
        ? z.rates.map((r) => ({
            from: rangeToInput(r.range_from, z.rate_basis),
            to: rangeToInput(r.range_to, z.rate_basis),
            charge: poishaToTaka(r.charge),
            extraKg: poishaToTaka(r.per_extra_kg),
          }))
        : [{ from: "0", to: "", charge: "", extraKg: "" }],
    });

  const openEdit = (z: ShippingZone) => {
    setEditing(z);
    setForm(zoneToForm(z));
    setFormError(null);
    setLocQuery("");
    setFormOpen(true);
    getAdminShippingZoneAction(z.id).then((r) => {
      if (r.success) {
        setEditing(r.data);
        setForm(zoneToForm(r.data));
      }
    });
  };

  const toggleLocation = (id: number) =>
    set("location_ids", form.location_ids.includes(id) ? form.location_ids.filter((x) => x !== id) : [...form.location_ids, id]);

  const save = async () => {
    if (!form.name.trim()) return setFormError("Give the zone a name.");
    const basis = form.rate_basis;
    const rows = basis === "flat" ? form.rates.slice(0, 1) : form.rates;
    const rates = rows.map((r) => ({
      range_from: basis === "flat" ? 0 : rangeFromInput(r.from, basis) ?? 0,
      range_to: basis === "flat" ? null : rangeFromInput(r.to, basis),
      charge: takaToPoisha(r.charge),
      per_extra_kg: basis === "weight" ? takaToPoisha(r.extraKg) : null,
    }));
    if (rates.some((r) => r.charge === null)) return setFormError("Every rate needs a delivery charge.");
    if (rates.some((r) => r.range_to !== null && r.range_to < r.range_from))
      return setFormError("Each range must end at or after where it starts.");
    const dmin = form.days_min === "" ? null : Number(form.days_min);
    const dmax = form.days_max === "" ? null : Number(form.days_max);
    if (dmin !== null && dmax !== null && dmax < dmin) return setFormError("Maximum delivery days must be at least the minimum.");

    const payload: ShippingZonePayload = {
      name: form.name.trim(),
      type: form.type,
      rate_basis: basis,
      free_above: takaToPoisha(form.free_above),
      delivery_days_min: dmin,
      delivery_days_max: dmax,
      is_default: form.is_default,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
      location_ids: form.location_ids,
      rates: rates as ShippingZonePayload["rates"],
    };
    setSaving(true);
    setFormError(null);
    const res = editing ? await updateAdminShippingZoneAction(editing.id, payload) : await createAdminShippingZoneAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? `Zone "${res.data.name}" updated.` : `Zone "${res.data.name}" created.`);
    reload();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminShippingZoneAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`Zone "${deleting.name}" deleted.`);
      reload();
    }
    setDeleting(null);
  };

  const unit = form.rate_basis === "weight" ? "kg" : form.rate_basis === "order_value" ? "৳" : "";
  const q = locQuery.trim().toLowerCase();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Truck}
        title="Shipping zones"
        description="Delivery charges and times by area. Checkout picks the zone matching the customer's district."
        actions={<Button icon={Plus} onClick={openCreate}>New zone</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      {zones.length === 0 ? (
        <Card>
          <EmptyState
            icon={Truck}
            title="No shipping zones"
            description="Customers cannot see delivery charges until at least one zone exists."
            action={<Button icon={Plus} onClick={openCreate}>New zone</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...zones]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((z) => (
              <Card key={z.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900">{z.name}</h3>
                      {z.is_default && (
                        <Badge tone="orange">
                          <Star className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                      <Badge tone={z.is_active ? "green" : "slate"}>{z.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {TYPE_LABEL[z.type]} · {BASIS_LABEL[z.rate_basis]}
                    </p>
                  </div>
                  <span className="inline-flex gap-1">
                    <IconButton label="Edit zone" icon={Edit2} tone="primary" onClick={() => openEdit(z)} />
                    <IconButton label="Delete zone" icon={Trash2} tone="danger" onClick={() => setDeleting(z)} />
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Charge</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">{rateSummary(z)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Free above</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">{z.free_above ? formatTaka(z.free_above) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Delivery</dt>
                    <dd className="font-semibold text-slate-900">
                      {z.delivery_days_min !== null || z.delivery_days_max !== null
                        ? `${z.delivery_days_min ?? 0}–${z.delivery_days_max ?? z.delivery_days_min} days`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                  <span>
                    {z.locations.length === 0
                      ? z.is_default
                        ? "Every area not covered by another zone"
                        : "No areas assigned"
                      : z.locations.map((l) => l.name).join(", ")}
                  </span>
                </div>
              </Card>
            ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : "New shipping zone"}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? "Save changes" : "Create zone"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <InlineError message={formError} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Zone name" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Inside Dhaka" />
              </Field>
              <Field label="Zone type">
                <Select value={form.type} onChange={(e) => set("type", e.target.value as ZoneType)}>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Charge based on">
                <Select value={form.rate_basis} onChange={(e) => set("rate_basis", e.target.value as RateBasis)}>
                  {Object.entries(BASIS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Free delivery above" hint="Order value. Leave blank to always charge.">
                <MoneyInput value={form.free_above} onChange={(v) => set("free_above", v)} placeholder="Never free" />
              </Field>
              <Field label="Delivery days (min)">
                <Input type="number" min={0} max={365} value={form.days_min} onChange={(e) => set("days_min", e.target.value)} />
              </Field>
              <Field label="Delivery days (max)">
                <Input type="number" min={0} max={365} value={form.days_max} onChange={(e) => set("days_max", e.target.value)} />
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Rates</h3>
                {form.rate_basis !== "flat" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => set("rates", [...form.rates, { from: "", to: "", charge: "", extraKg: "" }])}
                  >
                    Add range
                  </Button>
                )}
              </div>
              {form.rate_basis === "flat" ? (
                <Field label="Delivery charge" required>
                  <MoneyInput
                    value={form.rates[0]?.charge ?? ""}
                    onChange={(v) => set("rates", [{ ...(form.rates[0] ?? { from: "0", to: "", extraKg: "" }), charge: v }])}
                  />
                </Field>
              ) : (
                <div className="space-y-2">
                  {form.rates.map((r, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end rounded-xl bg-slate-50 p-3">
                      <Field label={`From (${unit})`}>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={r.from}
                          onChange={(e) => set("rates", form.rates.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))}
                        />
                      </Field>
                      <Field label={`To (${unit})`}>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={r.to}
                          placeholder="and above"
                          onChange={(e) => set("rates", form.rates.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))}
                        />
                      </Field>
                      <Field label="Charge">
                        <MoneyInput
                          value={r.charge}
                          onChange={(v) => set("rates", form.rates.map((x, j) => (j === i ? { ...x, charge: v } : x)))}
                        />
                      </Field>
                      {form.rate_basis === "weight" ? (
                        <Field label="Per extra kg">
                          <MoneyInput
                            value={r.extraKg}
                            placeholder="—"
                            onChange={(v) => set("rates", form.rates.map((x, j) => (j === i ? { ...x, extraKg: v } : x)))}
                          />
                        </Field>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                      <IconButton
                        label="Remove range"
                        icon={X}
                        tone="danger"
                        disabled={form.rates.length <= 1}
                        onClick={() => set("rates", form.rates.filter((_, j) => j !== i))}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">
                    {form.rate_basis === "weight"
                      ? "Ranges are parcel weight in kilograms. Leave the last range open-ended."
                      : "Ranges are the order subtotal in taka. Leave the last range open-ended."}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Field label="Sort order">
                <Input type="number" min={0} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
              </Field>
              <Toggle checked={form.is_active} onChange={(v) => set("is_active", v)} label="Active" />
              <Toggle checked={form.is_default} onChange={(v) => set("is_default", v)} label="Default zone" description="Used when no other zone matches" />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Areas covered</h3>
              <span className="text-xs text-slate-500">{form.location_ids.length} selected</span>
            </div>
            {form.location_ids.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.location_ids.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleLocation(id)}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-50 text-brand-700 px-2 py-1 text-xs font-medium hover:bg-brand-100 cursor-pointer"
                  >
                    {locName.get(id) ?? `#${id}`}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
            <SearchInput value={locQuery} onChange={setLocQuery} placeholder="Search divisions and districts" />
            <div className="rounded-xl ring-1 ring-slate-200 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {divisions.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Locations could not be loaded.</p>
              ) : (
                divisions.map((d) => {
                  const kids = (childrenOf.get(d.id) ?? []).filter((k) => !q || k.name.toLowerCase().includes(q));
                  const divMatch = !q || d.name.toLowerCase().includes(q);
                  if (!divMatch && kids.length === 0) return null;
                  return (
                    <div key={d.id} className="p-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[var(--color-primary)] w-4 h-4"
                          checked={form.location_ids.includes(d.id)}
                          onChange={() => toggleLocation(d.id)}
                        />
                        {d.name} <span className="text-xs font-normal text-slate-400">division</span>
                      </label>
                      {kids.length > 0 && (
                        <div className="mt-2 ml-6 grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {kids.map((k) => (
                            <label key={k.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                className="accent-[var(--color-primary)] w-3.5 h-3.5"
                                checked={form.location_ids.includes(k.id)}
                                onChange={() => toggleLocation(k.id)}
                              />
                              <span className="truncate">{k.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete shipping zone?"
        message={<>Customers in <strong className="text-slate-900">{deleting?.name}</strong> will fall back to the default zone.</>}
        confirmLabel="Delete zone"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
