"use client";

/**
 * Courier shipping on the order detail (COURIERS.md §7–8):
 * the parcel card with "Refresh from courier", and the "Ship with courier" dialog for packed orders.
 */
import React, { useEffect, useState } from "react";
import { ExternalLink, MapPin, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { bookAdminOrderShipmentAction, syncAdminOrderShipmentAction } from "@/app/(admin)/actions/orders";
import { getAdminAvailableCouriersAction } from "@/app/(admin)/actions/couriers";
import type { AdminOrderDetail, AvailableCourier, CourierKey, Shipment, ShipmentBookingPayload } from "@/types/admin-orders";
import { Badge, Button, Field, InlineError, Input, MoneyInput, Modal, Spinner, Textarea } from "@/app/(admin)/components/ui";
import { formatDateTime, formatTaka, poishaToTaka, takaToPoisha } from "@/app/(admin)/components/format";
import { SHIPMENT_STATE_META, metaFor, timeAgo } from "@/app/(admin)/components/order-meta";
import { AreaValue, CourierAreaPickers, missingAreaFields } from "@/app/(admin)/components/courier-pickers";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<string, string> = { city_id: "city", zone_id: "zone", area_id: "area" };

/** The parcel booked for an order, as staff see it. */
export function ShipmentCard({
  orderId,
  shipment,
  canSync,
  onUpdated,
}: {
  orderId: number;
  shipment: Shipment;
  canSync: boolean;
  onUpdated: (order: AdminOrderDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const state = metaFor(SHIPMENT_STATE_META, shipment.state);
  const hint = SHIPMENT_STATE_META[shipment.state]?.hint;

  const refresh = async () => {
    setBusy(true);
    setErr(null);
    setDone(null);
    const res = await syncAdminOrderShipmentAction(orderId);
    setBusy(false);
    if (!res.success) return setErr(res.error.message);
    onUpdated(res.data);
    setDone("Updated from the courier.");
  };

  const area = shipment.delivery_area;
  const areaText = area ? Object.entries(area).map(([k, v]) => `${FIELD_LABELS[k] ?? k} #${v}`).join(", ") : null;

  return (
    <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{shipment.courier_label}</span>
              <Badge tone={state.tone}>{state.label}</Badge>
              {shipment.is_sandbox && <Badge tone="amber">TEST</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {hint}
              {shipment.courier_status && (
                <>
                  {" · "}
                  <span className="font-mono">{shipment.courier_status}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {shipment.tracking_url && (
            <a
              href={shipment.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white ring-1 ring-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Track parcel
            </a>
          )}
          {canSync && !shipment.finished_at && (
            <Button size="sm" variant="secondary" icon={RefreshCw} loading={busy} onClick={refresh}>
              Refresh from courier
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 text-xs">
        <div>
          <dt className="text-slate-500">Consignment</dt>
          <dd className="font-mono font-semibold text-slate-800 break-all">{shipment.consignment_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Tracking code</dt>
          <dd className="font-mono font-semibold text-slate-800 break-all">{shipment.tracking_code ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Cash to collect</dt>
          <dd className="font-semibold text-slate-800">{formatTaka(shipment.cod_amount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Delivery charge</dt>
          <dd className="font-semibold text-slate-800">
            {shipment.delivery_charge === null ? <span className="text-slate-400">Not reported yet</span> : formatTaka(shipment.delivery_charge)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Weight</dt>
          <dd className="font-semibold text-slate-800">{shipment.weight_grams ? `${shipment.weight_grams / 1000} kg` : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Booked</dt>
          <dd className="text-slate-800">
            {formatDateTime(shipment.created_at)}
            {shipment.booked_by && <span className="text-slate-500"> by {shipment.booked_by.name}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Last checked</dt>
          <dd className="text-slate-800" title={shipment.synced_at ? formatDateTime(shipment.synced_at) : undefined}>
            {timeAgo(shipment.synced_at)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Finished</dt>
          <dd className="text-slate-800">{shipment.finished_at ? formatDateTime(shipment.finished_at) : "Still tracked"}</dd>
        </div>
      </dl>

      {(areaText || shipment.note) && (
        <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
          {areaText && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Courier place: {areaText}
            </p>
          )}
          {shipment.note && <p>Note for the rider: {shipment.note}</p>}
        </div>
      )}

      {err && <InlineError message={err} />}
      {done && <p className="text-xs text-emerald-700">{done}</p>}
    </div>
  );
}

/** Book a packed order with one of the couriers that are switched on. */
export function ShipWithCourierDialog({
  order,
  onClose,
  onShipped,
}: {
  order: AdminOrderDetail;
  onClose: () => void;
  onShipped: (order: AdminOrderDetail) => void;
}) {
  const [couriers, setCouriers] = useState<AvailableCourier[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [courier, setCourier] = useState<CourierKey | null>(null);
  const [area, setArea] = useState<AreaValue>({});

  const grandTotal = order.totals?.grand_total ?? 0;
  const defaultWeightKg = order.delivery?.weight_grams ? order.delivery.weight_grams / 1000 : 0.5;
  const defaultCod = order.payment_status === "paid" ? 0 : grandTotal;
  const [weight, setWeight] = useState(String(defaultWeightKg));
  const [cod, setCod] = useState(poishaToTaka(defaultCod));
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    getAdminAvailableCouriersAction().then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setLoadError(res.error.message);
        setCouriers([]);
        return;
      }
      setCouriers(res.data.data);
      if (res.data.data.length === 1) setCourier(res.data.data[0].courier);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const chosen = couriers?.find((c) => c.courier === courier) ?? null;

  const submit = async () => {
    if (!chosen) return setErr("Choose a courier.");
    const missing = missingAreaFields(chosen.courier, area);
    if (missing.length) return setErr(`Choose the ${missing.map((m) => FIELD_LABELS[m]).join(" and ")} for ${chosen.label}.`);

    const payload: ShipmentBookingPayload = { courier: chosen.courier };
    if (chosen.courier === "pathao") {
      payload.city_id = area.city_id;
      payload.zone_id = area.zone_id;
      if (area.area_id) payload.area_id = area.area_id;
    } else if (chosen.courier === "redx") {
      payload.area_id = area.area_id;
    }

    const w = Number(weight);
    if (!Number.isFinite(w) || w < 0.1 || w > 50) return setErr("Weight must be between 0.1 and 50 kg.");
    if (Math.abs(w - defaultWeightKg) > 1e-9) payload.weight_kg = Math.round(w * 1000) / 1000;

    const codPoisha = takaToPoisha(cod);
    if (codPoisha === null || codPoisha < 0) return setErr("Enter the cash to collect (0 if nothing).");
    if (codPoisha > grandTotal) return setErr(`Cash to collect cannot be more than the order total (${formatTaka(grandTotal)}).`);
    if (codPoisha !== defaultCod) payload.cod_amount = codPoisha;

    if (note.trim()) payload.note = note.trim();

    setBusy(true);
    setErr(null);
    setFieldErrors({});
    const res = await bookAdminOrderShipmentAction(order.id, payload);
    setBusy(false);
    if (!res.success) {
      setErr(res.error.message);
      setFieldErrors(res.error.fields ?? {});
      return;
    }
    onShipped(res.data);
  };

  const addr = order.shipping_address;
  const fieldError = (k: string) => fieldErrors[k]?.[0];

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={`Ship order ${order.number} with a courier`}
      description="The courier is asked first. The order becomes Shipped only when it accepts."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button icon={PackageCheck} loading={busy} disabled={!chosen} onClick={submit}>
            {busy ? "Booking with the courier…" : "Ship"}
          </Button>
        </>
      }
    >
      {couriers === null ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : couriers.length === 0 ? (
        <div className="space-y-3 text-sm text-slate-600">
          <InlineError message={loadError} />
          {!loadError && (
            <p>
              No courier is switched on yet. An owner can set one up under <strong>Couriers</strong>. Until then, mark the order{" "}
              <strong>Shipped</strong> by hand from the status steps.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <InlineError message={err} />

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-slate-700 mb-1.5">Courier</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {couriers.map((c) => (
                <label
                  key={c.courier}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ring-1 cursor-pointer transition-colors",
                    courier === c.courier ? "ring-2 ring-primary bg-brand-50/40" : "ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="courier"
                      checked={courier === c.courier}
                      onChange={() => {
                        setCourier(c.courier);
                        setArea({});
                        setErr(null);
                      }}
                      disabled={busy}
                      className="accent-brand-500"
                    />
                    <span className="text-sm font-semibold text-slate-800">{c.label}</span>
                  </span>
                  {c.is_sandbox && <Badge tone="amber">TEST</Badge>}
                </label>
              ))}
            </div>
            {chosen?.is_sandbox && (
              <p className="text-xs text-amber-700">
                Test mode: the parcel goes to {chosen.label}&apos;s test server and nobody will collect it.
              </p>
            )}
          </fieldset>

          {chosen && chosen.area_fields.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 px-3 py-2.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Customer&apos;s address: </span>
                {addr ? [addr.line1, addr.line2, addr.area, addr.district, addr.postcode].filter(Boolean).join(", ") : "Not recorded"}
              </div>
              <CourierAreaPickers courier={chosen.courier} fields={chosen.area_fields} value={area} onChange={setArea} disabled={busy} />
              {(fieldError("city_id") || fieldError("zone_id") || fieldError("area_id")) && (
                <p className="text-xs text-rose-600">{fieldError("city_id") || fieldError("zone_id") || fieldError("area_id")}</p>
              )}
            </div>
          )}

          {chosen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Weight (kg)" hint={fieldError("weight_kg") ?? "0.1 to 50 kg."}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={50}
                  step="0.1"
                  value={weight}
                  disabled={busy}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </Field>
              <Field
                label="Cash to collect"
                hint={
                  fieldError("cod_amount") ??
                  (order.payment_status === "paid" ? "Already paid, so nothing to collect." : `Up to the order total, ${formatTaka(grandTotal)}.`)
                }
              >
                <MoneyInput value={cod} onChange={setCod} disabled={busy} max={grandTotal / 100} />
              </Field>
              <Field label="Note for the rider" hint={fieldError("note") ?? `${note.length}/250`} className="sm:col-span-2">
                <Textarea
                  value={note}
                  rows={2}
                  maxLength={250}
                  disabled={busy}
                  placeholder="e.g. Call before coming"
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
