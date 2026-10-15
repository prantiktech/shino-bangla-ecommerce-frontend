import React from "react";
import { ExternalLink, Truck } from "lucide-react";
import type { OrderTracking } from "@/app/(user)/actions/orders";

/** "Shipped with Steadfast · tracking code 15BAEB8A" with a link to the courier's tracking page (COURIERS.md §8). */
export function ParcelTracking({ tracking }: { tracking: OrderTracking | null | undefined }) {
  if (!tracking) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-900">
      <span className="flex items-start gap-3">
        <Truck className="w-5 h-5 mt-0.5 text-sky-600 shrink-0" />
        <span>
          Shipped with <strong>{tracking.courier}</strong>
          {tracking.tracking_code && (
            <>
              {" · "}tracking code <span className="font-mono font-bold select-all">{tracking.tracking_code}</span>
            </>
          )}
        </span>
      </span>
      {tracking.tracking_url && (
        <a
          href={tracking.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shrink-0"
        >
          Track your parcel
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
