"use client";

/**
 * Couriers settings (COURIERS.md §6): one card per courier, built from what the API returns.
 * Keys are write-only: inputs start empty with the masked value as a placeholder, and only typed keys are sent.
 */
import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, KeyRound, RefreshCw, ShieldCheck, Truck, Webhook } from "lucide-react";
import {
  checkAdminCourierAction,
  getAdminCourierStoresAction,
  updateAdminCourierAction,
} from "@/app/(admin)/actions/couriers";
import type { CourierAccount, CourierStore, CourierUpdatePayload } from "@/types/admin-orders";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  InlineError,
  Input,
  NoticeBanner,
  PageHeader,
  Select,
  Toggle,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime } from "@/app/(admin)/components/format";
import { useCan } from "@/app/(admin)/components/permissions";

const WEBHOOK_HELP: Record<string, string> = {
  steadfast: "Steadfast merchant panel: paste the address as the callback URL and the secret as the auth token.",
  pathao: "Pathao merchant panel → Developer API → Webhook Integration: paste the address and the secret.",
  redx: "Ask RedX support to send parcel updates to this address.",
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the value is still selectable */
    }
  };
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input value={value} readOnly onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs bg-slate-50" />
        <Button variant="secondary" size="md" icon={copied ? CheckCircle2 : Copy} onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Field>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
  secret,
  disabled,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret: boolean;
  disabled?: boolean;
  id: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={secret && !shown ? "password" : "text"}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className={secret ? "pr-10 font-mono" : "font-mono"}
      />
      {secret && (
        <IconButton
          label={shown ? "Hide" : "Show"}
          icon={shown ? EyeOff : Eye}
          onClick={() => setShown((s) => !s)}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );
}

function CourierCard({
  account,
  editable,
  onSaved,
}: {
  account: CourierAccount;
  editable: boolean;
  onSaved: (a: CourierAccount, message: string) => void;
}) {
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(account.options.map((o) => [o.key, o.value === null || o.value === undefined ? "" : String(o.value)]))
  );
  const [enabled, setEnabled] = useState(account.is_enabled);
  const [sandbox, setSandbox] = useState(account.is_sandbox);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [stores, setStores] = useState<CourierStore[] | null>(null);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);

  const allKeysSaved = account.credentials.every((c) => c.is_set);
  const hasStoreOption = account.options.length > 0;

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    setStoresError(null);
    const res = await getAdminCourierStoresAction(account.courier);
    setStoresLoading(false);
    if (res.success) setStores(res.data.data);
    else {
      setStores(null);
      setStoresError(res.error.message);
    }
  }, [account.courier]);

  // The store list comes from the courier, so it needs saved keys.
  useEffect(() => {
    if (!hasStoreOption || !allKeysSaved) return;
    let cancelled = false;
    getAdminCourierStoresAction(account.courier).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setStores(res.data.data);
        setStoresError(null);
      } else setStoresError(res.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [account.courier, hasStoreOption, allKeysSaved]);

  const typedKeys = Object.fromEntries(Object.entries(creds).filter(([, v]) => v.trim() !== ""));
  const changedOptions = Object.fromEntries(
    account.options
      .filter((o) => (options[o.key] ?? "") !== (o.value === null || o.value === undefined ? "" : String(o.value)))
      .map((o) => [o.key, options[o.key] ? Number(options[o.key]) : null])
  );
  const dirty =
    Object.keys(typedKeys).length > 0 ||
    Object.keys(changedOptions).length > 0 ||
    enabled !== account.is_enabled ||
    (account.supports_sandbox && sandbox !== account.is_sandbox);

  // Would this save leave the courier fully set up? (every key saved or typed, required options chosen)
  const willBeConfigured =
    account.credentials.every((c) => c.is_set || (typedKeys[c.key] ?? "") !== "") &&
    account.options.every((o) => !o.is_required || (options[o.key] ?? "") !== "");

  const save = async () => {
    if (enabled && !willBeConfigured) {
      return setErr(`Enter every key ${account.label} needs${hasStoreOption ? " and pick a pickup store" : ""} before switching it on.`);
    }
    const payload: CourierUpdatePayload = {};
    if (Object.keys(typedKeys).length) payload.credentials = Object.fromEntries(Object.entries(typedKeys).map(([k, v]) => [k, v.trim()]));
    if (Object.keys(changedOptions).length) payload.options = changedOptions;
    if (enabled !== account.is_enabled) payload.is_enabled = enabled;
    if (account.supports_sandbox && sandbox !== account.is_sandbox) payload.is_sandbox = sandbox;

    setSaving(true);
    setErr(null);
    setCheckResult(null);
    const res = await updateAdminCourierAction(account.courier, payload);
    setSaving(false);
    if (!res.success) return setErr(res.error.message);
    setCreds({});
    setEnabled(res.data.is_enabled);
    setSandbox(res.data.is_sandbox);
    setOptions(Object.fromEntries(res.data.options.map((o) => [o.key, o.value === null || o.value === undefined ? "" : String(o.value)])));
    onSaved(res.data, `${res.data.label} saved.`);
  };

  const check = async () => {
    setChecking(true);
    setCheckResult(null);
    const res = await checkAdminCourierAction(account.courier);
    setChecking(false);
    setCheckResult(res.success ? { ok: true, message: res.data.message } : { ok: false, message: res.error.message });
  };

  return (
    <Card className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-50 text-primary ring-1 ring-brand-100 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              {account.label}
              {account.is_enabled ? <Badge tone="green">On</Badge> : <Badge tone="slate">Off</Badge>}
              {account.is_configured ? <Badge tone="blue">Set up</Badge> : <Badge tone="amber">Keys missing</Badge>}
              {account.supports_sandbox && account.is_sandbox && <Badge tone="amber">Test mode</Badge>}
            </h2>
            {account.updated_at && <p className="text-xs text-slate-500">Last changed {formatDateTime(account.updated_at)}</p>}
          </div>
        </div>
        <Toggle
          checked={enabled}
          disabled={!editable || saving || (!enabled && !willBeConfigured)}
          onChange={setEnabled}
          label="Use this courier"
          description={!enabled && !willBeConfigured ? "Enter the keys first" : enabled ? "Staff can ship with it" : "Hidden from staff"}
        />
      </div>

      {!account.supports_sandbox && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 ring-1 ring-amber-200 px-3 py-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {account.label} has no test mode and its API cannot cancel a booking: every parcel booked is real. Cancel a mistaken booking in the{" "}
            {account.label} panel.
          </span>
        </div>
      )}

      {account.supports_sandbox && (
        <Toggle
          checked={sandbox}
          disabled={!editable || saving}
          onChange={setSandbox}
          label="Test mode (sandbox)"
          description="Parcels go to the courier's test server and nobody collects them. Switch off to go live."
        />
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-slate-400" /> Keys
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {account.credentials.map((c) => {
            const id = `${account.courier}-${c.key}`;
            return (
              <Field
                key={c.key}
                label={c.label}
                htmlFor={id}
                hint={c.is_set ? "Saved. Leave empty to keep it, or type a new value to replace it." : "Not entered yet."}
              >
                <SecretInput
                  id={id}
                  secret={c.is_secret}
                  value={creds[c.key] ?? ""}
                  disabled={!editable || saving}
                  placeholder={c.is_set ? c.preview ?? "Saved" : `Enter the ${c.label.toLowerCase()}`}
                  onChange={(v) => setCreds((p) => ({ ...p, [c.key]: v }))}
                />
              </Field>
            );
          })}
        </div>
      </div>

      {account.options.map((o) => (
        <Field
          key={o.key}
          label={o.label}
          required={o.is_required}
          hint={
            storesError ??
            (!allKeysSaved ? "Save the keys first; the list comes from the courier." : "Pickup stores are created in the courier's own merchant panel.")
          }
        >
          <div className="flex gap-2">
            <Select
              value={options[o.key] ?? ""}
              disabled={!editable || saving || !stores}
              onChange={(e) => setOptions((p) => ({ ...p, [o.key]: e.target.value }))}
            >
              <option value="">{storesLoading ? "Loading stores…" : stores ? "Choose a pickup store" : o.value ? `Store #${o.value}` : "No stores loaded"}</option>
              {(stores ?? []).map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                  {st.address ? ` — ${st.address}` : ""}
                </option>
              ))}
              {/* Keep the saved store visible even if the courier's list no longer has it. */}
              {o.value && stores && !stores.some((st) => String(st.id) === String(o.value)) && <option value={String(o.value)}>Store #{o.value}</option>}
            </Select>
            <Button variant="secondary" icon={RefreshCw} loading={storesLoading} disabled={!allKeysSaved} onClick={loadStores} aria-label="Reload stores">
              Reload
            </Button>
          </div>
        </Field>
      ))}

      {account.webhook && (
        <div className="space-y-3 rounded-xl bg-slate-50/70 ring-1 ring-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Webhook className="w-4 h-4 text-slate-400" /> Parcel updates (webhook)
          </h3>
          <p className="text-xs text-slate-600">{WEBHOOK_HELP[account.courier] ?? "Give this address to the courier."} Orders then move to Delivered or Returned on their own.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CopyField label="Webhook address" value={account.webhook.url} />
            <CopyField label="Webhook secret" value={account.webhook.secret} />
          </div>
        </div>
      )}

      <InlineError message={err} />
      {checkResult && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ${
            checkResult.ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-rose-200"
          }`}
        >
          {checkResult.ok ? <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{checkResult.message}</span>
        </div>
      )}

      {editable && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            icon={ShieldCheck}
            loading={checking}
            disabled={!allKeysSaved || saving || dirty}
            title={dirty ? "Save your changes first" : !allKeysSaved ? "Save every key first" : undefined}
            onClick={check}
          >
            Check the keys
          </Button>
          <Button loading={saving} disabled={!dirty} onClick={save}>
            Save {account.label}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function CouriersManagement({ initial, initialError }: { initial: CourierAccount[]; initialError: string | null }) {
  const can = useCan();
  const [accounts, setAccounts] = useState(initial);
  const { notice, success, clear } = useNotice();
  const editable = can("couriers.update");

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        icon={Truck}
        title="Couriers"
        description="Connect Steadfast, Pathao and RedX so staff can book parcels straight from an order."
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />
      {!editable && (
        <p className="text-sm text-slate-500">You can see the courier settings but not change them. Keys are always masked.</p>
      )}
      {accounts.length === 0 ? (
        !initialError && (
          <Card>
            <EmptyState icon={Truck} title="No couriers available" description="The API returned no couriers. Check that the courier migration has run." />
          </Card>
        )
      ) : (
        accounts.map((a) => (
          <CourierCard
            key={`${a.courier}-${a.updated_at ?? ""}`}
            account={a}
            editable={editable}
            onSaved={(updated, message) => {
              setAccounts((list) => list.map((x) => (x.courier === updated.courier ? updated : x)));
              success(message);
            }}
          />
        ))
      )}
    </div>
  );
}
