import React from "react";
import { Truck } from "lucide-react";
import { getShippingZonesAction } from "@/app/(user)/actions/checkout";
import { formatPoisha } from "@/lib/utils/money";

/** Delivery charges and times per zone, from the public shipping zones endpoint. */
export async function DeliveryInfo() {
  const res = await getShippingZonesAction();
  const zones = res.success ? res.data : [];
  if (zones.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pb-10">
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-5 md:p-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          Delivery options
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((z) => {
            const charges = z.rates.map((r) => r.charge);
            const min = charges.length ? Math.min(...charges) : 0;
            const max = charges.length ? Math.max(...charges) : 0;
            return (
              <li key={z.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{z.name}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {min === max ? formatPoisha(min) : `${formatPoisha(min)} – ${formatPoisha(max)}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {z.delivery_days_min}–{z.delivery_days_max} days
                  {z.free_above ? ` · free over ${formatPoisha(z.free_above)}` : ""}
                  {z.districts?.length ? ` · ${z.districts.slice(0, 3).join(", ")}${z.districts.length > 3 ? "…" : ""}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
