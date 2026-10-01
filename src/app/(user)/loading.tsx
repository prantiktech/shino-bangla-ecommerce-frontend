/** Streaming fallback for storefront pages while their data loads. */
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-56 rounded-lg bg-slate-200/70 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white ring-1 ring-slate-200/70 p-3 space-y-3">
            <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
