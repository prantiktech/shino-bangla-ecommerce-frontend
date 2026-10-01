/** Formatting helpers for the back office. Money from the API is integer poisha (৳1 = 100). */

const takaFormatter = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 125000 -> "৳1,250" */
export function formatTaka(poisha: number | string | null | undefined): string {
  const n = Number(poisha ?? 0);
  if (!Number.isFinite(n)) return "৳0";
  return `৳${takaFormatter.format(n / 100)}`;
}

/** Poisha -> taka number for form inputs. */
export function poishaToTaka(poisha: number | null | undefined): string {
  if (poisha === null || poisha === undefined || Number.isNaN(Number(poisha))) return "";
  return String(Number(poisha) / 100);
}

/** Taka string from an input -> integer poisha, or null when empty. */
export function takaToPoisha(taka: string | number | null | undefined): number | null {
  if (taka === null || taka === undefined || taka === "") return null;
  const n = Number(taka);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Basis points -> percent string: 1500 -> "15" */
export function bpToPercent(bp: number | null | undefined): string {
  if (bp === null || bp === undefined) return "";
  return String(Number(bp) / 100);
}

export function percentToBp(percent: string | number | null | undefined): number | null {
  if (percent === null || percent === undefined || percent === "") return null;
  const n = Number(percent);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO -> value for <input type="datetime-local"> in local time. */
export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value -> ISO string (or null). */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO -> "YYYY-MM-DD" */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function todayInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Build a link to the authenticated file-download proxy. */
export function downloadUrl(path: string, query?: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams({ path });
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
  }
  return `/api/admin/download?${params.toString()}`;
}
