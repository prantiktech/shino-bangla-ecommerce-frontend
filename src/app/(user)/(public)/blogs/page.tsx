import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileText, Newspaper } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { getPagesAction } from "@/app/(user)/actions/content";

export const metadata: Metadata = {
  title: "Guides & Articles",
  description: "Buying guides, store policies and helpful articles from Nogod Bazar.",
};

export default async function BlogsPage() {
  const res = await getPagesAction();
  const pages = res.success ? res.data : [];

  return (
    <div className="pb-16">
      <Breadcrumb items={[{ label: "Guides & Articles" }]} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="max-w-2xl mb-8 md:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Nogod Bazar Journal</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink tracking-tight">
            Guides & Articles
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-500">
            Helpful guides, store information and policies to make shopping with us simple.
          </p>
        </header>

        {pages.length === 0 ? (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 py-16 px-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-primary flex items-center justify-center mb-4">
              <Newspaper className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-ink">No articles yet</h2>
            <p className="mt-1 text-sm text-slate-500">Check back soon for guides and updates.</p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors"
            >
              Continue shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/pages/${page.slug}`}
                  className="group h-full flex flex-col bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card hover:shadow-card-hover hover:ring-brand-200 transition-all p-6"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-50 text-primary flex items-center justify-center mb-5">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h2 className="text-base md:text-lg font-semibold text-ink group-hover:text-primary transition-colors leading-snug">
                    {page.title}
                  </h2>
                  <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read more
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
