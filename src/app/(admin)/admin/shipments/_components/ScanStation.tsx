"use client";

/**
 * Scan station (COURIERS.md §7 "Shipping by scanning instead").
 * A USB/Bluetooth scanner types the invoice barcode and presses Enter, so each tab needs only one box.
 */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, MapPin, PackageCheck, RefreshCw, RotateCcw, ScanBarcode, Undo2, XCircle } from "lucide-react";
import { getAdminOrdersAction, scanAdminReturnAction, scanAdminShipmentAction } from "@/app/(admin)/actions/orders";
import { getAdminAvailableCouriersAction } from "@/app/(admin)/actions/couriers";
import type { AdminOrderDetail, AdminOrderRow, AvailableCourier, CourierAreaField, CourierKey, ShipmentScanPayload } from "@/types/admin-orders";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
  TableShell,
  TBody,
  THead,
  Tabs,
  td,
  th,
} from "@/app/(admin)/components/ui";
import { formatDateTime, formatTaka } from "@/app/(admin)/components/format";
import { AreaValue, CourierAreaPickers } from "@/app/(admin)/components/courier-pickers";
import { useCan } from "@/app/(admin)/components/permissions";
import { cn } from "@/lib/utils";

type Mode = "ship" | "return";
type LogEntry = { id: number; number: string; ok: boolean; text: string; orderId?: number; at: Date };

const COURIER_STORAGE_KEY = "admin.scan.courier";
const FIELD_LABELS: Record<CourierAreaField, string> = { city_id: "city", zone_id: "zone", area_id: "area" };

function readStoredCourier(): string {
  try {
    return window.localStorage.getItem(COURIER_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function ScanBox({
  label,
  disabled,
  busy,
  onScan,
  inputRef,
}: {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onScan: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (!v || busy || disabled) return;
        onScan(v.slice(0, 32));
        setValue("");
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          autoFocus
          disabled={disabled}
          maxLength={32}
          autoComplete="off"
          spellCheck={false}
          placeholder={label}
          aria-label={label}
          onChange={(e) => setValue(e.target.value)}
          className="pl-11 h-12 text-base font-mono tracking-wide"
        />
      </div>
      <Button type="submit" loading={busy} disabled={disabled || !value.trim()} className="h-12">
        Go
      </Button>
    </form>
  );
}

export function ScanStation({ initialPacked, initialError }: { initialPacked: AdminOrderRow[]; initialError: string | null }) {
  const can = useCan();
  const canShip = can("orders.fulfil");
  const canReturn = can("orders.refund");
  const [mode, setMode] = useState<Mode>(canShip ? "ship" : "return");

  const [couriers, setCouriers] = useState<AvailableCourier[] | null>(null);
  const [courier, setCourier] = useState<string>("");
  const [note, setNote] = useState("");
  const [returnNote, setReturnNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pending, setPending] = useState<{ payload: ShipmentScanPayload; missing: CourierAreaField[]; order: AdminOrderDetail } | null>(null);
  const [area, setArea] = useState<AreaValue>({});

  const [packed, setPacked] = useState(initialPacked);
  const [packedError, setPackedError] = useState(initialError);
  const [packedLoading, setPackedLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getAdminAvailableCouriersAction().then((res) => {
      if (cancelled) return;
      const list = res.success ? res.data.data : [];
      setCouriers(list);
      const stored = readStoredCourier();
      if (stored && list.some((c) => c.courier === stored)) setCourier(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseCourier = (value: string) => {
    setCourier(value);
    setPending(null);
    try {
      window.localStorage.setItem(COURIER_STORAGE_KEY, value);
    } catch {
      /* storage unavailable: the choice just isn't remembered */
    }
  };

  const addLog = (entry: Omit<LogEntry, "id" | "at">) => setLog((l) => [{ ...entry, id: ++seq.current, at: new Date() }, ...l].slice(0, 50));

  const refreshPacked = async () => {
    setPackedLoading(true);
    const res = await getAdminOrdersAction({ status: "packed", per_page: 50 });
    setPackedLoading(false);
    if (res.success) {
      setPacked(res.data.data);
      setPackedError(null);
    } else setPackedError(res.error.message);
  };

  const focusBox = () => setTimeout(() => inputRef.current?.focus(), 0);

  const sendShip = async (payload: ShipmentScanPayload) => {
    setBusy(true);
    const res = await scanAdminShipmentAction(payload);
    setBusy(false);
    if (!res.success) {
      const text = res.error.status === 404 ? "Order not found" : res.error.message;
      addLog({ number: payload.number, ok: false, text });
      focusBox();
      return;
    }
    if (res.data.result === "needs_area") {
      setPending({ payload, missing: res.data.missing, order: res.data.order });
      setArea({});
      return;
    }
    setPending(null);
    const o = res.data.order;
    addLog({
      number: o.number,
      ok: true,
      orderId: o.id,
      text: o.shipment ? `Shipped with ${o.shipment.courier_label}${o.shipment.consignment_id ? ` · ${o.shipment.consignment_id}` : ""}` : "Shipped by hand",
    });
    setPacked((list) => list.filter((r) => r.id !== o.id));
    focusBox();
  };

  const onShipScan = (number: string) => {
    const payload: ShipmentScanPayload = { number };
    if (courier) payload.courier = courier as CourierKey;
    if (note.trim()) payload.note = note.trim().slice(0, 250);
    sendShip(payload);
  };

  const resendWithArea = () => {
    if (!pending) return;
    const missing = pending.missing.filter((f) => !area[f]);
    if (missing.length) return;
    sendShip({ ...pending.payload, ...area });
  };

  const onReturnScan = async (number: string) => {
    setBusy(true);
    const res = await scanAdminReturnAction({ number, note: returnNote });
    setBusy(false);
    if (!res.success) addLog({ number, ok: false, text: res.error.status === 404 ? "Order not found" : res.error.message });
    else addLog({ number: res.data?.number ?? number, ok: true, orderId: res.data?.id, text: "Returned; stock is back on the shelf" });
    focusBox();
  };

  const selected = couriers?.find((c) => c.courier === courier) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ScanBarcode}
        title="Scan station"
        description="Scan the barcode on the invoice to ship a packed order, or to take a parcel back."
      />

      {canShip && canReturn && (
        <Tabs
          tabs={[
            { value: "ship", label: "Ship" },
            { value: "return", label: "Return" },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setPending(null);
            focusBox();
          }}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
        <div className="xl:col-span-3 space-y-5">
          {mode === "ship" && canShip ? (
            <Card className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ship with" hint={selected?.is_sandbox ? "Test mode: nobody will collect these parcels." : couriers?.length === 0 ? "No courier is switched on; orders are shipped by hand." : undefined}>
                  <Select value={courier} disabled={busy || couriers === null} onChange={(e) => chooseCourier(e.target.value)}>
                    <option value="">By hand (no courier booking)</option>
                    {(couriers ?? []).map((c) => (
                      <option key={c.courier} value={c.courier}>
                        {c.label}
                        {c.is_sandbox ? " (TEST)" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Note for the rider" hint="Optional; sent with every parcel scanned now.">
                  <Input value={note} maxLength={250} disabled={busy} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Fragile" />
                </Field>
              </div>
              <ScanBox label="Scan or type the order number" busy={busy} disabled={!!pending} onScan={onShipScan} inputRef={inputRef} />

              {pending && selected && (
                <div className="rounded-xl ring-1 ring-amber-200 bg-amber-50/60 p-4 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-amber-900">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">
                        {selected.label} needs the {pending.missing.map((m) => FIELD_LABELS[m]).join(" and ")} for order {pending.order.number}.
                      </p>
                      <p className="text-xs">
                        {pending.order.customer.name} ·{" "}
                        {pending.order.shipping_address
                          ? [pending.order.shipping_address.line1, pending.order.shipping_address.area, pending.order.shipping_address.district]
                              .filter(Boolean)
                              .join(", ")
                          : "no address"}
                      </p>
                    </div>
                  </div>
                  <CourierAreaPickers
                    courier={selected.courier}
                    fields={selected.area_fields.length ? selected.area_fields : pending.missing}
                    value={area}
                    onChange={setArea}
                    disabled={busy}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        addLog({ number: pending.order.number, ok: false, text: "Skipped: place not chosen" });
                        setPending(null);
                        focusBox();
                      }}
                    >
                      Skip
                    </Button>
                    <Button icon={PackageCheck} loading={busy} disabled={pending.missing.some((f) => !area[f])} onClick={resendWithArea}>
                      Ship order {pending.order.number}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : canReturn ? (
            <Card className="space-y-4">
              <p className="text-sm text-slate-600">
                A shipped or delivered order becomes <strong>Returned</strong>, its stock goes back on the shelf and its parcel stops being tracked.
              </p>
              <Field label="Reason" hint="Optional; saved in the order history.">
                <Input value={returnNote} maxLength={500} disabled={busy} onChange={(e) => setReturnNote(e.target.value)} placeholder="e.g. Customer refused" />
              </Field>
              <ScanBox label="Scan or type the order number to return" busy={busy} onScan={onReturnScan} inputRef={inputRef} />
            </Card>
          ) : (
            <Card>
              <EmptyState icon={AlertTriangle} title="No scanning permission" description="Ask an owner for the orders.fulfil or orders.refund permission." />
            </Card>
          )}

          <Card padded={false}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">This session</h2>
              {log.length > 0 && (
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setLog([])}>
                  Clear
                </Button>
              )}
            </div>
            {log.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">Scanned orders appear here.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {log.map((e) => (
                  <li key={e.id} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                    {e.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span className="font-mono font-semibold text-slate-900 shrink-0">{e.number}</span>
                    <span className={cn("flex-1 min-w-0 truncate", e.ok ? "text-slate-600" : "text-rose-700")} title={e.text}>
                      {e.text}
                    </span>
                    {e.orderId && (
                      <Link href={`/admin/orders?order=${e.orderId}`} className="text-xs font-semibold text-primary hover:underline shrink-0">
                        Open
                      </Link>
                    )}
                    <span className="text-[11px] text-slate-400 shrink-0">{e.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {canShip && (
          <div className="xl:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                Packed, waiting to ship <Badge tone="purple">{packed.length}</Badge>
              </h2>
              <Button size="sm" variant="ghost" icon={RefreshCw} loading={packedLoading} onClick={refreshPacked}>
                Refresh
              </Button>
            </div>
            {packedError && <p className="text-xs text-rose-600">{packedError}</p>}
            <TableShell className="[&_table]:min-w-0">
              <THead>
                <th className={`${th} w-10 text-center`}>#</th>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={`${th} text-right`}>Total</th>
              </THead>
              <TBody>
                {packedLoading ? (
                  <LoadingRows cols={4} rows={4} />
                ) : packed.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState icon={Undo2} title="Nothing waiting" description="Packed orders show up here." />
                    </td>
                  </tr>
                ) : (
                  packed.map((o, idx) => (
                    <tr key={o.id}>
                      <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>{idx + 1}</td>
                      <td className={`${td} font-mono text-xs font-semibold`}>
                        <Link href={`/admin/orders?order=${o.id}`} className="hover:text-primary">
                          {o.number}
                        </Link>
                        <span className="block font-sans font-normal text-[11px] text-slate-500">{formatDateTime(o.placed_at)}</span>
                      </td>
                      <td className={`${td} text-xs`}>
                        {o.customer.name}
                        <span className="block text-slate-500">{o.district ?? ""}</span>
                      </td>
                      <td className={`${td} text-right text-xs tabular-nums font-semibold`}>{formatTaka(o.grand_total)}</td>
                    </tr>
                  ))
                )}
              </TBody>
            </TableShell>
          </div>
        )}
      </div>
    </div>
  );
}
