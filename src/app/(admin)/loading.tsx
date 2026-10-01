/** Streaming fallback for admin screens while their data loads. */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-200/70 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-slate-200/70 animate-pulse" />
          <div className="h-3 w-72 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-5 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
