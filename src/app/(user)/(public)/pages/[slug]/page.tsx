import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlugAction } from "@/app/(user)/actions/content";
import { Breadcrumb } from "@/components/common/Breadcrumb";

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getPageBySlugAction(slug);
  if (!res.success) return { title: "Page not found" };
  return {
    title: res.data.seo_title || res.data.title,
    description: res.data.seo_description || undefined,
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  const res = await getPageBySlugAction(slug);
  if (!res.success) notFound();

  const page = res.data;
  const updated = page.updated_at ? new Date(page.updated_at) : null;

  return (
    <>
      <Breadcrumb items={[{ label: page.title }]} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-6 sm:p-10">
        <header className="pb-6 mb-6 border-b border-slate-100">
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{page.title}</h1>
          {updated && !Number.isNaN(updated.getTime()) && (
            <p className="mt-2 text-sm text-slate-500">
              Last updated{" "}
              {updated.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </header>
        {/* Content is HTML authored by store staff in the admin CMS. */}
        <div className="cms-content" dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
      </div>
    </>
  );
}
