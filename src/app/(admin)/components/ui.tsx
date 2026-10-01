"use client";

/**
 * Back-office UI kit. Every admin screen builds from these pieces so spacing,
 * colour, form controls and feedback look and behave the same everywhere.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "../actions/_request";
import { deleteAdminMediaAction, uploadAdminMediaAction } from "../actions/media";

/* ------------------------------------------------------------------ */
/* Buttons                                                            */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-xs",
  secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon: Icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        BUTTON_VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  icon: Icon,
  tone = "default",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "danger" | "primary";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 cursor-pointer",
        tone === "danger"
          ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          : tone === "primary"
          ? "text-slate-400 hover:text-primary hover:bg-brand-50"
          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
        className
      )}
      {...rest}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="w-11 h-11 rounded-xl bg-brand-50 text-primary ring-1 ring-brand-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-2xs", padded && "p-5", className)}>
      {children}
    </div>
  );
}

const STAT_TONES = {
  slate: "bg-slate-100 text-slate-600",
  orange: "bg-brand-50 text-primary",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-sky-50 text-sky-600",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", STAT_TONES[tone])}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                           */
/* ------------------------------------------------------------------ */

export type Notice = { type: "success" | "error"; message: string } | null;

/** Page-level success / error banner with auto-dismiss for successes. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => setNotice(null), []);
  const success = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ type: "success", message });
    timer.current = setTimeout(() => setNotice(null), 4000);
  }, []);
  const error = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ type: "error", message });
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { notice, success, error, clear };
}

export function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  const ok = notice.type === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ring-1",
        ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-rose-200"
      )}
    >
      <div className="flex items-start gap-2.5">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
        )}
        <span>{notice.message}</span>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="p-0.5 rounded hover:bg-black/5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 ring-1 ring-rose-200 px-3 py-2.5 text-sm text-rose-700">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const BADGE_TONES = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  orange: "bg-brand-50 text-brand-700 ring-brand-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "slate", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap",
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-14 px-6 text-center">
      {Icon && (
        <span className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("w-5 h-5 animate-spin text-slate-400", className)} />;
}

export function LoadingRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3.5 rounded bg-slate-100 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                             */
/* ------------------------------------------------------------------ */

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap";
export const td = "px-4 py-3 text-sm text-slate-700 align-middle";

export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-2xs overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-50/80 border-b border-slate-200/80">
      <tr>{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Pagination({
  meta,
  onPageChange,
  disabled,
}: {
  meta: PaginationMeta | null | undefined;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (!meta || meta.last_page <= 1) {
    return meta && meta.total > 0 ? (
      <p className="text-xs text-slate-500 px-1">
        {meta.total} {meta.total === 1 ? "record" : "records"}
      </p>
    ) : null;
  }
  const { current_page: page, last_page: last, total } = meta;
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of {last} · {total} records
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={disabled || page >= last} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto max-w-full">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "px-3.5 h-8 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer",
            value === t.value ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                            */
/* ------------------------------------------------------------------ */

const MODAL_SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" } as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof MODAL_SIZES;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]",
          MODAL_SIZES[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          <IconButton label="Close" icon={X} onClick={onClose} />
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 sm:rounded-b-2xl flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  loading,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600 space-y-3">
        <div>{message}</div>
        {children}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                      */
/* ------------------------------------------------------------------ */

const controlBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({
  label,
  required,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlBase, "h-10", className)} {...rest} />;
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlBase, "py-2.5 leading-relaxed", className)} {...rest} />;
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(controlBase, "h-10 pr-8 cursor-pointer", className)} {...rest}>
        {children}
      </select>
    );
  }
);

/** Taka input that reads and writes poisha. */
export function MoneyInput({
  value,
  onChange,
  placeholder = "0.00",
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (taka: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">৳</span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pl-7 tabular-nums"
        {...rest}
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start gap-3 select-none", disabled ? "opacity-60" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

/** Debounced callback: returns a function that fires `fn` after `delay` ms of quiet. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 350) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return useCallback(
    (...args: A) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}

/* ------------------------------------------------------------------ */
/* Media                                                              */
/* ------------------------------------------------------------------ */

export interface MediaValue {
  id: number;
  url: string;
}

async function uploadFile(file: File): Promise<{ ok: true; media: MediaValue } | { ok: false; message: string }> {
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "Images must be 5 MB or smaller." };
  const fd = new FormData();
  fd.append("file", file);
  const res = await uploadAdminMediaAction(fd);
  if (!res.success) return { ok: false, message: res.error.message || "Upload failed." };
  return { ok: true, media: { id: res.data.id, url: res.data.url } };
}

/** Single image upload with preview. Value is a media id + url. */
export function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  aspect = "aspect-square",
  className,
}: {
  value: MediaValue | null;
  onChange: (v: MediaValue | null) => void;
  label?: string;
  aspect?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Uploads made while this form is open; removing one deletes the unsaved file from the server.
  const fresh = useRef<Set<number>>(new Set());

  const discard = (m: MediaValue | null) => {
    if (m && fresh.current.has(m.id)) {
      fresh.current.delete(m.id);
      void deleteAdminMediaAction(m.id);
    }
  };

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    const r = await uploadFile(file);
    setBusy(false);
    if (r.ok) {
      discard(value);
      fresh.current.add(r.media.id);
      onChange(r.media);
    } else setErr(r.message);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 group",
          aspect
        )}
      >
        {value?.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  discard(value);
                  onChange(null);
                }}
              >
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-primary hover:bg-brand-50/50 transition-colors cursor-pointer"
          >
            {busy ? <Spinner /> : <ImagePlus className="w-6 h-6" />}
            <span className="text-xs font-medium">{busy ? "Uploading…" : label}</span>
          </button>
        )}
        {busy && value?.url && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}

/** Multi-image gallery uploader with reorder-by-remove. */
export function GalleryUpload({
  value,
  onChange,
  max = 20,
}: {
  value: MediaValue[];
  onChange: (v: MediaValue[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fresh = useRef<Set<number>>(new Set());

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    const added: MediaValue[] = [];
    for (const f of Array.from(files).slice(0, max - value.length)) {
      const r = await uploadFile(f);
      if (r.ok) {
        fresh.current.add(r.media.id);
        added.push(r.media);
      } else setErr(r.message);
    }
    setBusy(false);
    onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {value.map((m, i) => (
          <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                if (fresh.current.has(m.id)) {
                  fresh.current.delete(m.id);
                  void deleteAdminMediaAction(m.id);
                }
                onChange(value.filter((_, j) => j !== i));
              }}
              aria-label="Remove image"
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 text-slate-600 hover:text-rose-600 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary hover:border-brand-200 transition-colors cursor-pointer"
          >
            {busy ? <Spinner /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-[11px] font-medium">{busy ? "Uploading" : "Add"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rich text (HTML) editor with preview                               */
/* ------------------------------------------------------------------ */

export function HtmlEditor({
  value,
  onChange,
  rows = 10,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-2 py-1.5">
        <div className="flex gap-1">
          {(["edit", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 h-7 rounded-md text-xs font-semibold capitalize cursor-pointer",
                mode === m ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-400">HTML supported</span>
      </div>
      {mode === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm font-mono leading-relaxed text-slate-800 focus:outline-none resize-y"
        />
      ) : (
        <div
          className="cms-content px-4 py-3 min-h-[160px] max-h-[420px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: value || "<p class='text-slate-400'>Nothing to preview.</p>" }}
        />
      )}
    </div>
  );
}
