"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  FileText,
  Clock,
  Laptop,
  Globe,
  Tag,
  Boxes,
} from "lucide-react";
import {
  ActivityLogItem,
  ActivityLogListResponse,
  ActivityLogFilters,
} from "@/types/activity-log";
import {
  getActivityLogsAction,
  getRecordActivityLogAction,
} from "@/app/(admin)/actions/activity-log";

interface ActivityLogManagementProps {
  initialData: ActivityLogListResponse;
  initialFilters: ActivityLogFilters;
}

export function ActivityLogManagement({
  initialData,
  initialFilters,
}: ActivityLogManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Logs list and metadata
  const [logsData, setLogsData] = useState<ActivityLogListResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [logFilter, setLogFilter] = useState(initialFilters.log || "all");
  const [eventFilter, setEventFilter] = useState(initialFilters.event || "all");
  const [subjectType, setSubjectType] = useState(initialFilters.subject_type || "");
  const [subjectId, setSubjectId] = useState(initialFilters.subject_id ? String(initialFilters.subject_id) : "");
  const [fromDate, setFromDate] = useState(initialFilters.from || "");
  const [toDate, setToDate] = useState(initialFilters.to || "");
  const [searchQuery, setSearchQuery] = useState(initialFilters.q || "");

  // Modal: View single event detail & diff
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  // Modal: Inspect full record history
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordType, setRecordType] = useState("");
  const [recordId, setRecordId] = useState("");
  const [recordLogs, setRecordLogs] = useState<ActivityLogItem[]>([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Helper to sync URL params
  const updateUrlParams = (updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Submit filters
  const handleFilterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const filters: ActivityLogFilters = {
      log: logFilter !== "all" ? logFilter : undefined,
      event: eventFilter !== "all" ? eventFilter : undefined,
      subject_type: subjectType.trim() || undefined,
      subject_id: subjectId ? Number(subjectId) : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      q: searchQuery.trim() || undefined,
      page: 1,
    };

    updateUrlParams(filters as any);

    const res = await getActivityLogsAction(filters);
    if (res.success) {
      setLogsData(res.data);
    } else {
      setError(res.error?.message || "Failed to filter logs.");
    }

    setIsLoading(false);
  };

  // Reset filters
  const handleResetFilters = async () => {
    setLogFilter("all");
    setEventFilter("all");
    setSubjectType("");
    setSubjectId("");
    setFromDate("");
    setToDate("");
    setSearchQuery("");

    setIsLoading(true);
    setError(null);

    const res = await getActivityLogsAction({ page: 1 });
    if (res.success) {
      setLogsData(res.data);
      router.push(pathname);
    }

    setIsLoading(false);
  };

  // Pagination Handler
  const handlePageChange = async (newPage: number) => {
    setIsLoading(true);
    setError(null);

    const filters: ActivityLogFilters = {
      log: logFilter !== "all" ? logFilter : undefined,
      event: eventFilter !== "all" ? eventFilter : undefined,
      subject_type: subjectType.trim() || undefined,
      subject_id: subjectId ? Number(subjectId) : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      q: searchQuery.trim() || undefined,
      page: newPage,
    };

    updateUrlParams({ page: newPage });

    const res = await getActivityLogsAction(filters);
    if (res.success) {
      setLogsData(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error?.message || "Failed to load page.");
    }

    setIsLoading(false);
  };

  // Open Record Audit History Modal
  const openRecordAudit = async (type: string, id: number | string) => {
    setRecordType(type);
    setRecordId(String(id));
    setIsRecordModalOpen(true);
    setRecordLoading(true);
    setRecordError(null);

    const res = await getRecordActivityLogAction(type, id);
    if (res.success) {
      setRecordLogs(res.data.data);
    } else {
      setRecordError(res.error?.message || "Failed to load record audit trail.");
    }
    setRecordLoading(false);
  };

  // Inspect Record Manual Submit
  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordType.trim() || !recordId.trim()) return;
    setRecordLoading(true);
    setRecordError(null);

    const res = await getRecordActivityLogAction(recordType.trim(), recordId.trim());
    if (res.success) {
      setRecordLogs(res.data.data);
    } else {
      setRecordError(res.error?.message || "Failed to load record audit trail.");
    }
    setRecordLoading(false);
  };

  // Format nice event badge
  const getEventBadge = (event: string) => {
    switch (event.toLowerCase()) {
      case "created":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "updated":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "deleted":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "order_status":
        return "bg-orange-50 text-[#FF5B00] border-orange-200";
      case "login_failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Format channel badge
  const getChannelBadge = (log: string) => {
    switch (log.toLowerCase()) {
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "security":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "account":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "system":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Format clean subject label
  const formatSubjectName = (rawType?: string | null) => {
    if (!rawType) return "None";
    const parts = rawType.split("\\");
    return parts[parts.length - 1];
  };

  const logs = logsData.data || [];
  const meta = logsData.meta;
  const availableLogs = meta?.logs ? meta.logs.filter(Boolean) as string[] : ["admin", "account", "security", "system"];
  const availableEvents = meta?.events ? meta.events.filter(Boolean) as string[] : ["created", "updated", "deleted", "order_status", "login_failed"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Audit & Activity Logs
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Immutable chronological trail of staff actions, security events, status transitions, and data modifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleFilterSubmit()}
            disabled={isLoading || isPending}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setRecordType("order");
              setRecordId("");
              setRecordLogs([]);
              setIsRecordModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>Inspect Record</span>
          </button>
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Log Entries
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {meta?.total?.toLocaleString() ?? logs.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">events</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Historical audit trail</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Channels
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {availableLogs.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">channels</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Admin, Account, Security, System</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Event Types
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {availableEvents.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">distinct</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">CRUD, Auth, Status transitions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Page Position
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5B00] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {meta?.current_page ?? 1}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              of {meta?.last_page ?? 1} pages
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Sorted newest first</p>
        </div>
      </div>

      {/* Filters Form */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800">Advanced Log Filters</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-[#FF5B00] transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Query on description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Search Description
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Channel (log) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Channel (`log`)
            </label>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900"
            >
              <option value="all">All Channels</option>
              {availableLogs.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Event */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Event Action (`event`)
            </label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900"
            >
              <option value="all">All Events</option>
              {availableEvents.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Subject Type
            </label>
            <input
              type="text"
              placeholder="e.g. order, product, review"
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Subject ID */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Subject Record ID
            </label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF5B00]"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF5B00]"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-[#FF5B00] hover:bg-[#E64E00] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Filter className="w-3.5 h-3.5" />
              )}
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </form>

      {/* Main Activity Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#FF5B00]" />
            <h2 className="text-sm font-bold text-slate-900">Activity Timeline</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {logs.length} of {meta?.total ?? logs.length} events
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-orange-50 text-[#FF5B00] flex items-center justify-center">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Activity Logs Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No audit log entries match your specified filter parameters. Try clearing or expanding your search filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-3">Channel</th>
                  <th className="py-3.5 px-3">Event</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Actor / Causer</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getChannelBadge(
                          item.log
                        )}`}
                      >
                        {item.log}
                      </span>
                    </td>

                    {/* Event */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getEventBadge(
                          item.event
                        )}`}
                      >
                        {item.event}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 line-clamp-2 max-w-sm">
                        {item.description}
                      </div>
                    </td>

                    {/* Causer / Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.causer ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            <User className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {item.causer.name || "Staff"}
                            </span>
                            {item.causer.id && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: #{item.causer.id}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System Auto</span>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.subject ? (
                        <div className="flex items-center gap-1.5">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {formatSubjectName(item.subject.type)}
                            </span>
                            <span className="text-[10px] font-mono text-[#FF5B00] font-bold">
                              #{item.subject.id}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              openRecordAudit(item.subject!.type, item.subject!.id)
                            }
                            title="Inspect complete history for this record"
                            className="p-1 text-slate-400 hover:text-[#FF5B00] hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Action: Open Detail */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(item)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta && meta.last_page > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing items <span className="font-bold text-slate-800">{meta.from ?? 0}</span> to{" "}
              <span className="font-bold text-slate-800">{meta.to ?? 0}</span> of{" "}
              <span className="font-bold text-slate-800">{meta.total}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={meta.current_page <= 1 || isLoading}
                onClick={() => handlePageChange(meta.current_page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded-lg">
                Page {meta.current_page} of {meta.last_page}
              </span>

              <button
                disabled={meta.current_page >= meta.last_page || isLoading}
                onClick={() => handlePageChange(meta.current_page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Single Activity Log Detail & Changes Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Log Entry Details #{selectedLog.id}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{selectedLog.description}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Channel:</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getChannelBadge(
                      selectedLog.log
                    )}`}
                  >
                    {selectedLog.log}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Event:</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadge(
                      selectedLog.event
                    )}`}
                  >
                    {selectedLog.event}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Causer / Actor:</span>
                  <span className="font-bold text-slate-800 mt-1 block">
                    {selectedLog.causer?.name || "System"} {selectedLog.causer?.id ? `(#${selectedLog.causer.id})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Subject:</span>
                  <span className="font-bold text-[#FF5B00] mt-1 block">
                    {formatSubjectName(selectedLog.subject?.type)} #{selectedLog.subject?.id}
                  </span>
                </div>
              </div>

              {/* Context Properties (IP, User Agent, Request ID) */}
              {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Request Context</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {selectedLog.context.ip && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-semibold">IP Address</span>
                        <span className="font-mono text-slate-800 font-bold">{selectedLog.context.ip}</span>
                      </div>
                    )}
                    {selectedLog.context.user_agent && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-semibold">User Agent</span>
                        <span className="font-mono text-slate-800 truncate block font-bold">
                          {selectedLog.context.user_agent}
                        </span>
                      </div>
                    )}
                    {selectedLog.context.request_id && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-semibold">Request ID</span>
                        <span className="font-mono text-slate-800 text-[11px] truncate block font-bold">
                          {selectedLog.context.request_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Changes Diff: Old vs New */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Audit Changes (`old` vs `new`)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Old State */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                      <span>Previous State (`old`)</span>
                      <span>{selectedLog.changes?.old ? Object.keys(selectedLog.changes.old).length : 0} keys</span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                      {selectedLog.changes?.old
                        ? JSON.stringify(selectedLog.changes.old, null, 2)
                        : "// No prior record state (e.g. creation event)"}
                    </pre>
                  </div>

                  {/* New State */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                      <span>New State (`new`)</span>
                      <span>{selectedLog.changes?.new ? Object.keys(selectedLog.changes.new).length : 0} keys</span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                      {selectedLog.changes?.new
                        ? JSON.stringify(selectedLog.changes.new, null, 2)
                        : "// No subsequent state (e.g. deletion event)"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Record Audit History (GET /api/v1/admin/activity-log/{type}/{id}) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Single Record Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Everything that has happened to one record - an order, product, review, or customer.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record Lookup Controls */}
            <form
              onSubmit={handleInspectSubmit}
              className="p-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Record Type
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. order, review, product"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF5B00] text-slate-900"
                />
              </div>

              <div className="w-full sm:w-36">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Record ID
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF5B00] text-slate-900"
                />
              </div>

              <div className="w-full sm:w-auto sm:self-end">
                <button
                  type="submit"
                  disabled={recordLoading}
                  className="w-full sm:w-auto px-5 py-2 bg-[#FF5B00] hover:bg-[#E64E00] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {recordLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Inspect Audit Trail</span>
                </button>
              </div>
            </form>

            {/* Record Audit Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {recordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {recordError}
                </div>
              )}

              {recordLoading ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF5B00]" />
                  <p className="text-xs font-medium">Fetching record history...</p>
                </div>
              ) : recordLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <h4 className="text-sm font-bold text-slate-700">No events found for this record</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter a valid record type (e.g. `order`, `review`, or `product`) and record ID to inspect its history.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {recordLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#FF5B00] ring-4 ring-orange-50 shrink-0" />

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadge(
                                log.event
                              )}`}
                            >
                              {log.event}
                            </span>
                            <span className="font-bold text-xs text-slate-900">
                              {log.description}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-slate-400 font-medium">Actor: </span>
                            <span className="font-bold text-slate-700">
                              {log.causer?.name || "System Auto"}
                            </span>
                          </div>

                          {log.context?.ip && (
                            <div>
                              <span className="text-slate-400 font-medium">IP: </span>
                              <span className="font-mono text-slate-700 font-semibold">{log.context.ip}</span>
                            </div>
                          )}

                          <button
                            onClick={() => setSelectedLog(log)}
                            className="ml-auto text-[11px] font-bold text-[#FF5B00] hover:underline"
                          >
                            View Raw Changes &gt;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
