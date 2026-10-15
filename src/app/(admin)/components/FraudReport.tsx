"use client";

/**
 * A fraud-check verdict for one phone number: the shop's own delivery history, any blocked/trusted rule,
 * what checkout protection would do, and the outside provider's answer when it has been asked.
 */
import React, { useState } from "react";
import { Ban, CheckCircle2, Globe, ShieldAlert, ShieldCheck, ShieldQuestion, UserCheck } from "lucide-react";
import { createAdminContactRuleAction } from "../actions/fraud";
import type { ContactRuleKind, ContactRuleType, FraudCheckResult } from "@/types/admin-orders";
import { Badge, Button, Field, InlineError, Input, Modal, Select } from "./ui";
import { useCan } from "./permissions";
import { cn } from "@/lib/utils";

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "green" | "red" | "amber" }) {
  return (
    <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200/70 px-3 py-2">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div
        className={cn(
          "text-base font-bold tabular-nums",
          tone === "green" ? "text-emerald-700" : tone === "red" ? "text-rose-700" : tone === "amber" ? "text-amber-700" : "text-slate-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ruleKind(rule: FraudCheckResult["rule"]): ContactRuleKind | null {
  if (!rule || typeof rule !== "object") return null;
  return rule.rule === "blocked" || rule.rule === "trusted" ? rule.rule : null;
}

/** Provider answers are the provider's own shape; show their simple values and keep the rest readable. */
function ProviderDetails({ provider }: { provider: FraudCheckResult["provider"] }) {
  const entries = Object.entries(provider).filter(([k]) => k !== "connected" && k !== "checked");
  if (entries.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-2">
      {entries.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</dt>
          <dd className="text-slate-800 break-words">
            {v === null || v === undefined ? (
              "—"
            ) : typeof v === "object" ? (
              <pre className="whitespace-pre-wrap font-mono text-[11px] bg-slate-50 rounded p-1.5 max-h-40 overflow-auto">{JSON.stringify(v, null, 2)}</pre>
            ) : (
              String(v)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function FraudReport({
  result,
  onAskProvider,
  askingProvider,
  onRuleChanged,
}: {
  result: FraudCheckResult;
  /** Shown when a provider is connected and hasn't been asked for this check yet. */
  onAskProvider?: () => void;
  askingProvider?: boolean;
  /** Called after a block/trust rule is added from here, so the caller can re-run the check. */
  onRuleChanged?: () => void;
}) {
  const can = useCan();
  const kind = ruleKind(result.rule);
  const reason = result.rule && typeof result.rule === "object" ? result.rule.reason : null;
  const { shop, checkout, provider } = result;
  const rate = shop.success_rate;

  const [ruleDraft, setRuleDraft] = useState<{ type: ContactRuleType; value: string; rule: ContactRuleKind } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saveRule = async () => {
    if (!ruleDraft) return;
    setSaving(true);
    setErr(null);
    const res = await createAdminContactRuleAction({ ...ruleDraft, reason: reasonText });
    setSaving(false);
    if (!res.success) return setErr(res.error.message);
    setRuleDraft(null);
    onRuleChanged?.();
  };

  const openRule = (type: ContactRuleType, value: string, rule: ContactRuleKind) => {
    setRuleDraft({ type, value, rule });
    setReasonText("");
    setErr(null);
  };

  const verdict = kind === "blocked"
    ? { icon: ShieldAlert, tone: "bg-rose-50 text-rose-800 ring-rose-200", text: "This number is blocked from ordering." }
    : kind === "trusted"
    ? { icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", text: "This number is trusted; checkout protection skips it." }
    : checkout.would_block
    ? { icon: ShieldAlert, tone: "bg-amber-50 text-amber-800 ring-amber-200", text: "Checkout protection would refuse a cash order from this number." }
    : { icon: ShieldQuestion, tone: "bg-slate-50 text-slate-700 ring-slate-200", text: "No warning signs from the shop's own history." };

  return (
    <div className="space-y-4">
      <div className={cn("flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ring-1", verdict.tone)}>
        <verdict.icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{verdict.text}</p>
          <p className="text-xs opacity-80 mt-0.5">
            <span className="font-mono">{result.phone}</span>
            {reason && <> · {reason}</>}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Orders from this number at the shop</h4>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <Stat label="Orders" value={shop.orders} />
          <Stat label="Delivered" value={shop.delivered} tone={shop.delivered ? "green" : undefined} />
          <Stat label="Returned" value={shop.returned} tone={shop.returned ? "red" : undefined} />
          <Stat label="Cancelled" value={shop.cancelled} tone={shop.cancelled ? "amber" : undefined} />
          <Stat label="In progress" value={shop.in_progress} />
          <Stat
            label="Success rate"
            value={rate === null ? "—" : `${Math.round(rate)}%`}
            tone={rate === null ? undefined : rate >= checkout.min_success_rate ? "green" : "red"}
          />
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-slate-200 p-3.5 text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800 text-sm">Checkout protection</p>
        {checkout.courier_protection ? (
          <p>
            On: cash orders are refused below a {checkout.min_success_rate}% success rate once a number has {checkout.min_parcels} finished
            parcels.{" "}
            {checkout.would_block ? (
              <Badge tone="red">Would refuse</Badge>
            ) : (
              <Badge tone="green">
                <CheckCircle2 className="w-3 h-3" /> Would allow
              </Badge>
            )}
          </p>
        ) : (
          <p>Off. It can be switched on under Settings → Order protection.</p>
        )}
      </div>

      <div className="rounded-xl ring-1 ring-slate-200 p-3.5 text-xs text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-400" /> Fraud-check provider
          </p>
          {provider.connected && !provider.checked && onAskProvider && (
            <Button size="sm" variant="secondary" loading={askingProvider} onClick={onAskProvider}>
              Ask the provider
            </Button>
          )}
        </div>
        {!provider.connected ? (
          <p className="mt-1">Not connected. The shop&apos;s own history is shown above. A provider can be set up under Fraud check.</p>
        ) : !provider.checked ? (
          <p className="mt-1">Connected. Ask it for this number&apos;s record with other shops and couriers.</p>
        ) : (
          <ProviderDetails provider={provider} />
        )}
      </div>

      {result.order && (
        <div className="rounded-xl ring-1 ring-slate-200 p-3.5 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500">Customer&apos;s IP </span>
            <span className="font-mono font-semibold text-slate-800">{result.order.customer_ip ?? "—"}</span>
          </div>
          <div>
            <span className="text-slate-500">Request IP </span>
            <span className="font-mono font-semibold text-slate-800">{result.order.ip_address ?? "—"}</span>
          </div>
        </div>
      )}

      {can("fraud.update") && (
        <div className="flex flex-wrap gap-2 pt-1">
          {kind !== "blocked" && (
            <Button size="sm" variant="secondary" icon={Ban} onClick={() => openRule("phone", result.phone, "blocked")}>
              Block this number
            </Button>
          )}
          {kind !== "trusted" && (
            <Button size="sm" variant="secondary" icon={UserCheck} onClick={() => openRule("phone", result.phone, "trusted")}>
              Trust this number
            </Button>
          )}
          {result.order?.customer_ip && (
            <Button size="sm" variant="ghost" icon={Ban} onClick={() => openRule("ip", result.order!.customer_ip!, "blocked")}>
              Block IP {result.order.customer_ip}
            </Button>
          )}
        </div>
      )}

      <Modal
        open={!!ruleDraft}
        onClose={() => !saving && setRuleDraft(null)}
        title={ruleDraft?.rule === "trusted" ? "Trust this number" : ruleDraft?.type === "ip" ? "Block this IP address" : "Block this number"}
        description={
          ruleDraft?.rule === "trusted"
            ? "Trusted numbers skip checkout protection."
            : "Orders from it are refused at checkout. Existing orders are not changed."
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRuleDraft(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant={ruleDraft?.rule === "trusted" ? "primary" : "danger"} loading={saving} onClick={saveRule}>
              Save rule
            </Button>
          </>
        }
      >
        {ruleDraft && (
          <div className="space-y-3">
            <InlineError message={err} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={ruleDraft.type} disabled>
                  <option value="phone">Phone</option>
                  <option value="ip">IP address</option>
                </Select>
              </Field>
              <Field label="Value">
                <Input value={ruleDraft.value} disabled className="font-mono" />
              </Field>
            </div>
            <Field label="Reason" hint="Optional, for your team. Up to 255 characters.">
              <Input
                value={reasonText}
                maxLength={255}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={ruleDraft.rule === "trusted" ? "Called, genuine" : "Fake orders"}
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
