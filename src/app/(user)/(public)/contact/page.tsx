import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettingsAction } from "@/app/(user)/actions/settings";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about an order or a product? Send Nogod Bazar a message.",
};

export default async function ContactPage() {
  const res = await getSettingsAction();
  const s = res.success ? res.data : null;

  return (
    <>
      <Breadcrumb items={[{ label: "Contact us" }]} />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="max-w-2xl mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Contact us</h1>
          <p className="mt-2 text-slate-500">
            Questions about an order, a product or delivery? Send us a message and we&apos;ll reply as soon as we can.
            You may also find a quick answer in our{" "}
            <Link href="/faq" className="text-primary font-medium hover:underline">
              FAQs
            </Link>
            .
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-6 sm:p-8">
            <ContactForm />
          </div>
          <aside className="space-y-3">
            {s?.store_phone && (
              <a href={`tel:${s.store_phone.replace(/\s/g, "")}`} className="flex items-start gap-3 bg-white rounded-2xl ring-1 ring-slate-200/70 p-5 hover:ring-brand-200">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Call us</span>
                  <span className="block text-sm text-slate-600">{s.store_phone}</span>
                </span>
              </a>
            )}
            {s?.store_email && (
              <a href={`mailto:${s.store_email}`} className="flex items-start gap-3 bg-white rounded-2xl ring-1 ring-slate-200/70 p-5 hover:ring-brand-200">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Email</span>
                  <span className="block text-sm text-slate-600 break-all">{s.store_email}</span>
                </span>
              </a>
            )}
            {s?.store_address && (
              <div className="flex items-start gap-3 bg-white rounded-2xl ring-1 ring-slate-200/70 p-5">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Visit</span>
                  <span className="block text-sm text-slate-600 whitespace-pre-line">{s.store_address}</span>
                </span>
              </div>
            )}
            <div className="flex items-start gap-3 bg-white rounded-2xl ring-1 ring-slate-200/70 p-5">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <span>
                <span className="block text-sm font-semibold text-slate-900">Support hours</span>
                <span className="block text-sm text-slate-600">9 AM – 10 PM, every day</span>
              </span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
