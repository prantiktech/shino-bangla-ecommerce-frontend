import type { Metadata } from "next";
import { BadgePercent, Building2, Headphones, Truck } from "lucide-react";
import { getCheckoutLocationsAction } from "@/app/(user)/actions/checkout";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BusinessApplicationForm } from "./BusinessApplicationForm";

export const metadata: Metadata = {
  title: "Wholesale and business accounts",
  description: "Apply for wholesale prices: send your business details, trade licence and NID, and our team will contact you.",
};

const PERKS = [
  { icon: BadgePercent, title: "Wholesale prices", text: "Better prices on larger quantities." },
  { icon: Truck, title: "Bulk delivery", text: "Delivery anywhere in Bangladesh." },
  { icon: Headphones, title: "A dedicated contact", text: "One person who knows your account." },
];

export default async function WholesalePage() {
  const res = await getCheckoutLocationsAction();
  const districts = res.success
    ? (res.data as { id: number; name: string; district_name?: string }[]).map((d) => ({ id: d.id, name: d.district_name ?? d.name }))
    : [];

  return (
    <>
      <Breadcrumb items={[{ label: "Wholesale" }]} />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="max-w-2xl mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Building2 className="w-4 h-4" /> For businesses
          </span>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink tracking-tight">Apply for a wholesale account</h1>
          <p className="mt-2 text-slate-500">
            Buying for an office, a shop or a project? Send us your business details and documents. Our team checks every application and gets
            in touch, usually within two working days.
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-6 sm:p-8">
            {districts.length === 0 && (
              <p role="alert" className="mb-6 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3.5 py-2.5 text-sm text-amber-800">
                We could not load the list of districts. Please refresh the page before applying.
              </p>
            )}
            <BusinessApplicationForm districts={districts} />
          </div>
          <aside className="space-y-3 lg:sticky lg:top-24">
            {PERKS.map((p) => (
              <div key={p.title} className="flex items-start gap-3 bg-white rounded-2xl ring-1 ring-slate-200/70 p-5">
                <p.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{p.title}</span>
                  <span className="block text-sm text-slate-500">{p.text}</span>
                </span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
