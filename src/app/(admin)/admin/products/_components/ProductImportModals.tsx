"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, ImageIcon, Upload, XCircle } from "lucide-react";
import {
  BulkImageResult,
  ProductImport,
  bulkUploadProductImagesAction,
  getAdminProductImportAction,
  importAdminProductsAction,
} from "@/app/(admin)/actions/products";
import { Badge, Button, InlineError, Modal, Spinner } from "@/app/(admin)/components/ui";
import { downloadUrl, formatBytes } from "@/app/(admin)/components/format";

const RUNNING = ["pending", "queued", "processing", "running"];

/* ------------------------------------------------------------------ */
/* Spreadsheet import                                                 */
/* ------------------------------------------------------------------ */

export function ImportProductsModal({
  open,
  onClose,
  onFinished,
}: {
  open: boolean;
  onClose: () => void;
  onFinished: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<ProductImport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stopPolling, []);

  const poll = (id: number) => {
    timer.current = setTimeout(async () => {
      const res = await getAdminProductImportAction(id);
      if (!res.success) return setErr(res.error.message);
      setJob(res.data);
      if (RUNNING.includes(res.data.status)) poll(id);
      else finish(res.data);
    }, 2000);
  };

  const finish = (j: ProductImport) => {
    if (j.status === "completed") {
      onFinished(
        `Import finished: ${j.products_created ?? 0} created, ${j.products_updated ?? 0} updated${j.rows_failed ? `, ${j.rows_failed} rows refused` : ""}.`
      );
    }
  };

  const upload = async () => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setErr("The file must be 20 MB or smaller.");
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await importAdminProductsAction(fd);
    setUploading(false);
    if (!res.success) return setErr(res.error.message);
    setJob(res.data);
    if (RUNNING.includes(res.data.status)) poll(res.data.id);
    else finish(res.data);
  };

  const close = () => {
    stopPolling();
    setFile(null);
    setJob(null);
    setErr(null);
    onClose();
  };

  const running = job && RUNNING.includes(job.status);
  const errors = (job?.errors ?? []) as (string | { row?: number; message?: string; errors?: string[] })[];

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import products"
      description="Create or update products in bulk from a spreadsheet. Rows are matched to existing products by SKU."
      size="lg"
      footer={
        job && !running ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button icon={Upload} loading={uploading || !!running} disabled={!file} onClick={upload}>
              {running ? "Importing…" : "Start import"}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">1. Download the template</p>
            <p className="text-xs text-slate-500">Fill one row per variant. Keep the column headings.</p>
          </div>
          <div className="flex gap-2">
            <a
              href={downloadUrl("/admin/product-imports/template", { format: "xlsx" })}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white ring-1 ring-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </a>
            <a
              href={downloadUrl("/admin/product-imports/template", { format: "csv" })}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white ring-1 ring-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </a>
          </div>
        </div>

        {!job && (
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">2. Upload the completed file</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 px-4 py-8 flex flex-col items-center gap-2 text-slate-500 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
              {file ? (
                <span className="text-sm font-medium text-slate-800">
                  {file.name} <span className="text-slate-400">({formatBytes(file.size)})</span>
                </span>
              ) : (
                <span className="text-sm">Choose a .xlsx, .csv or .txt file (up to 20 MB)</span>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErr(null);
              }}
            />
          </div>
        )}

        <InlineError message={err} />

        {job && (
          <div className="rounded-xl ring-1 ring-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{job.file}</span>
              <Badge tone={job.status === "completed" ? "green" : job.status === "failed" ? "red" : "amber"}>
                {running && <Spinner className="w-3 h-3" />}
                {job.status}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                ["Rows", job.total_rows],
                ["Created", job.products_created],
                ["Updated", job.products_updated],
                ["Refused", job.rows_failed],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg bg-slate-50 py-2">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-lg font-bold tabular-nums text-slate-900">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {errors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1.5">Refused rows</p>
                <ul className="max-h-48 overflow-y-auto text-xs text-rose-700 bg-rose-50 rounded-lg p-3 space-y-1">
                  {errors.map((e, i) => (
                    <li key={i}>
                      {typeof e === "string"
                        ? e
                        : `${e.row ? `Row ${e.row}: ` : ""}${e.message ?? (e.errors ?? []).join(" ")}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Bulk images matched to SKUs                                        */
/* ------------------------------------------------------------------ */

export function BulkImagesModal({
  open,
  onClose,
  onFinished,
}: {
  open: boolean;
  onClose: () => void;
  onFinished: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<BulkImageResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const choose = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length > 20) setErr("Up to 20 images at a time. The first 20 were kept.");
    else setErr(null);
    const tooBig = picked.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) setErr(`${tooBig.name} is larger than 5 MB.`);
    setFiles(picked.slice(0, 20).filter((f) => f.size <= 5 * 1024 * 1024));
  };

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    files.forEach((f) => fd.append("files[]", f));
    const res = await bulkUploadProductImagesAction(fd);
    setBusy(false);
    if (!res.success) return setErr(res.error.message);
    setResults(res.data);
    const ok = res.data.filter((r) => r.status !== "skipped" && r.status !== "failed").length;
    if (ok) onFinished(`${ok} image${ok === 1 ? "" : "s"} attached to products.`);
  };

  const close = () => {
    setFiles([]);
    setResults(null);
    setErr(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Bulk product images"
      description="Name each file after the variant SKU (for example FE-ABC-1KG.jpg). Each image is attached to the matching product."
      size="lg"
      footer={
        results ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button icon={Upload} loading={busy} disabled={!files.length} onClick={upload}>
              Upload {files.length || ""} image{files.length === 1 ? "" : "s"}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <InlineError message={err} />
        {!results && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 px-4 py-8 flex flex-col items-center gap-2 text-slate-500 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <span className="text-sm">Choose up to 20 JPG, PNG or WebP images (5 MB each)</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => choose(e.target.files)}
            />
            {files.length > 0 && (
              <ul className="rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {files.map((f) => (
                  <li key={f.name} className="flex justify-between px-4 py-2 text-sm">
                    <span className="font-mono text-slate-700 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400">{formatBytes(f.size)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {results && (
          <ul className="rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {results.map((r) => {
              const ok = r.status !== "skipped" && r.status !== "failed";
              return (
                <li key={r.file} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                  {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-500 mt-0.5" />}
                  <span className="min-w-0">
                    <span className="block font-mono text-slate-800 truncate">{r.file}</span>
                    {r.message && <span className="block text-xs text-slate-500">{r.message}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
