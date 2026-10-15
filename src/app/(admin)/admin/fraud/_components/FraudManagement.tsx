"use client";

import React, { useState } from "react";
import { Ban, Eye, EyeOff, KeyRound, Plus, Search, ShieldAlert, Trash2, UserCheck } from "lucide-react";
import {
  createAdminContactRuleAction,
  deleteAdminContactRuleAction,
  getAdminContactRulesAction,
  lookupAdminFraudCheckAction,
  updateAdminFraudProviderAction,
} from "@/app/(admin)/actions/fraud";
import type { Paginated } from "@/app/(admin)/actions/_request";
import type { ContactRule, ContactRuleKind, ContactRuleType, FraudCheckResult, FraudProvider } from "@/types/admin-orders";
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
  LoadingRows,
  Modal,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  TableShell,
  TBody,
  THead,
  Tabs,
  Toggle,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { formatDateTime } from "@/app/(admin)/components/format";
import { FraudReport } from "@/app/(admin)/components/FraudReport";
import { isBdMobile, normaliseBdMobile } from "@/app/(admin)/components/order-meta";
import { useCan } from "@/app/(admin)/components/permissions";

type Tab = "lookup" | "rules" | "provider";

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]+$/i;
const isIp = (v: string) => IPV4.test(v) || (v.includes(":") && IPV6.test(v));

/* ------------------------------------------------------------------ */
/* Lookup                                                             */
/* ------------------------------------------------------------------ */

function LookupTab() {
  const [phone, setPhone] = useState("");
  const [askProvider, setAskProvider] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<FraudCheckResult | null>(null);
  const [lastPhone, setLastPhone] = useState("");

  const run = async (number: string, provider: boolean) => {
    setBusy(true);
    setErr(null);
    const res = await lookupAdminFraudCheckAction(number, provider);
    setBusy(false);
    if (!res.success) {
      setResult(null);
      return setErr(res.error.message);
    }
    setResult(res.data);
    setLastPhone(number);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = normaliseBdMobile(phone);
            if (!isBdMobile(n)) return setErr("Enter a Bangladeshi mobile number, e.g. 01712345678.");
            run(n, askProvider);
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <Field label="Mobile number" className="flex-1">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712345678" inputMode="tel" className="font-mono" />
            </Field>
            <Button type="submit" icon={Search} loading={busy}>
              Check number
            </Button>
          </div>
          <Toggle checked={askProvider} onChange={setAskProvider} label="Also ask the fraud-check provider" description="Uses a provider request; only works once one is connected." />
        </form>
      </Card>
      <InlineError message={err} />
      {result && (
        <Card>
          <FraudReport
            result={result}
            askingProvider={busy}
            onAskProvider={() => run(lastPhone, true)}
            onRuleChanged={() => run(lastPhone, false)}
          />
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocked and trusted contacts                                       */
/* ------------------------------------------------------------------ */

function RulesTab({ initial, initialError }: { initial: Paginated<ContactRule>; initialError: string | null }) {
  const can = useCan();
  const editable = can("fraud.update");
  const [list, setList] = useState(initial);
  const [filters, setFilters] = useState({ type: "", rule: "", q: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ type: ContactRuleType; value: string; rule: ContactRuleKind; reason: string }>({
    type: "phone",
    value: "",
    rule: "blocked",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ContactRule | null>(null);

  const load = async (f = filters, p = page) => {
    setLoading(true);
    const res = await getAdminContactRulesAction({ ...f, page: p });
    setLoading(false);
    if (res.success) setList(res.data);
    else error(res.error.message);
  };
  const debounced = useDebouncedCallback((f: typeof filters) => {
    setPage(1);
    load(f, 1);
  });
  const setFilter = (patch: Partial<typeof filters>, immediate = true) => {
    const f = { ...filters, ...patch };
    setFilters(f);
    if (immediate) {
      setPage(1);
      load(f, 1);
    } else debounced(f);
  };

  const save = async () => {
    const value = draft.type === "phone" ? normaliseBdMobile(draft.value) : draft.value.trim();
    if (draft.type === "phone" && !isBdMobile(value)) return setFormErr("Enter a Bangladeshi mobile number, e.g. 01712345678.");
    if (draft.type === "ip" && !isIp(value)) return setFormErr("Enter a valid IP address, e.g. 103.92.84.10.");
    setSaving(true);
    setFormErr(null);
    const res = await createAdminContactRuleAction({ type: draft.type, value, rule: draft.rule, reason: draft.reason });
    setSaving(false);
    if (!res.success) return setFormErr(res.error.message);
    setAdding(false);
    success(res.data.rule === "trusted" ? `${res.data.value} is now trusted.` : `${res.data.value} is now blocked.`);
    load(filters, 1);
    setPage(1);
  };

  const remove = async () => {
    if (!deleting) return;
    setSaving(true);
    const res = await deleteAdminContactRuleAction(deleting.id);
    setSaving(false);
    if (!res.success) error(res.error.message);
    else {
      setList((l) => ({ ...l, data: l.data.filter((r) => r.id !== deleting.id), meta: { ...l.meta, total: Math.max(0, l.meta.total - 1) } }));
      success("Rule removed.");
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchInput value={filters.q} onChange={(v) => setFilter({ q: v }, false)} placeholder="Search number, IP or reason" className="sm:w-72" />
          <Select value={filters.type} onChange={(e) => setFilter({ type: e.target.value })} className="sm:w-36" aria-label="Type">
            <option value="">Phones and IPs</option>
            <option value="phone">Phones</option>
            <option value="ip">IP addresses</option>
          </Select>
          <Select value={filters.rule} onChange={(e) => setFilter({ rule: e.target.value })} className="sm:w-36" aria-label="Rule">
            <option value="">Blocked and trusted</option>
            <option value="blocked">Blocked</option>
            <option value="trusted">Trusted</option>
          </Select>
        </div>
        {editable && (
          <Button
            icon={Plus}
            onClick={() => {
              setDraft({ type: "phone", value: "", rule: "blocked", reason: "" });
              setFormErr(null);
              setAdding(true);
            }}
          >
            Add rule
          </Button>
        )}
      </div>

      <TableShell>
        <THead>
          <th className={th}>Contact</th>
          <th className={th}>Rule</th>
          <th className={th}>Reason</th>
          <th className={th}>Added</th>
          <th className={`${th} text-right`}>
            <span className="sr-only">Actions</span>
          </th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={5} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={ShieldAlert} title="No rules" description="Blocked numbers and IPs cannot order; trusted numbers skip checkout protection." />
              </td>
            </tr>
          ) : (
            list.data.map((r) => (
              <tr key={r.id}>
                <td className={td}>
                  <span className="font-mono font-semibold text-slate-900">{r.value}</span>
                  <span className="block text-[11px] text-slate-500">{r.type === "ip" ? "IP address" : "Phone"}</span>
                </td>
                <td className={td}>
                  {r.rule === "blocked" ? (
                    <Badge tone="red">
                      <Ban className="w-3 h-3" /> Blocked
                    </Badge>
                  ) : (
                    <Badge tone="green">
                      <UserCheck className="w-3 h-3" /> Trusted
                    </Badge>
                  )}
                </td>
                <td className={`${td} text-slate-600 max-w-xs`}>{r.reason || <span className="text-slate-400">—</span>}</td>
                <td className={`${td} text-xs text-slate-500 whitespace-nowrap`}>
                  {formatDateTime(r.created_at)}
                  {r.created_by && <span className="block">by {r.created_by}</span>}
                </td>
                <td className={`${td} text-right`}>
                  {editable && <IconButton label={`Remove rule for ${r.value}`} icon={Trash2} tone="danger" onClick={() => setDeleting(r)} />}
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
          load(filters, p);
        }}
      />

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title="Add a rule"
        description="Blocked numbers and IPs are refused at checkout. Trusted numbers skip checkout protection."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} variant={draft.rule === "blocked" ? "danger" : "primary"} onClick={save}>
              {draft.rule === "blocked" ? "Block" : "Trust"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <InlineError message={formErr} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={draft.type}
                onChange={(e) => {
                  const type = e.target.value as ContactRuleType;
                  // Only phone numbers can be trusted.
                  setDraft((d) => ({ ...d, type, rule: type === "ip" ? "blocked" : d.rule }));
                }}
              >
                <option value="phone">Phone</option>
                <option value="ip">IP address</option>
              </Select>
            </Field>
            <Field label="Rule">
              <Select value={draft.rule} onChange={(e) => setDraft((d) => ({ ...d, rule: e.target.value as ContactRuleKind }))}>
                <option value="blocked">Block</option>
                {draft.type === "phone" && <option value="trusted">Trust</option>}
              </Select>
            </Field>
          </div>
          <Field label={draft.type === "phone" ? "Mobile number" : "IP address"} required>
            <Input
              value={draft.value}
              onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
              placeholder={draft.type === "phone" ? "01712345678" : "103.92.84.10"}
              className="font-mono"
            />
          </Field>
          <Field label="Reason" hint="Optional, up to 255 characters.">
            <Input value={draft.reason} maxLength={255} onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))} placeholder="Fake orders" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove this rule?"
        message={deleting ? `${deleting.value} will no longer be ${deleting.rule === "blocked" ? "blocked" : "trusted"}.` : ""}
        confirmLabel="Remove rule"
        loading={saving}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Provider settings                                                  */
/* ------------------------------------------------------------------ */

function ProviderCard({ provider, editable, onSaved }: { provider: FraudProvider; editable: boolean; onSaved: (p: FraudProvider) => void }) {
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [enabled, setEnabled] = useState(provider.is_enabled);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const typed = Object.fromEntries(Object.entries(creds).filter(([, v]) => v.trim() !== "").map(([k, v]) => [k, v.trim()]));
  const willBeConfigured = provider.credentials.every((c) => c.is_set || typed[c.key] || c.default);
  const dirty = Object.keys(typed).length > 0 || enabled !== provider.is_enabled;

  const save = async () => {
    if (enabled && !willBeConfigured) return setErr(`Enter every key ${provider.label} needs before switching it on.`);
    setSaving(true);
    setErr(null);
    setOk(null);
    const payload: { is_enabled?: boolean; credentials?: Record<string, string> } = {};
    if (Object.keys(typed).length) payload.credentials = typed;
    if (enabled !== provider.is_enabled) payload.is_enabled = enabled;
    const res = await updateAdminFraudProviderAction(provider.provider, payload);
    setSaving(false);
    if (!res.success) return setErr(res.error.message);
    setCreds({});
    setEnabled(res.data.is_enabled);
    setOk(`${res.data.label} saved.`);
    onSaved(res.data);
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {provider.label}
            {provider.is_enabled ? <Badge tone="green">On</Badge> : <Badge tone="slate">Off</Badge>}
            {provider.is_configured ? <Badge tone="blue">Set up</Badge> : <Badge tone="amber">Keys missing</Badge>}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Looks up a number&apos;s delivery record across couriers before you ship.</p>
        </div>
        <Toggle
          checked={enabled}
          disabled={!editable || saving || (!enabled && !willBeConfigured)}
          onChange={setEnabled}
          label="Use this provider"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {provider.credentials.map((c) => (
          <Field
            key={c.key}
            label={c.label}
            hint={c.is_set ? "Saved. Leave empty to keep it." : c.default ? `Default: ${c.default}` : "Not entered yet."}
          >
            <div className="relative">
              <Input
                type={c.is_secret && !shown[c.key] ? "password" : "text"}
                value={creds[c.key] ?? ""}
                disabled={!editable || saving}
                autoComplete="off"
                spellCheck={false}
                placeholder={c.is_set ? c.preview ?? "Saved" : c.default ?? `Enter the ${c.label.toLowerCase()}`}
                onChange={(e) => setCreds((p) => ({ ...p, [c.key]: e.target.value }))}
                className={c.is_secret ? "pr-10 font-mono" : "font-mono"}
              />
              {c.is_secret && (
                <IconButton
                  label={shown[c.key] ? "Hide" : "Show"}
                  icon={shown[c.key] ? EyeOff : Eye}
                  onClick={() => setShown((s) => ({ ...s, [c.key]: !s[c.key] }))}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                />
              )}
            </div>
          </Field>
        ))}
      </div>
      <InlineError message={err} />
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}
      {editable && (
        <div className="flex justify-end">
          <Button icon={KeyRound} loading={saving} disabled={!dirty} onClick={save}>
            Save {provider.label}
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function FraudManagement({
  initialRules,
  rulesError,
  initialProviders,
  providersError,
}: {
  initialRules: Paginated<ContactRule>;
  rulesError: string | null;
  initialProviders: FraudProvider[];
  providersError: string | null;
}) {
  const can = useCan();
  const [tab, setTab] = useState<Tab>("lookup");
  const [providers, setProviders] = useState(initialProviders);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShieldAlert}
        title="Fraud check"
        description="Check a customer's delivery record, block fake-order numbers and IPs, and connect a fraud-check provider."
      />
      <Tabs
        tabs={[
          { value: "lookup", label: "Check a number" },
          { value: "rules", label: "Blocked and trusted", count: initialRules.meta.total },
          { value: "provider", label: "Provider" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {/* Tabs stay mounted so a lookup result or the rules list survives switching back and forth. */}
      <div hidden={tab !== "lookup"}>
        <LookupTab />
      </div>
      <div hidden={tab !== "rules"}>
        <RulesTab initial={initialRules} initialError={rulesError} />
      </div>
      {tab === "provider" && (
        <div className="space-y-4 max-w-3xl">
          <InlineError message={providersError} />
          {providers.length === 0 && !providersError ? (
            <Card>
              <EmptyState icon={ShieldAlert} title="No providers available" />
            </Card>
          ) : (
            providers.map((p) => (
              <ProviderCard
                key={`${p.provider}-${p.updated_at ?? ""}`}
                provider={p}
                editable={can("fraud.update")}
                onSaved={(u) => setProviders((list) => list.map((x) => (x.provider === u.provider ? u : x)))}
              />
            ))
          )}
          <p className="text-xs text-slate-500">
            Checkout protection (refusing cash orders from numbers with a poor record) is switched on under Settings → Order protection.
          </p>
        </div>
      )}
    </div>
  );
}
