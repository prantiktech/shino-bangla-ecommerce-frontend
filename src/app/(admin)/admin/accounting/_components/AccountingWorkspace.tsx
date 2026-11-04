"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Boxes,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Layers,
  Minus,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import {
  createExpenseAction,
  createExpenseCategoryAction,
  deleteExpenseAction,
  deleteExpenseCategoryAction,
  getAccountingBreakdownAction,
  getAccountingCollectionAction,
  getAccountingProfitAndLossAction,
  getAccountingStockAction,
  getAccountingSummaryAction,
  getAccountingTimelineAction,
  getExpenseCategoriesAction,
  getExpensesAction,
  updateExpenseAction,
  updateExpenseCategoryAction,
} from "@/app/(admin)/actions/accounting";
import type { PaginationMeta } from "@/app/(admin)/actions/_request";
import { useCan } from "@/app/(admin)/components/permissions";
import {
  downloadUrl,
  formatDate,
  formatNumber,
  formatTaka,
  poishaToTakaString,
  takaToPoisha,
} from "@/app/(admin)/components/format";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  InlineError,
  Input,
  LoadingRows,
  Modal,
  MoneyInput,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Spinner,
  TableShell,
  Tabs,
  TBody,
  td,
  Textarea,
  th,
  THead,
  Toggle,
  useNotice,
} from "@/app/(admin)/components/ui";
import type {
  AccountingBasis,
  AccountingBreakdownDimension,
  AccountingBreakdownResponse,
  AccountingBreakdownRow,
  AccountingBreakdownSort,
  AccountingCardValue,
  AccountingCollectionResponse,
  AccountingGroupBy,
  AccountingPreset,
  AccountingStockResponse,
  AccountingSummaryResponse,
  AccountingTimelineResponse,
  ExpenseCategory,
  ExpenseListSummary,
  ExpensePaymentMethod,
  ExpenseRecord,
  ProfitAndLossResponse,
} from "@/types/accounting";

type WorkspaceTab = "overview" | "pnl" | "expenses";

const PRESET_OPTIONS: { value: AccountingPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

const BREAKDOWN_DIMENSIONS: { value: AccountingBreakdownDimension; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "payment_method", label: "Payment Method" },
  { value: "courier", label: "Courier" },
  { value: "source", label: "Order Source" },
  { value: "customer_group", label: "Customer Group" },
  { value: "expense_category", label: "Expense Category" },
];

const PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

/** Format basis points (100 bp = 1%) into a percentage string like "25.3%". */
function formatBp(bp: number | null | undefined, decimals = 1): string {
  if (bp === null || bp === undefined) return "—";
  return `${(bp / 100).toFixed(decimals)}%`;
}

/** Format period-over-period change_bp with sign ("+12.5%", "-4.3%", "New", or "—"). */
function formatChangeBp(card: AccountingCardValue | undefined): string {
  if (!card) return "—";
  if (card.change_bp === null || card.change_bp === undefined) {
    return card.amount > 0 ? "New" : "—";
  }
  if (card.change_bp === 0) return "0.0%";
  const pct = (card.change_bp / 100).toFixed(1);
  return card.change_bp > 0 ? `+${pct}%` : `${pct}%`;
}

export function AccountingWorkspace() {
  const can = useCan();
  const { notice, success, error, clear } = useNotice();

  // Shared Period & Basis State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [preset, setPreset] = useState<AccountingPreset>("this_month");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [basis, setBasis] = useState<AccountingBasis>("accrual");
  const [groupBy, setGroupBy] = useState<AccountingGroupBy>("day");

  // Overview state
  const [summary, setSummary] = useState<AccountingSummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<AccountingTimelineResponse | null>(null);
  const [collection, setCollection] = useState<AccountingCollectionResponse | null>(null);
  const [stock, setStock] = useState<AccountingStockResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [showSecondaryCards, setShowSecondaryCards] = useState(false);

  // Breakdown state
  const [breakdownBy, setBreakdownBy] = useState<AccountingBreakdownDimension>("product");
  const [breakdownSort, setBreakdownSort] = useState<AccountingBreakdownSort>("profit");
  const [breakdown, setBreakdown] = useState<AccountingBreakdownResponse | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(true);

  // P&L state
  const [pnl, setPnl] = useState<ProfitAndLossResponse | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);

  // Expenses & Categories state
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [expensesSummary, setExpensesSummary] = useState<ExpenseListSummary>({
    count: 0,
    total_amount: 0,
  });
  const [expensesMeta, setExpensesMeta] = useState<PaginationMeta | null>(null);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>("");
  const [expenseFilterMethod, setExpenseFilterMethod] = useState<string>("");
  const [expenseSearch, setExpenseSearch] = useState<string>("");
  const [expensePage, setExpensePage] = useState<number>(1);

  // Expense Create/Edit Modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expCategoryId, setExpCategoryId] = useState<string>("");
  const [expTitle, setExpTitle] = useState<string>("");
  const [expAmountTaka, setExpAmountTaka] = useState<string>("");
  const [expIncurredOn, setExpIncurredOn] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [expPaymentMethod, setExpPaymentMethod] = useState<ExpensePaymentMethod>("cash");
  const [expVendor, setExpVendor] = useState<string>("");
  const [expReceiptUrl, setExpReceiptUrl] = useState<string>("");
  const [expNotes, setExpNotes] = useState<string>("");
  const [expSaving, setExpSaving] = useState(false);
  const [expFormError, setExpFormError] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);
  const [deletingExpenseBusy, setDeletingExpenseBusy] = useState(false);

  // Expense Categories Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catColor, setCatColor] = useState("#f97316");
  const [catDescription, setCatDescription] = useState("");
  const [catIsActive, setCatIsActive] = useState(true);
  const [catSortOrder, setCatSortOrder] = useState("10");
  const [catSaving, setCatSaving] = useState(false);
  const [catFormError, setCatFormError] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);
  const [deletingCategoryBusy, setDeletingCategoryBusy] = useState(false);

  const periodParams = useMemo(
    () => ({
      preset,
      from: preset === "custom" ? customFrom : undefined,
      to: preset === "custom" ? customTo : undefined,
      basis,
    }),
    [preset, customFrom, customTo, basis]
  );

  const loadOverview = useCallback(async () => {
    if (preset === "custom" && (!customFrom || !customTo)) return;
    setOverviewLoading(true);
    const [sumRes, timeRes, colRes, stkRes] = await Promise.all([
      getAccountingSummaryAction({ ...periodParams, compare: 1 }),
      getAccountingTimelineAction({ ...periodParams, group_by: groupBy }),
      getAccountingCollectionAction({
        preset: periodParams.preset,
        from: periodParams.from,
        to: periodParams.to,
      }),
      getAccountingStockAction({ limit: 15 }),
    ]);

    if (sumRes.success) setSummary(sumRes.data);
    else error(sumRes.error.message);

    if (timeRes.success) setTimeline(timeRes.data);
    if (colRes.success) setCollection(colRes.data);
    if (stkRes.success) setStock(stkRes.data);
    setOverviewLoading(false);
  }, [periodParams, groupBy, preset, customFrom, customTo, error]);

  const loadBreakdown = useCallback(async () => {
    if (preset === "custom" && (!customFrom || !customTo)) return;
    setBreakdownLoading(true);
    const res = await getAccountingBreakdownAction({
      ...periodParams,
      by: breakdownBy,
      sort: breakdownSort,
      limit: 20,
    });
    if (res.success) setBreakdown(res.data);
    setBreakdownLoading(false);
  }, [periodParams, breakdownBy, breakdownSort, preset, customFrom, customTo]);

  const loadPnl = useCallback(async () => {
    if (preset === "custom" && (!customFrom || !customTo)) return;
    setPnlLoading(true);
    const res = await getAccountingProfitAndLossAction(periodParams);
    if (res.success) setPnl(res.data);
    else error(res.error.message);
    setPnlLoading(false);
  }, [periodParams, preset, customFrom, customTo, error]);

  const loadCategories = useCallback(async () => {
    const res = await getExpenseCategoriesAction();
    if (res.success) setCategories(res.data.items);
  }, []);

  const loadExpenses = useCallback(
    async (page = expensePage) => {
      if (preset === "custom" && (!customFrom || !customTo)) return;
      setExpensesLoading(true);
      const res = await getExpensesAction({
        preset,
        from: preset === "custom" ? customFrom : undefined,
        to: preset === "custom" ? customTo : undefined,
        expense_category_id: expenseFilterCategory || undefined,
        payment_method: expenseFilterMethod || undefined,
        search: expenseSearch.trim() || undefined,
        page,
        per_page: 25,
      });
      if (res.success) {
        setExpenses(res.data.items);
        setExpensesSummary(res.data.summary);
        setExpensesMeta(res.data.meta);
      } else {
        error(res.error.message);
      }
      setExpensesLoading(false);
    },
    [
      preset,
      customFrom,
      customTo,
      expenseFilterCategory,
      expenseFilterMethod,
      expenseSearch,
      expensePage,
      error,
    ]
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadBreakdown();
  }, [loadBreakdown]);

  useEffect(() => {
    if (activeTab === "pnl") {
      void loadPnl();
    } else if (activeTab === "expenses") {
      void loadCategories();
      void loadExpenses(expensePage);
    }
  }, [activeTab, loadPnl, loadCategories, loadExpenses, expensePage]);

  const refreshCurrentView = () => {
    void loadOverview();
    void loadBreakdown();
    if (activeTab === "pnl") void loadPnl();
    if (activeTab === "expenses") {
      void loadCategories();
      void loadExpenses(expensePage);
    }
  };

  // Expense Modal Handlers
  const openCreateExpense = () => {
    setEditingExpense(null);
    const firstActive = categories.find((c) => c.is_active);
    setExpCategoryId(firstActive ? String(firstActive.id) : categories[0] ? String(categories[0].id) : "");
    setExpTitle("");
    setExpAmountTaka("");
    setExpIncurredOn(new Date().toISOString().slice(0, 10));
    setExpPaymentMethod("cash");
    setExpVendor("");
    setExpReceiptUrl("");
    setExpNotes("");
    setExpFormError(null);
    setExpenseModalOpen(true);
  };

  const openEditExpense = (record: ExpenseRecord) => {
    setEditingExpense(record);
    const isCatDeleted = record.category?.is_deleted === true;
    setExpCategoryId(
      record.category && !isCatDeleted
        ? String(record.category.id)
        : ""
    );
    setExpTitle(record.title);
    setExpAmountTaka(poishaToTakaString(record.amount));
    setExpIncurredOn(record.incurred_on);
    setExpPaymentMethod(record.payment_method || "cash");
    setExpVendor(record.vendor || "");
    setExpReceiptUrl(record.receipt_url || "");
    setExpNotes(record.notes || "");
    setExpFormError(null);
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpFormError(null);

    const amountPoisha = takaToPoisha(expAmountTaka);
    if (!expTitle.trim()) {
      setExpFormError("Expense title is required.");
      return;
    }
    if (!expCategoryId) {
      setExpFormError("Please select an active expense category.");
      return;
    }
    if (!amountPoisha || amountPoisha < 1) {
      setExpFormError("Amount must be at least ৳0.01.");
      return;
    }
    if (!expIncurredOn) {
      setExpFormError("Incurred date is required.");
      return;
    }

    setExpSaving(true);
    const payload = {
      expense_category_id: Number(expCategoryId),
      title: expTitle.trim(),
      amount: amountPoisha,
      incurred_on: expIncurredOn,
      payment_method: expPaymentMethod,
      vendor: expVendor.trim() || null,
      receipt_url: expReceiptUrl.trim() || null,
      notes: expNotes.trim() || null,
    };

    const res = editingExpense
      ? await updateExpenseAction(editingExpense.id, payload)
      : await createExpenseAction(payload);
    setExpSaving(false);

    if (!res.success) {
      setExpFormError(res.error.message);
      return;
    }

    success(editingExpense ? "Expense updated." : "Expense recorded.");
    setExpenseModalOpen(false);
    void loadExpenses(expensePage);
    void loadOverview();
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    setDeletingExpenseBusy(true);
    const res = await deleteExpenseAction(deletingExpense.id);
    setDeletingExpenseBusy(false);
    if (!res.success) {
      error(res.error.message);
      return;
    }
    success(`Expense ${deletingExpense.reference_number} deleted.`);
    setDeletingExpense(null);
    void loadExpenses(expensePage);
    void loadOverview();
  };

  // Expense Category Handlers
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatCode("");
    setCatColor("#f97316");
    setCatDescription("");
    setCatIsActive(true);
    setCatSortOrder("50");
    setCatFormError(null);
  };

  const openEditCategory = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatColor(cat.color || "#64748b");
    setCatDescription(cat.description || "");
    setCatIsActive(cat.is_active);
    setCatSortOrder(String(cat.sort_order ?? 50));
    setCatFormError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError(null);
    if (!catName.trim()) {
      setCatFormError("Category name is required.");
      return;
    }

    setCatSaving(true);
    const payload = {
      name: catName.trim(),
      code: editingCategory?.is_system ? undefined : catCode.trim() || undefined,
      color: catColor || null,
      description: catDescription.trim() || null,
      is_active: catIsActive,
      sort_order: Number(catSortOrder) || 0,
    };

    const res = editingCategory
      ? await updateExpenseCategoryAction(editingCategory.id, payload)
      : await createExpenseCategoryAction(payload);
    setCatSaving(false);

    if (!res.success) {
      setCatFormError(res.error.message);
      return;
    }

    success(editingCategory ? "Expense category updated." : "Expense category created.");
    openCreateCategory();
    void loadCategories();
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeletingCategoryBusy(true);
    const res = await deleteExpenseCategoryAction(deletingCategory.id);
    setDeletingCategoryBusy(false);
    if (!res.success) {
      error(res.error.message);
      setDeletingCategory(null);
      return;
    }
    success(`Category "${deletingCategory.name}" deleted.`);
    setDeletingCategory(null);
    void loadCategories();
  };

  const warnings = summary?.warnings || pnl?.warnings;
  const shippingSubsidyCard =
    summary?.cards.shipping_Subsidy ?? summary?.cards.shipping_subsidy;

  // Timeline chart max value for scaling bars
  const maxTimelineValue = useMemo(() => {
    if (!timeline?.points?.length) return 1;
    let m = 1;
    for (const pt of timeline.points) {
      m = Math.max(
        m,
        Math.abs(pt.net_sales || 0),
        Math.abs(pt.cogs || 0),
        Math.abs(pt.operating_expenses || 0),
        Math.abs(pt.net_profit || 0)
      );
    }
    return m;
  }, [timeline]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calculator}
        title="Accounting & Financial Intelligence"
        description={
          summary?.period
            ? `${summary.period.label} (${summary.period.from} → ${summary.period.to}) · ${
                basis === "accrual" ? "Accrual Basis" : "Cash Basis"
              }`
            : "Real-time profit & loss, COGS, operating expenses, cash collection, and stock valuation."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={refreshCurrentView}
            >
              Refresh
            </Button>
            {can("accounting.create") && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  if ( categories.length === 0 ) void loadCategories();
                  openCreateExpense();
                }}
              >
                Record Expense
              </Button>
            )}
          </div>
        }
      />

      <NoticeBanner notice={notice} onClose={clear} />

      {/* Sticky Top Control Bar: Period, Custom Dates, Basis, and Workspace Tabs */}
      <Card className="sticky top-16 z-20 bg-white/95 backdrop-blur-xs shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <Tabs<WorkspaceTab>
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { value: "overview", label: "Executive Overview" },
              { value: "pnl", label: "Profit & Loss (P&L)" },
              {
                value: "expenses",
                label: "Operating Expenses",
                count: summary?.counts.expense_entries,
              },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Preset Selector */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <Select
                value={preset}
                onChange={(e) => setPreset(e.target.value as AccountingPreset)}
                className="h-9 text-xs font-semibold w-40"
                aria-label="Accounting Period"
              >
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Custom Date Inputs */}
            {preset === "custom" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 text-xs w-36"
                  aria-label="From date"
                />
                <span className="text-xs text-slate-400">to</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 text-xs w-36"
                  aria-label="To date"
                />
              </div>
            )}

            {/* Accounting Basis Toggle */}
            <div
              role="group"
              aria-label="Accounting Basis"
              className="inline-flex items-center rounded-xl bg-slate-100 p-1"
            >
              <button
                type="button"
                onClick={() => setBasis("accrual")}
                className={`px-3 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  basis === "accrual"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Counts all valid active orders (excludes cancelled, failed, returned)"
              >
                Accrual (All Active)
              </button>
              <button
                type="button"
                onClick={() => setBasis("cash")}
                className={`px-3 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  basis === "cash"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Counts only delivered & paid orders"
              >
                Cash (Delivered & Paid)
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Non-dismissible Missing Cost Warning Banner per ACCOUNTING_API.md Section 1 */}
      {warnings && warnings.items_without_cost > 0 && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50/90 ring-1 ring-amber-300 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">
                Missing Cost Price on {formatNumber(warnings.items_without_cost)} Sold{" "}
                {warnings.items_without_cost === 1 ? "Unit" : "Units"} (
                {formatTaka(warnings.items_without_cost_revenue)} Revenue)
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {warnings.note ||
                  "Gross profit is overstated until cost prices are set on product variants or purchase orders."}
                {warnings.shipments_without_courier_fee > 0 &&
                  ` Additionally, ${formatNumber(
                    warnings.shipments_without_courier_fee
                  )} shipment(s) have no courier fee recorded yet.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/purchases"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-900 text-white hover:bg-amber-800 text-xs font-semibold transition-colors"
            >
              Receive Purchase Order
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100/60 text-xs font-semibold transition-colors"
            >
              Update Variants
            </Link>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: EXECUTIVE OVERVIEW                                           */}
      {/* =================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Primary 6 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard
              title="Gross Sales"
              card={summary?.cards.gross_sales}
              isCostCard={false}
              subtitle={
                summary
                  ? `${formatNumber(summary.counts.orders)} orders · ${formatNumber(
                      summary.counts.items_sold
                    )} items sold`
                  : undefined
              }
              loading={overviewLoading}
            />
            <KpiCard
              title="Net Sales"
              card={summary?.cards.net_sales}
              isCostCard={false}
              subtitle={
                summary
                  ? `Avg Order Value: ${formatTaka(summary.counts.average_order_value)}`
                  : undefined
              }
              loading={overviewLoading}
            />
            <KpiCard
              title="Cost of Goods Sold (COGS)"
              card={summary?.cards.cost_of_goods_sold}
              isCostCard={true}
              subtitle="Snapshotted unit cost × quantity sold"
              loading={overviewLoading}
            />
            <KpiCard
              title="Gross Profit"
              card={summary?.cards.gross_profit}
              isCostCard={false}
              badgeLabel={
                summary ? `${formatBp(summary.rates.gross_margin_bp)} margin` : undefined
              }
              badgeTone={
                (summary?.cards.gross_profit.amount ?? 0) >= 0 ? "green" : "red"
              }
              subtitle="Net Sales − COGS"
              loading={overviewLoading}
            />
            <KpiCard
              title="Operating Expenses"
              card={summary?.cards.operating_expenses}
              isCostCard={true}
              badgeLabel={
                summary ? `${formatBp(summary.rates.expense_ratio_bp)} of net sales` : undefined
              }
              badgeTone="amber"
              subtitle={
                summary
                  ? `Courier fees + ${formatNumber(summary.counts.expense_entries)} expense entries`
                  : undefined
              }
              loading={overviewLoading}
            />
            <KpiCard
              title="Net Profit"
              card={summary?.cards.net_profit}
              isCostCard={false}
              highlight
              badgeLabel={
                summary ? `${formatBp(summary.rates.net_margin_bp)} net margin` : undefined
              }
              badgeTone={(summary?.cards.net_profit.amount ?? 0) >= 0 ? "green" : "red"}
              subtitle="Gross Profit − Operating Expenses"
              loading={overviewLoading}
            />
          </div>

          {/* Expandable Secondary Figures & Rates */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span>
                  Discounts:{" "}
                  <strong className="text-slate-900">
                    {formatTaka(summary?.cards.discounts.amount)}
                  </strong>{" "}
                  ({formatBp(summary?.rates.discount_rate_bp)})
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Returns & Refunds:{" "}
                  <strong className="text-slate-900">
                    {formatTaka(summary?.cards.returns_and_refunds.amount)}
                  </strong>{" "}
                  ({formatBp(summary?.rates.return_rate_bp)})
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Courier Fees:{" "}
                  <strong className="text-slate-900">
                    {formatTaka(summary?.cards.courier_fees.amount)}
                  </strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Other Expenses:{" "}
                  <strong className="text-slate-900">
                    {formatTaka(summary?.cards.other_expenses.amount)}
                  </strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  VAT Collected:{" "}
                  <strong className="text-slate-900">
                    {formatTaka(summary?.cards.vat_collected.amount)}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSecondaryCards((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0 ml-2"
              >
                {showSecondaryCards ? (
                  <>
                    Hide Details <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    All 12 Metrics <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {showSecondaryCards && summary && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <KpiCard
                  title="Discounts Given"
                  card={summary.cards.discounts}
                  isCostCard={true}
                  badgeLabel={`${formatBp(summary.rates.discount_rate_bp)} rate`}
                  badgeTone="amber"
                />
                <KpiCard
                  title="Returns & Refunds"
                  card={summary.cards.returns_and_refunds}
                  isCostCard={true}
                  badgeLabel={`${formatBp(summary.rates.return_rate_bp)} rate`}
                  badgeTone="red"
                  subtitle={`${formatNumber(summary.counts.returned_orders)} returned orders · ${formatNumber(
                    summary.counts.refund_count
                  )} refunds`}
                />
                <KpiCard
                  title="Shipping Subsidy"
                  card={shippingSubsidyCard}
                  isCostCard={true}
                  subtitle="Courier fees − shipping charged to customers"
                />
                <KpiCard
                  title="Courier Delivery Fees"
                  card={summary.cards.courier_fees}
                  isCostCard={true}
                  subtitle="Auto-aggregated from order shipments"
                />
                <KpiCard
                  title="Recorded Operating Expenses"
                  card={summary.cards.other_expenses}
                  isCostCard={true}
                  subtitle={`${formatNumber(summary.counts.expense_entries)} manual entries`}
                />
                <KpiCard
                  title="VAT Collected (Pass-through)"
                  card={summary.cards.vat_collected}
                  isCostCard={false}
                  subtitle="Excluded from revenue & profit"
                />
              </div>
            )}
          </Card>

          {/* Revenue, COGS, Expenses & Net Profit Timeline */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Revenue, Cost & Profit Timeline
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare Net Sales, COGS, Operating Expenses, and Net Profit across time buckets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-3 text-xs mr-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" /> Net Sales
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> COGS
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-400" /> OpEx
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Net Profit
                  </span>
                </div>
                <Select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as AccountingGroupBy)}
                  className="h-8 text-xs font-semibold w-32"
                  aria-label="Timeline Group By"
                >
                  <option value="day">By Day</option>
                  <option value="week">By Week</option>
                  <option value="month">By Month</option>
                  <option value="year">By Year</option>
                </Select>
              </div>
            </div>

            {overviewLoading ? (
              <div className="h-56 flex items-center justify-center">
                <Spinner />
              </div>
            ) : !timeline?.points?.length ? (
              <EmptyState
                icon={BarChart3}
                title="No timeline data for this period"
                description="Orders and expenses within the selected date range will populate the timeline."
              />
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[600px] h-52 flex items-end gap-2 pt-6 px-2 border-b border-slate-200">
                    {timeline.points.map((pt) => {
                      const salesH = Math.max(2, Math.round((pt.net_sales / maxTimelineValue) * 148));
                      const cogsH = Math.max(2, Math.round((pt.cogs / maxTimelineValue) * 148));
                      const opexH = Math.max(
                        2,
                        Math.round((pt.operating_expenses / maxTimelineValue) * 148)
                      );
                      const profitH = Math.max(
                        2,
                        Math.round((Math.abs(pt.net_profit) / maxTimelineValue) * 148)
                      );
                      return (
                        <div
                          key={pt.bucket}
                          className="flex-1 min-w-[38px] flex flex-col items-center group relative"
                        >
                          {/* Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute bottom-full mb-2 z-10 w-48 rounded-xl bg-slate-900 text-white p-2.5 text-[11px] shadow-xl space-y-1">
                            <div className="font-bold text-white border-b border-white/10 pb-1">
                              {pt.label} ({pt.orders} orders)
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sky-300">Net Sales:</span>
                              <span className="font-mono">{formatTaka(pt.net_sales)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-300">COGS:</span>
                              <span className="font-mono">{formatTaka(pt.cogs)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-rose-300">OpEx:</span>
                              <span className="font-mono">{formatTaka(pt.operating_expenses)}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/10 pt-1 font-bold">
                              <span
                                className={
                                  pt.net_profit >= 0 ? "text-emerald-300" : "text-rose-300"
                                }
                              >
                                Net Profit:
                              </span>
                              <span className="font-mono">{formatTaka(pt.net_profit)}</span>
                            </div>
                          </div>

                          <div className="w-full flex items-end justify-center gap-0.5 h-40">
                            <div
                              style={{ height: `${salesH}px` }}
                              className="w-2 rounded-t-xs bg-sky-500 transition-all"
                            />
                            <div
                              style={{ height: `${cogsH}px` }}
                              className="w-2 rounded-t-xs bg-amber-500 transition-all"
                            />
                            <div
                              style={{ height: `${opexH}px` }}
                              className="w-2 rounded-t-xs bg-rose-400 transition-all"
                            />
                            <div
                              style={{ height: `${profitH}px` }}
                              className={`w-2 rounded-t-xs transition-all ${
                                pt.net_profit >= 0 ? "bg-emerald-500" : "bg-rose-600"
                              }`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-2 truncate max-w-[54px]">
                            {pt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Totals Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 rounded-xl p-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Period Orders</span>
                    <strong className="text-slate-900 text-sm tabular-nums">
                      {formatNumber(timeline.totals.orders)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Net Sales</span>
                    <strong className="text-sky-700 text-sm tabular-nums">
                      {formatTaka(timeline.totals.net_sales)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total COGS</span>
                    <strong className="text-amber-700 text-sm tabular-nums">
                      {formatTaka(timeline.totals.cogs)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total OpEx</span>
                    <strong className="text-rose-700 text-sm tabular-nums">
                      {formatTaka(timeline.totals.operating_expenses)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Net Profit</span>
                    <strong
                      className={`text-sm tabular-nums ${
                        timeline.totals.net_profit >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {formatTaka(timeline.totals.net_profit)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 8-Dimension Profit & Expense Breakdown */}
          <Card padded={false}>
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Multi-Dimensional Profit & Expense Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drill into profitability, collection rates, courier subsidies, and expenses across 8 dimensions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sort by:</span>
                  <Select
                    value={breakdownSort}
                    onChange={(e) =>
                      setBreakdownSort(e.target.value as AccountingBreakdownSort)
                    }
                    className="h-8 text-xs font-semibold w-36"
                    aria-label="Breakdown Sort"
                  >
                    <option value="profit">Profit / Amount</option>
                    <option value="revenue">Revenue</option>
                    <option value="cost">Cost</option>
                    <option value="margin">Margin %</option>
                    <option value="quantity">Quantity / Volume</option>
                  </Select>
                </div>
              </div>

              <Tabs<AccountingBreakdownDimension>
                value={breakdownBy}
                onChange={setBreakdownBy}
                tabs={BREAKDOWN_DIMENSIONS}
              />
            </div>

            <BreakdownTable
              dimension={breakdownBy}
              data={breakdown}
              loading={breakdownLoading}
            />
          </Card>

          {/* Cash Collection & COD Pipeline */}
          {collection && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Cash Collected by Method & Outstanding */}
              <Card className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      Cash Collection & Receivables
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real money collected from customer payments vs outstanding balances.
                    </p>
                  </div>
                  <Badge tone="green">
                    Net Collected: {formatTaka(collection.net_cash_collected)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Gross Collected</span>
                    <strong className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatTaka(collection.collected.total)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Refunded Cash</span>
                    <strong className="text-sm font-bold text-rose-600 tabular-nums">
                      ({formatTaka(collection.refunded_cash)})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Net Cash Inflow</span>
                    <strong className="text-sm font-bold text-emerald-700 tabular-nums">
                      {formatTaka(collection.net_cash_collected)}
                    </strong>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <THead>
                      <th className={`${th} w-10 text-center`}>#</th>
                      <th className={th}>Payment Method</th>
                      <th className={`${th} text-right`}>Payments</th>
                      <th className={`${th} text-right`}>Amount Collected</th>
                    </THead>
                    <TBody>
                      {collection.collected.by_method.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                            No completed payments in this period.
                          </td>
                        </tr>
                      ) : (
                        collection.collected.by_method.map((m, idx) => (
                          <tr key={m.method} className="hover:bg-slate-50/70">
                            <td className={`${td} text-center text-xs text-slate-400 tabular-nums`}>
                              {idx + 1}
                            </td>
                            <td className={`${td} font-semibold text-slate-900`}>{m.label}</td>
                            <td className={`${td} text-right tabular-nums`}>
                              {formatNumber(m.payments)}
                            </td>
                            <td className={`${td} text-right font-semibold text-slate-900 tabular-nums`}>
                              {formatTaka(m.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </TBody>
                  </table>
                </div>

                {/* Outstanding Orders by Status */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      Outstanding Receivables ({formatNumber(collection.outstanding.orders)} orders)
                    </span>
                    <span className="font-bold text-amber-700 tabular-nums">
                      {formatTaka(collection.outstanding.amount)} due
                    </span>
                  </div>
                  {collection.outstanding.by_status.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {collection.outstanding.by_status.map((st) => (
                        <div
                          key={st.status}
                          className="px-3 py-1.5 rounded-lg bg-amber-50/70 ring-1 ring-amber-200 text-xs flex items-center gap-2"
                        >
                          <span className="font-semibold capitalize text-amber-900">
                            {st.status.replace(/_/g, " ")} ({st.orders}):
                          </span>
                          <span className="font-bold text-amber-800 tabular-nums">
                            {formatTaka(st.amount_due)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Right: COD Pipeline */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      Cash on Delivery (COD) Settlement Pipeline
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track COD cash collected by couriers, parcels in transit, and net courier payout.
                    </p>
                  </div>
                  <Badge tone="orange">
                    Net Expected: {formatTaka(collection.cod.net_expected_from_couriers)}
                  </Badge>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-sm">
                  <PipelineRow
                    label="Total COD Expected (Order Grand Totals)"
                    amount={collection.cod.expected}
                    tone="slate"
                  />
                  <PipelineRow
                    label="Delivered & Collected by Couriers"
                    amount={collection.cod.delivered_collected}
                    tone="green"
                  />
                  <PipelineRow
                    label="In Transit with Courier"
                    amount={collection.cod.in_transit_with_courier}
                    tone="blue"
                  />
                  <PipelineRow
                    label="Awaiting Courier Handover"
                    amount={collection.cod.awaiting_handover}
                    tone="amber"
                  />
                  <PipelineRow
                    label="Returned Uncollected"
                    amount={collection.cod.returned_uncollected}
                    tone="red"
                  />
                  <PipelineRow
                    label="Less: Courier Delivery Fees Deducted"
                    amount={collection.cod.courier_fees_deducted}
                    isDeduction
                    tone="red"
                  />
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/70 font-bold text-slate-900">
                    <span>Net Payout Expected from Couriers (Delivered − Fees)</span>
                    <span className="text-emerald-700 tabular-nums">
                      {formatTaka(collection.cod.net_expected_from_couriers)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Inventory Valuation & Supplier Payables */}
          {stock && (
            <div className="space-y-6">
              <Card className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-primary" />
                      Inventory Valuation & Supplier Payables
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live balance-sheet snapshot of on-hand stock cost, retail value, and supplier payables.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="slate">
                      {formatNumber(stock.current_stock.total_units)} units across{" "}
                      {formatNumber(stock.current_stock.in_stock_variants)} in-stock variants
                    </Badge>
                    {stock.current_stock.variants_without_cost > 0 && (
                      <Badge tone="amber">
                        {formatNumber(stock.current_stock.variants_without_cost)} variants missing cost
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Stock Cost Value
                    </span>
                    <div className="mt-1.5 text-xl font-bold text-slate-900 tabular-nums">
                      {formatTaka(stock.current_stock.cost_value)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Capital tied in inventory</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Stock Retail Value
                    </span>
                    <div className="mt-1.5 text-xl font-bold text-sky-700 tabular-nums">
                      {formatTaka(stock.current_stock.retail_value)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">At current selling prices</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 p-4 ring-1 ring-emerald-200">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      Potential Profit
                    </span>
                    <div className="mt-1.5 text-xl font-bold text-emerald-800 tabular-nums">
                      {formatTaka(stock.current_stock.potential_profit)}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {formatBp(stock.current_stock.potential_margin_bp)} potential margin
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50/60 p-4 ring-1 ring-amber-200">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      Due to Suppliers
                    </span>
                    <div className="mt-1.5 text-xl font-bold text-amber-900 tabular-nums">
                      {formatTaka(stock.purchases.outstanding_to_suppliers)}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      All-time purchases: {formatTaka(stock.purchases.all_time_total)}
                    </p>
                  </div>
                </div>

                {/* Top Stock Value Variants Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Top Variants by Stock Cost Valuation
                  </h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px]">
                        <THead>
                          <th className={`${th} w-12 text-center`}>#</th>
                          <th className={th}>Product / Variant</th>
                          <th className={th}>SKU</th>
                          <th className={`${th} text-right`}>On Hand</th>
                          <th className={`${th} text-right`}>Unit Cost</th>
                          <th className={`${th} text-right`}>Selling Price</th>
                          <th className={`${th} text-right`}>Cost Value</th>
                          <th className={`${th} text-right`}>Retail Value</th>
                          <th className={`${th} text-right`}>Potential Profit</th>
                        </THead>
                        <TBody>
                          {stock.top_stock_value.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                                No in-stock variants found.
                              </td>
                            </tr>
                          ) : (
                            stock.top_stock_value.map((v, idx) => (
                              <tr key={v.variant_id} className="hover:bg-slate-50/70">
                                <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                                  {idx + 1}
                                </td>
                                <td className={td}>
                                  <div className="font-semibold text-slate-900">{v.product_name}</div>
                                  {v.title && <div className="text-xs text-slate-500">{v.title}</div>}
                                </td>
                                <td className={`${td} font-mono text-xs text-slate-600`}>{v.sku}</td>
                                <td className={`${td} text-right font-semibold tabular-nums`}>
                                  {formatNumber(v.stock)}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                  {v.cost_price > 0 ? (
                                    formatTaka(v.cost_price)
                                  ) : (
                                    <Badge tone="amber">Missing</Badge>
                                  )}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                  {formatTaka(v.selling_price)}
                                </td>
                                <td className={`${td} text-right font-semibold text-slate-900 tabular-nums`}>
                                  {formatTaka(v.cost_value)}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                  {formatTaka(v.retail_value)}
                                </td>
                                <td className={`${td} text-right font-semibold text-emerald-700 tabular-nums`}>
                                  {formatTaka(v.potential_profit)}
                                </td>
                              </tr>
                            ))
                          )}
                        </TBody>
                      </table>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PROFIT & LOSS (P&L) STATEMENT                                */}
      {/* =================================================================== */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <Card padded={false}>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Statement of Profit & Loss
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pnl?.period
                    ? `${pnl.period.label} (${pnl.period.from} to ${pnl.period.to}) · ${
                        pnl.basis === "accrual" ? "Accrual Basis" : "Cash Basis"
                      } · Currency: ${pnl.currency}`
                    : "Standard accounting income statement with downloadable Excel, CSV, and PDF exports."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={downloadUrl("/admin/accounting/profit-and-loss", {
                    ...periodParams,
                    format: "xlsx",
                  })}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel (.xlsx)
                </a>
                <a
                  href={downloadUrl("/admin/accounting/profit-and-loss", {
                    ...periodParams,
                    format: "csv",
                  })}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </a>
                <a
                  href={downloadUrl("/admin/accounting/profit-and-loss", {
                    ...periodParams,
                    format: "pdf",
                  })}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </a>
              </div>
            </div>

            {pnlLoading ? (
              <div className="py-16 flex justify-center">
                <Spinner />
              </div>
            ) : !pnl ? (
              <EmptyState
                icon={FileText}
                title="Unable to load Profit & Loss statement"
                description="Please try refreshing or selecting a valid date range."
              />
            ) : (
              <div className="p-5 sm:p-6 space-y-6">
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className={`${th} w-12 text-center`}>#</th>
                        <th className={th}>Section</th>
                        <th className={th}>Line Item</th>
                        <th className={`${th} text-right`}>Amount (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pnl.lines.map((line, idx) => {
                        const isTotal = Boolean(line.is_total);
                        const isDeduction = Boolean(line.is_deduction);
                        const isNetProfit = line.code === "net_profit";
                        const formattedAmount = isDeduction
                          ? `(${formatTaka(Math.abs(line.amount))})`
                          : formatTaka(line.amount);

                        return (
                          <tr
                            key={line.code}
                            className={
                              isNetProfit
                                ? "bg-brand-50/50 font-bold text-slate-900 border-t-2 border-slate-300"
                                : isTotal
                                ? "bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200"
                                : "hover:bg-slate-50/50"
                            }
                          >
                            <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
                              {line.section}
                            </td>
                            <td
                              className={`px-4 py-3 ${
                                isTotal ? "font-bold text-slate-900" : "text-slate-700"
                              }`}
                            >
                              {line.label}
                            </td>
                            <td
                              className={`px-4 py-3 text-right tabular-nums ${
                                isNetProfit
                                  ? line.amount >= 0
                                    ? "text-emerald-700 font-extrabold text-base"
                                    : "text-rose-700 font-extrabold text-base"
                                  : isDeduction
                                  ? "text-rose-600 font-medium"
                                  : isTotal
                                  ? "font-bold text-slate-900"
                                  : "text-slate-800"
                              }`}
                            >
                              {formattedAmount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Expenses by Category in P&L */}
                {pnl.expenses_by_category.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Operating Expenses Breakdown by Category
                    </h3>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <THead>
                          <th className={`${th} w-12 text-center`}>#</th>
                          <th className={th}>Expense Category</th>
                          <th className={`${th} text-right`}>Entries</th>
                          <th className={`${th} text-right`}>Amount</th>
                          <th className={`${th} text-right`}>Share of OpEx</th>
                        </THead>
                        <TBody>
                          {pnl.expenses_by_category.map((cat, idx) => (
                            <tr key={cat.code} className="hover:bg-slate-50/70">
                              <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                                {idx + 1}
                              </td>
                              <td className={td}>
                                <div className="flex items-center gap-2 font-semibold text-slate-900">
                                  <span
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: cat.color || "#64748b" }}
                                  />
                                  <span>{cat.name}</span>
                                </div>
                              </td>
                              <td className={`${td} text-right tabular-nums`}>
                                {formatNumber(cat.entries)}
                              </td>
                              <td className={`${td} text-right font-semibold text-slate-900 tabular-nums`}>
                                {formatTaka(cat.amount)}
                              </td>
                              <td className={`${td} text-right tabular-nums`}>
                                {formatBp(cat.share_bp)}
                              </td>
                            </tr>
                          ))}
                        </TBody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: OPERATING EXPENSES & CATEGORIES CRUD                         */}
      {/* =================================================================== */}
      {activeTab === "expenses" && (
        <div className="space-y-5">
          {/* Mandatory Courier Fee Guidance Note per ACCOUNTING_API.md Section 11 */}
          <div className="rounded-2xl bg-sky-50/90 ring-1 ring-sky-200 px-4 py-3 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Courier delivery fees from order shipments are included in
                Operating Expenses automatically. Do not re-enter parcel courier fees here unless it
                is a separate bulk settlement.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={FolderKanban}
                onClick={() => {
                  openCreateCategory();
                  setCategoryModalOpen(true);
                }}
              >
                Manage Categories ({categories.length})
              </Button>
              {can("accounting.create") && (
                <Button variant="primary" size="sm" icon={Plus} onClick={openCreateExpense}>
                  Add Expense
                </Button>
              )}
            </div>
          </div>

          {/* Expense Filters & Summary Bar */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <SearchInput
                  value={expenseSearch}
                  onChange={(v) => {
                    setExpenseSearch(v);
                    setExpensePage(1);
                  }}
                  placeholder="Search reference, title, vendor..."
                  className="w-full sm:w-64"
                />
                <Select
                  value={expenseFilterCategory}
                  onChange={(e) => {
                    setExpenseFilterCategory(e.target.value);
                    setExpensePage(1);
                  }}
                  className="h-10 text-xs w-48"
                  aria-label="Filter by Category"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={expenseFilterMethod}
                  onChange={(e) => {
                    setExpenseFilterMethod(e.target.value);
                    setExpensePage(1);
                  }}
                  className="h-10 text-xs w-40"
                  aria-label="Filter by Payment Method"
                >
                  <option value="">All Methods</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-3 text-xs bg-slate-50 px-3.5 py-2 rounded-xl ring-1 ring-slate-200/80">
                <span className="text-slate-500">
                  Matching Entries:{" "}
                  <strong className="text-slate-900">{formatNumber(expensesSummary.count)}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  Total:{" "}
                  <strong className="text-slate-900 tabular-nums">
                    {formatTaka(expensesSummary.total_amount)}
                  </strong>
                </span>
              </div>
            </div>
          </Card>

          {/* Expenses Table */}
          <TableShell>
            <THead>
              <th className={`${th} w-12 text-center`}>#</th>
              <th className={th}>Reference</th>
              <th className={th}>Date</th>
              <th className={th}>Title & Notes</th>
              <th className={th}>Category</th>
              <th className={th}>Vendor</th>
              <th className={th}>Method</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={`${th} text-right`}>Actions</th>
            </THead>
            <TBody>
              {expensesLoading ? (
                <LoadingRows cols={9} rows={6} />
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Receipt}
                      title="No operating expenses recorded for this filter"
                      description="Record rent, salaries, Facebook/Google ads, packaging, utilities, and other overhead expenses."
                      action={
                        can("accounting.create") ? (
                          <Button variant="primary" size="sm" icon={Plus} onClick={openCreateExpense}>
                            Record First Expense
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                expenses.map((exp, idx) => {
                  const rowIndex =
                    ((expensesMeta?.current_page ?? expensePage) - 1) *
                      (expensesMeta?.per_page ?? 25) +
                    idx +
                    1;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70">
                      <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                        {rowIndex}
                      </td>
                      <td className={`${td} font-mono text-xs font-semibold text-slate-800 whitespace-nowrap`}>
                        {exp.reference_number}
                      </td>
                      <td className={`${td} text-xs text-slate-600 whitespace-nowrap`}>
                        {formatDate(exp.incurred_on)}
                      </td>
                      <td className={td}>
                        <div className="font-semibold text-slate-900">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-xs text-slate-500 line-clamp-1">{exp.notes}</div>
                        )}
                      </td>
                      <td className={td}>
                        {exp.category ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: exp.category.color || "#64748b" }}
                            />
                            <span>{exp.category.name}</span>
                            {exp.category.is_deleted && (
                              <Badge tone="amber">Archived</Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Uncategorized</span>
                        )}
                      </td>
                      <td className={`${td} text-xs text-slate-600`}>{exp.vendor || "—"}</td>
                      <td className={td}>
                        <Badge tone="slate" className="uppercase">
                          {exp.payment_method}
                        </Badge>
                      </td>
                      <td className={`${td} text-right font-bold text-slate-900 tabular-nums whitespace-nowrap`}>
                        {formatTaka(exp.amount)}
                      </td>
                      <td className={`${td} text-right whitespace-nowrap`}>
                        <div className="inline-flex items-center justify-end gap-1">
                          {can("accounting.update") && (
                            <IconButton
                              label="Edit Expense"
                              icon={Edit2}
                              onClick={() => openEditExpense(exp)}
                            />
                          )}
                          {can("accounting.delete") && (
                            <IconButton
                              label="Delete Expense"
                              icon={Trash2}
                              tone="danger"
                              onClick={() => setDeletingExpense(exp)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </TBody>
          </TableShell>

          <Pagination
            meta={expensesMeta}
            onPageChange={(p) => {
              setExpensePage(p);
              void loadExpenses(p);
            }}
            disabled={expensesLoading}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT EXPENSE                                        */}
      {/* =================================================================== */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title={
          editingExpense
            ? `Edit Expense · ${editingExpense.reference_number}`
            : "Record Operating Expense"
        }
        description="Enter amount in BDT (Taka). It is automatically stored in poisha for exact accounting."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setExpenseModalOpen(false)}
              disabled={expSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={expSaving}
              onClick={handleSaveExpense}
            >
              {editingExpense ? "Update Expense" : "Save Expense"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <InlineError message={expFormError} />

          {editingExpense?.category?.is_deleted && (
            <div className="rounded-lg bg-amber-50 ring-1 ring-amber-200 px-3 py-2 text-xs text-amber-900">
              Previous category <strong>{editingExpense.category.name} (deleted)</strong> is no
              longer active. Please choose an active category below to save changes.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Expense Category" required>
              <Select
                value={expCategoryId}
                onChange={(e) => setExpCategoryId(e.target.value)}
                required
              >
                <option value="">Select category...</option>
                {categories
                  .filter((c) => c.is_active || String(c.id) === expCategoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Incurred Date" required>
              <Input
                type="date"
                value={expIncurredOn}
                onChange={(e) => setExpIncurredOn(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Expense Title" required>
            <Input
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="e.g. Meta Ads boost — Eid campaign"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Amount (BDT)" required>
              <MoneyInput
                value={expAmountTaka}
                onChange={setExpAmountTaka}
                placeholder="0.00"
                required
              />
            </Field>

            <Field label="Payment Method" required>
              <Select
                value={expPaymentMethod}
                onChange={(e) => setExpPaymentMethod(e.target.value as ExpensePaymentMethod)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vendor / Payee">
              <Input
                value={expVendor}
                onChange={(e) => setExpVendor(e.target.value)}
                placeholder="e.g. Meta Ireland Ltd."
              />
            </Field>

            <Field label="Receipt URL (optional)">
              <Input
                type="url"
                value={expReceiptUrl}
                onChange={(e) => setExpReceiptUrl(e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <Textarea
              rows={3}
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              placeholder="Additional context, invoice number, or campaign details..."
            />
          </Field>
        </form>
      </Modal>

      {/* Delete Expense Confirm */}
      <ConfirmDialog
        open={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDeleteExpense}
        loading={deletingExpenseBusy}
        title="Delete Expense Entry?"
        message={
          deletingExpense ? (
            <span>
              Delete expense <strong>{deletingExpense.reference_number}</strong> (
              {deletingExpense.title} — {formatTaka(deletingExpense.amount)})?
            </span>
          ) : null
        }
        confirmLabel="Delete Expense"
      />

      {/* =================================================================== */}
      {/* MODAL: EXPENSE CATEGORIES MANAGER                                   */}
      {/* =================================================================== */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Expense Categories"
        description="System categories cannot be deleted or have their code changed, but their display name and color can be customized."
        size="lg"
      >
        <div className="space-y-6">
          {/* Category Form */}
          {(can("accounting.create") || can("accounting.update")) && (
            <form
              onSubmit={handleSaveCategory}
              className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {editingCategory
                    ? `Editing Category: ${editingCategory.name}`
                    : "Create Custom Category"}
                </h3>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={openCreateCategory}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + New Category Instead
                  </button>
                )}
              </div>

              <InlineError message={catFormError} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Name" required>
                  <Input
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Influencer Marketing"
                    required
                  />
                </Field>
                <Field
                  label="Code (slug)"
                  hint={editingCategory?.is_system ? "System code is locked" : "Auto-generated if blank"}
                >
                  <Input
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    placeholder="influencer_marketing"
                    disabled={Boolean(editingCategory?.is_system)}
                  />
                </Field>
                <Field label="Badge Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white"
                    />
                    <Input
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </Field>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <Toggle
                  checked={catIsActive}
                  onChange={setCatIsActive}
                  label="Active category"
                />
                <Button type="submit" size="sm" variant="primary" loading={catSaving}>
                  {editingCategory ? "Save Category Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          )}

          {/* Categories Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <THead>
                <th className={`${th} w-10 text-center`}>#</th>
                <th className={th}>Category</th>
                <th className={th}>Code</th>
                <th className={`${th} text-right`}>Entries</th>
                <th className={`${th} text-right`}>Total Spent</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Actions</th>
              </THead>
              <TBody>
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70">
                    <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                      {idx + 1}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#64748b" }}
                        />
                        <span>{cat.name}</span>
                        {cat.is_system && <Badge tone="slate">System</Badge>}
                      </div>
                    </td>
                    <td className={`${td} font-mono text-xs text-slate-500`}>{cat.code}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {formatNumber(cat.expenses_count ?? 0)}
                    </td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>
                      {formatTaka(cat.expenses_sum_amount ?? 0)}
                    </td>
                    <td className={td}>
                      <Badge tone={cat.is_active ? "green" : "slate"}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex items-center justify-end gap-1">
                        {can("accounting.update") && (
                          <IconButton
                            label="Edit Category"
                            icon={Edit2}
                            onClick={() => openEditCategory(cat)}
                          />
                        )}
                        {can("accounting.delete") && !cat.is_system && (
                          <IconButton
                            label="Delete Category"
                            icon={Trash2}
                            tone="danger"
                            onClick={() => setDeletingCategory(cat)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </TBody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Delete Category Confirm */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDeleteCategory}
        loading={deletingCategoryBusy}
        title="Delete Expense Category?"
        message={
          deletingCategory ? (
            <span>
              Delete custom category <strong>{deletingCategory.name}</strong>? Existing expenses
              will keep their historical category reference.
            </span>
          ) : null
        }
        confirmLabel="Delete Category"
      />
    </div>
  );
}

/* ============================================================================
 * Subcomponents
 * ========================================================================== */

/**
 * KPI Card with cost-aware trend arrow coloring per ACCOUNTING_API.md Section 1:
 * - Revenue/profit cards (`isCostCard = false`): up = green, down = red
 * - Cost/deduction cards (`isCostCard = true`): up = amber/red, down = green
 */
function KpiCard({
  title,
  card,
  isCostCard,
  badgeLabel,
  badgeTone = "slate",
  subtitle,
  highlight,
  loading,
}: {
  title: string;
  card: AccountingCardValue | undefined;
  isCostCard: boolean;
  badgeLabel?: string;
  badgeTone?: "slate" | "green" | "red" | "amber" | "blue" | "orange";
  subtitle?: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  const dir = card?.direction ?? "flat";
  const changeLabel = formatChangeBp(card);

  let changeToneClass = "text-slate-500 bg-slate-100";
  if (dir === "up") {
    changeToneClass = isCostCard
      ? "text-rose-700 bg-rose-50 ring-1 ring-rose-200"
      : "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200";
  } else if (dir === "down") {
    changeToneClass = isCostCard
      ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200"
      : "text-rose-700 bg-rose-50 ring-1 ring-rose-200";
  }

  return (
    <Card
      className={
        highlight
          ? "ring-2 ring-primary/25 bg-gradient-to-br from-white via-white to-brand-50/30"
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {badgeLabel && <Badge tone={badgeTone}>{badgeLabel}</Badge>}
      </div>

      {loading && !card ? (
        <div className="mt-3 h-8 w-36 rounded-lg bg-slate-100 animate-pulse" />
      ) : (
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div
            className={`text-2xl font-extrabold tabular-nums ${
              card && card.amount < 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {formatTaka(card?.amount ?? 0)}
          </div>

          {card && card.previous_amount !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${changeToneClass}`}
              title={`Previous period: ${formatTaka(card.previous_amount)}`}
            >
              {dir === "up" ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : dir === "down" ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {changeLabel}
            </span>
          )}
        </div>
      )}

      {subtitle && <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>}
    </Card>
  );
}

function PipelineRow({
  label,
  amount,
  isDeduction,
  tone,
}: {
  label: string;
  amount: number;
  isDeduction?: boolean;
  tone: "slate" | "green" | "blue" | "amber" | "red";
}) {
  const dotColors = {
    slate: "bg-slate-400",
    green: "bg-emerald-500",
    blue: "bg-sky-500",
    amber: "bg-amber-500",
    red: "bg-rose-500",
  };
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-slate-50/70">
      <div className="flex items-center gap-2.5 text-slate-700 font-medium">
        <span className={`w-2 h-2 rounded-full ${dotColors[tone]}`} />
        <span>{label}</span>
      </div>
      <span
        className={`font-semibold tabular-nums ${
          isDeduction ? "text-rose-600" : "text-slate-900"
        }`}
      >
        {isDeduction ? `(${formatTaka(Math.abs(amount))})` : formatTaka(amount)}
      </span>
    </div>
  );
}

/**
 * Renders the 8-dimension breakdown table with `#` row index, `others` summary row, and `totals` footer.
 */
function BreakdownTable({
  dimension,
  data,
  loading,
}: {
  dimension: AccountingBreakdownDimension;
  data: AccountingBreakdownResponse | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <TBody>
            <LoadingRows cols={8} rows={6} />
          </TBody>
        </table>
      </div>
    );
  }

  const rows = data?.rows ?? [];
  const others = data?.others ?? null;
  const totals = data?.totals ?? {};

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No breakdown records for this period"
        description="Activity in the selected period will appear here broken down by dimension."
      />
    );
  }

  // Expense Category breakdown has a specialized schema
  if (dimension === "expense_category") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <THead>
            <th className={`${th} w-12 text-center`}>#</th>
            <th className={th}>Expense Category</th>
            <th className={`${th} text-right`}>Entries</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={`${th} text-right`}>Share %</th>
          </THead>
          <TBody>
            {rows.map((r, idx) => (
              <tr key={String(r.key)} className="hover:bg-slate-50/70">
                <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                  {idx + 1}
                </td>
                <td className={td}>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    {r.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                    )}
                    <span>{r.name}</span>
                  </div>
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatNumber(r.entries ?? 0)}</td>
                <td className={`${td} text-right font-semibold text-slate-900 tabular-nums`}>
                  {formatTaka(r.amount ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatBp(r.share_bp)}</td>
              </tr>
            ))}
            {others && (
              <tr className="bg-slate-50/60 text-slate-500 italic">
                <td className={`${td} text-center text-xs`}>—</td>
                <td className={td}>{others.name}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatNumber(others.entries ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatTaka(others.amount ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatBp(others.share_bp)}</td>
              </tr>
            )}
            <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200">
              <td className={td} />
              <td className={td}>Total Operating Expenses</td>
              <td className={`${td} text-right tabular-nums`}>
                {formatNumber(totals.entries ?? 0)}
              </td>
              <td className={`${td} text-right tabular-nums`}>
                {formatTaka(totals.amount ?? 0)}
              </td>
              <td className={`${td} text-right tabular-nums`}>100.0%</td>
            </tr>
          </TBody>
        </table>
      </div>
    );
  }

  // Courier breakdown has shipment & COD columns
  if (dimension === "courier") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <THead>
            <th className={`${th} w-12 text-center`}>#</th>
            <th className={th}>Courier</th>
            <th className={`${th} text-right`}>Shipments</th>
            <th className={`${th} text-right`}>Delivered / Ret.</th>
            <th className={`${th} text-right`}>Order Sales</th>
            <th className={`${th} text-right`}>Shipping Charged</th>
            <th className={`${th} text-right`}>Courier Fees</th>
            <th className={`${th} text-right`}>Shipping Subsidy</th>
            <th className={`${th} text-right`}>COD Collected</th>
            <th className={`${th} text-right`}>Share</th>
          </THead>
          <TBody>
            {rows.map((r, idx) => (
              <tr key={String(r.key)} className="hover:bg-slate-50/70">
                <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                  {idx + 1}
                </td>
                <td className={`${td} font-semibold text-slate-900`}>{r.name}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatNumber(r.shipments ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums text-xs`}>
                  <span className="text-emerald-700 font-semibold">{r.delivered ?? 0}</span> /{" "}
                  <span className="text-rose-600">{r.returned ?? 0}</span>
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatTaka(r.net_sales ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatTaka(r.shipping_charged ?? 0)}
                </td>
                <td className={`${td} text-right font-semibold text-rose-600 tabular-nums`}>
                  {formatTaka(r.courier_fees ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatTaka(r.shipping_subsidy ?? 0)}
                </td>
                <td className={`${td} text-right font-semibold text-emerald-700 tabular-nums`}>
                  {formatTaka(r.cod_collected ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatBp(r.share_bp)}</td>
              </tr>
            ))}
          </TBody>
        </table>
      </div>
    );
  }

  // Payment method breakdown includes Collected, Due, Collection Rate
  if (dimension === "payment_method") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <THead>
            <th className={`${th} w-12 text-center`}>#</th>
            <th className={th}>Payment Method</th>
            <th className={`${th} text-right`}>Orders</th>
            <th className={`${th} text-right`}>Net Sales</th>
            <th className={`${th} text-right`}>Collected</th>
            <th className={`${th} text-right`}>Due</th>
            <th className={`${th} text-right`}>Collection Rate</th>
            <th className={`${th} text-right`}>Gross Profit</th>
            <th className={`${th} text-right`}>Share</th>
          </THead>
          <TBody>
            {rows.map((r, idx) => (
              <tr key={String(r.key)} className="hover:bg-slate-50/70">
                <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
                  {idx + 1}
                </td>
                <td className={`${td} font-semibold text-slate-900`}>{r.name}</td>
                <td className={`${td} text-right tabular-nums`}>{formatNumber(r.orders ?? 0)}</td>
                <td className={`${td} text-right font-semibold tabular-nums`}>
                  {formatTaka(r.net_sales ?? 0)}
                </td>
                <td className={`${td} text-right text-emerald-700 font-semibold tabular-nums`}>
                  {formatTaka(r.collected ?? 0)}
                </td>
                <td className={`${td} text-right text-amber-700 tabular-nums`}>
                  {formatTaka(r.due ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatBp(r.collection_rate_bp)}
                </td>
                <td className={`${td} text-right font-semibold tabular-nums`}>
                  {formatTaka(r.gross_profit ?? 0)}
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatBp(r.share_bp)}</td>
              </tr>
            ))}
          </TBody>
        </table>
      </div>
    );
  }

  // Standard Product / Category / Brand / Source / Customer Group profit breakdown table
  const renderStandardRow = (r: AccountingBreakdownRow, idxLabel: React.ReactNode, isMuted = false) => (
    <tr
      key={String(r.key)}
      className={isMuted ? "bg-slate-50/70 text-slate-500 italic" : "hover:bg-slate-50/70"}
    >
      <td className={`${td} text-center text-xs font-semibold text-slate-400 tabular-nums`}>
        {idxLabel}
      </td>
      <td className={td}>
        <div className="font-semibold text-slate-900 flex items-center gap-2">
          <span>{r.name}</span>
          {(r.items_without_cost ?? 0) > 0 && (
            <Badge tone="amber">{r.items_without_cost} no-cost</Badge>
          )}
        </div>
      </td>
      <td className={`${td} text-right tabular-nums`}>
        {formatNumber(r.quantity ?? r.orders ?? 0)}
      </td>
      <td className={`${td} text-right tabular-nums`}>{formatTaka(r.gross_sales ?? 0)}</td>
      <td className={`${td} text-right text-rose-600 tabular-nums`}>
        {formatTaka((r.discounts ?? 0) + (r.returns ?? 0))}
      </td>
      <td className={`${td} text-right font-semibold text-slate-900 tabular-nums`}>
        {formatTaka(r.net_sales ?? 0)}
      </td>
      <td className={`${td} text-right text-amber-700 tabular-nums`}>
        {formatTaka(r.cogs ?? 0)}
      </td>
      <td
        className={`${td} text-right font-bold tabular-nums ${
          (r.gross_profit ?? 0) >= 0 ? "text-emerald-700" : "text-rose-600"
        }`}
      >
        {formatTaka(r.gross_profit ?? 0)}
      </td>
      <td className={`${td} text-right tabular-nums`}>{formatBp(r.margin_bp)}</td>
      <td className={`${td} text-right tabular-nums`}>{formatBp(r.share_bp)}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <THead>
          <th className={`${th} w-12 text-center`}>#</th>
          <th className={th}>Name</th>
          <th className={`${th} text-right`}>
            {dimension === "product" || dimension === "category" || dimension === "brand"
              ? "Units Sold"
              : "Orders"}
          </th>
          <th className={`${th} text-right`}>Gross Sales</th>
          <th className={`${th} text-right`}>Disc. & Ret.</th>
          <th className={`${th} text-right`}>Net Sales</th>
          <th className={`${th} text-right`}>COGS</th>
          <th className={`${th} text-right`}>Gross Profit</th>
          <th className={`${th} text-right`}>Margin</th>
          <th className={`${th} text-right`}>Share</th>
        </THead>
        <TBody>
          {rows.map((r, idx) => renderStandardRow(r, idx + 1, false))}
          {others && renderStandardRow(others, "—", true)}
          <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200">
            <td className={td} />
            <td className={td}>Total</td>
            <td className={`${td} text-right tabular-nums`}>
              {formatNumber(totals.quantity ?? totals.orders ?? 0)}
            </td>
            <td className={`${td} text-right tabular-nums`}>
              {formatTaka(totals.gross_sales ?? 0)}
            </td>
            <td className={`${td} text-right text-rose-600 tabular-nums`}>
              {formatTaka((totals.discounts ?? 0) + (totals.returns ?? 0))}
            </td>
            <td className={`${td} text-right tabular-nums`}>
              {formatTaka(totals.net_sales ?? 0)}
            </td>
            <td className={`${td} text-right text-amber-800 tabular-nums`}>
              {formatTaka(totals.cogs ?? 0)}
            </td>
            <td className={`${td} text-right text-emerald-700 tabular-nums`}>
              {formatTaka(totals.gross_profit ?? 0)}
            </td>
            <td className={`${td} text-right tabular-nums`}>
              {totals.net_sales > 0
                ? formatBp(Math.round((totals.gross_profit / totals.net_sales) * 10000))
                : "—"}
            </td>
            <td className={`${td} text-right tabular-nums`}>100.0%</td>
          </tr>
        </TBody>
      </table>
    </div>
  );
}
