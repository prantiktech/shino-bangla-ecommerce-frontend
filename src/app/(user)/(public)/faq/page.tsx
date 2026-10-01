import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { getFaqsAction } from "@/app/(user)/actions/content";
import { Breadcrumb } from "@/components/common/Breadcrumb";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about ordering, delivery, payment and returns at Nogod Bazar.",
};

export default async function FaqPage() {
  const res = await getFaqsAction();
  const faqs = res.success ? res.data : [];

  const groups = new Map<string, typeof faqs>();
  for (const f of [...faqs].sort((a, b) => (a.position ?? a.sort_order ?? 0) - (b.position ?? b.sort_order ?? 0))) {
    const g = f.group || f.category || "General";
    groups.set(g, [...(groups.get(g) ?? []), f]);
  }

  // FAQ structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/<[^>]+>/g, "") },
    })),
  };

  return (
    <>
      <Breadcrumb items={[{ label: "FAQs" }]} />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Frequently asked questions</h1>
          <p className="mt-2 text-slate-500">
            Can&apos;t find what you need?{" "}
            <Link href="/contact" className="text-primary font-medium hover:underline">
              Contact us
            </Link>
            .
          </p>
        </header>

        {faqs.length === 0 ? (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-10 text-center">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-600">No questions have been published yet.</p>
            <Link href="/contact" className="mt-5 inline-flex h-10 items-center px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover">
              Ask us a question
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([group, items]) => (
              <section key={group} className="space-y-3">
                {groups.size > 1 && <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{group}</h2>}
                <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 divide-y divide-slate-100">
                  {items.map((f, i) => (
                    <details key={f.id ?? i} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                        <span className="text-sm md:text-base font-semibold text-slate-900">{f.question}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="cms-content mt-3 text-sm" dangerouslySetInnerHTML={{ __html: f.answer }} />
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
}
