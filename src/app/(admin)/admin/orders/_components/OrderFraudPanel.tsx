"use client";

import React, { useEffect, useState } from "react";
import { getAdminOrderFraudCheckAction, runAdminOrderFraudProviderAction } from "@/app/(admin)/actions/fraud";
import type { FraudCheckResult } from "@/types/admin-orders";
import { InlineError, Spinner } from "@/app/(admin)/components/ui";
import { FraudReport } from "@/app/(admin)/components/FraudReport";

/** The "Fraud check" tab of an order: loads on open, can also ask the outside provider. */
export function OrderFraudPanel({ orderId }: { orderId: number }) {
  const [result, setResult] = useState<FraudCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAdminOrderFraudCheckAction(orderId).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setResult(res.data);
        setError(null);
      } else setError(res.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, version]);

  const askProvider = async () => {
    setAsking(true);
    setProviderError(null);
    const res = await runAdminOrderFraudProviderAction(orderId);
    setAsking(false);
    if (!res.success) return setProviderError(res.error.message);
    // Keep the order block from the first answer if the provider's answer leaves it out.
    setResult((prev) => ({ ...res.data, order: res.data.order ?? prev?.order }));
  };

  if (error) return <InlineError message={error} />;
  if (!result) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <InlineError message={providerError} />
      <FraudReport result={result} onAskProvider={askProvider} askingProvider={asking} onRuleChanged={() => setVersion((v) => v + 1)} />
    </div>
  );
}
