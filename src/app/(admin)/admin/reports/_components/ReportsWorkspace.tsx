"use client";

import React, { useState } from "react";
import { BarChart3, Download, FileSpreadsheet, Play, RefreshCw } from "lucide-react";
import {
  ReportColumn,
  ReportExport,
  ReportResult,
  ReportType,
  getAdminReportAction,
  getAdminReportExportsAction,
  requestAdminReportExportAction,
} from "@/app/(admin)/actions/reports";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  NoticeBanner,
  PageHeader,
  Select,
  Spinner,
  TableShell,
  TBody,
  THead,
  td,
  th,
  useNotice,
} from "@/app/(admin)/components/ui";
import { downloadUrl, formatBytes, formatDate, formatDateTime, formatTaka, todayInput } from "@/app/(admin)/components/format";
import { cn } from "@/lib/utils";

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatCell(value: string | number | null | undefined, col: ReportColumn): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (col.type) {
    case "money":
      return formatTaka(Number(value));
    case "date":
      return formatDate(String(value));
    case "datetime":
      return formatDateTime(String(value).replace(" ", "T"));
    case "number":
    case "integer":
      return Number(value).toLocaleString("en-BD");
    case "percent":
      return `${Number(value)}%`;
    default:
      return String(value).replace(/_/g, " ");
  }
}

const isNumeric = (c: ReportColumn) => ["money", "number", "integer", "percent"].includes(c.type ?? "");

export function ReportsWorkspace({
  types,
  initialExports,
  initialError,
}: {
  types: ReportType[];
  initialExports: ReportExport[];
  initialError: string | null;
}) {
  const [type, setType] = useState(types[0]?.type ?? "sales");
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayInput());
  const [result, setResult] = useState<ReportResult | null>(null);
  const [running, setRunning] = useState(false);
  const [exports, setExports] = useState(initialExports);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const { notice, success, error, clear } = useNotice();

  const current = types.find((t) => t.type === type);
  const dated = current?.dated ?? true;
  const label = (t: string) => types.find((x) => x.type === t)?.label ?? t;

  const run = async () => {
    if (dated && from && to && to < from) return error("The end date must be on or after the start date.");
    setRunning(true);
    const res = await getAdminReportAction(type, dated ? { from, to } : undefined);
    setRunning(false);
    if (!res.success) return error(res.error.message);
    setResult(res.data);
  };

  const refreshExports = async () => {
    setRefreshing(true);
    const res = await getAdminReportExportsAction();
    setRefreshing(false);
    if (res.success) setExports(res.data.data);
  };

  const requestExport = async (format: "xlsx" | "csv" | "pdf") => {
    setExporting(format);
    const res = await requestAdminReportExportAction(type, { format, ...(dated ? { from, to } : {}) });
    setExporting(null);
    if (!res.success) return error(res.error.message);
    success(`${label(type)} export queued as ${format.toUpperCase()}. It appears below when ready.`);
    setTimeout(refreshExports, 2500);
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={BarChart3} title="Reports" description="Sales, stock, customer and tax figures, with spreadsheet and PDF exports." />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
          <Field label="Report">
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setResult(null);
              }}
            >
              {types.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} disabled={!dated} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} disabled={!dated} />
          </Field>
          <Button icon={Play} loading={running} onClick={run}>
            Run report
          </Button>
        </div>
        {!dated && <p className="mt-2 text-xs text-slate-500">This report shows the current position and ignores dates.</p>}
      </Card>

      {running ? (
        <Card className="flex justify-center py-12">
          <Spinner />
        </Card>
      ) : result ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{result.label}</h2>
              {result.range && (
                <p className="text-xs text-slate-500">
                  {formatDate(result.range.from)} – {formatDate(result.range.to)} · {result.rows.length} rows
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {(["xlsx", "csv", "pdf"] as const).map((f) => (
                <Button key={f} size="sm" variant="secondary" icon={FileSpreadsheet} loading={exporting === f} onClick={() => requestExport(f)}>
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {result.rows.length === 0 ? (
            <Card>
              <EmptyState icon={BarChart3} title="No data for this period" description="Try a wider date range." />
            </Card>
          ) : (
            <TableShell>
              <THead>
                {result.columns.map((c) => (
                  <th key={c.key} className={cn(th, isNumeric(c) && "text-right")}>
                    {c.label}
                  </th>
                ))}
              </THead>
              <TBody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    {result.columns.map((c) => (
                      <td key={c.key} className={cn(td, isNumeric(c) && "text-right tabular-nums")}>
                        {formatCell(row[c.key], c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </TBody>
              {result.totals && Object.keys(result.totals).length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    {result.columns.map((c, i) => (
                      <td key={c.key} className={cn(td, "font-bold text-slate-900", isNumeric(c) && "text-right tabular-nums")}>
                        {result.totals && c.key in result.totals ? formatCell(result.totals[c.key], c) : i === 0 ? "Total" : ""}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </TableShell>
          )}
        </div>
      ) : (
        <Card>
          <EmptyState icon={BarChart3} title="Choose a report and run it" description="Results appear here. Exports are prepared in the background." />
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Exported files</h2>
          <Button size="sm" variant="secondary" icon={RefreshCw} loading={refreshing} onClick={refreshExports}>
            Refresh
          </Button>
        </div>
        <TableShell>
          <THead>
            <th className={th}>Report</th>
            <th className={th}>Format</th>
            <th className={th}>Status</th>
            <th className={th}>Rows</th>
            <th className={th}>Size</th>
            <th className={th}>Requested</th>
            <th className={th}>Expires</th>
            <th className={`${th} text-right`}>File</th>
          </THead>
          <TBody>
            {exports.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={FileSpreadsheet} title="No exports yet" description="Run a report and choose a format to export it." />
                </td>
              </tr>
            ) : (
              exports.map((x) => (
                <tr key={x.id} className="hover:bg-slate-50/60">
                  <td className={`${td} font-medium text-slate-900`}>{label(x.type)}</td>
                  <td className={`${td} uppercase text-xs font-semibold`}>{x.format}</td>
                  <td className={td}>
                    <Badge tone={x.status === "ready" ? "green" : x.status === "failed" ? "red" : "amber"}>{x.status ?? "queued"}</Badge>
                    {x.error && <span className="block text-xs text-rose-600 mt-1">{x.error}</span>}
                  </td>
                  <td className={`${td} tabular-nums`}>{x.row_count ?? "—"}</td>
                  <td className={`${td} text-xs`}>{formatBytes(x.size_bytes)}</td>
                  <td className={`${td} text-xs`}>
                    {formatDateTime(x.created_at)}
                    {x.requested_by && <span className="block text-slate-400">{x.requested_by}</span>}
                  </td>
                  <td className={`${td} text-xs`}>{formatDateTime(x.expires_at)}</td>
                  <td className={`${td} text-right`}>
                    {x.is_downloadable ? (
                      <a
                        href={downloadUrl(`/admin/report-exports/${x.id}/download`)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Not ready</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </TBody>
        </TableShell>
      </section>
    </div>
  );
}
