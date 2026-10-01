"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  Edit2,
  ExternalLink,
  ImageIcon,
  Layers,
  Package,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  AdminProductListItem,
  BulkProductPayload,
  ProductFlag,
  ProductStatus,
  bulkAdminProductsAction,
  deleteAdminProductAction,
  duplicateAdminProductAction,
  getAdminProductsAction,
  updateAdminProductStatusAction,
} from "@/app/(admin)/actions/products";
import type { OptionType } from "@/app/(admin)/actions/option-types";
import type { Paginated } from "@/app/(admin)/actions/_request";
import {
  Badge,
  BadgeTone,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  LoadingRows,
  Modal,
  MoneyInput,
  NoticeBanner,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  TableShell,
  TBody,
  THead,
  td,
  th,
  useDebouncedCallback,
  useNotice,
} from "@/app/(admin)/components/ui";
import { downloadUrl, formatDateTime, formatTaka, percentToBp, takaToPoisha } from "@/app/(admin)/components/format";
import { ProductFormModal } from "./ProductFormModal";
import { ImportProductsModal, BulkImagesModal } from "./ProductImportModals";

export type Option = { id: number; name: string; depth?: number };

const STATUS_TONE: Record<ProductStatus, BadgeTone> = { active: "green", draft: "slate", hidden: "amber" };
const FLAG_LABEL: Record<ProductFlag, string> = {
  featured: "Featured",
  trending: "Trending",
  new_arrival: "New arrival",
  best_seller: "Best seller",
};

interface Filters {
  q: string;
  status: string;
  category_id: string;
  brand_id: string;
  stock: string;
  flag: string;
  sort: string;
}

const emptyFilters: Filters = { q: "", status: "", category_id: "", brand_id: "", stock: "", flag: "", sort: "" };

type BulkKind = "price" | "stock" | null;

export function ProductsManagement({
  initial,
  initialQuery = "",
  categories,
  brands,
  optionTypes,
  initialError,
}: {
  initial: Paginated<AdminProductListItem>;
  initialQuery?: string;
  categories: Option[];
  brands: Option[];
  optionTypes: OptionType[];
  initialError: string | null;
}) {
  const [list, setList] = useState(initial);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, q: initialQuery });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const { notice, success, error, clear } = useNotice();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");

  const [deleting, setDeleting] = useState<AdminProductListItem | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [bulkKind, setBulkKind] = useState<BulkKind>(null);
  const [bulkMode, setBulkMode] = useState("set");
  const [bulkValue, setBulkValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<number | null>(null);

  const load = async (next: Partial<Filters> = {}, nextPage = page) => {
    const f = { ...filters, ...next };
    setLoading(true);
    const res = await getAdminProductsAction({ ...f, page: nextPage, per_page: 25 });
    setLoading(false);
    if (res.success) {
      setList(res.data);
      setSelected((s) => s.filter((id) => res.data.data.some((p) => p.id === id)));
    } else error(res.error.message);
  };

  const applyFilter = (k: keyof Filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
    load({ [k]: v }, 1);
  };
  const debouncedQ = useDebouncedCallback((term: string) => {
    setPage(1);
    load({ q: term }, 1);
  });

  const filtersActive = Object.entries(filters).some(([k, v]) => k !== "sort" && v);
  const allOnPage = list.data.length > 0 && list.data.every((p) => selected.includes(p.id));

  const runBulk = async (payload: Omit<BulkProductPayload, "ids">, message: string) => {
    if (!selected.length) return;
    setBusy(true);
    const res = await bulkAdminProductsAction({ ...payload, ids: selected } as BulkProductPayload);
    setBusy(false);
    if (!res.success) return error(res.error.message);
    success(`${message} (${res.data.products} product${res.data.products === 1 ? "" : "s"}).`);
    setSelected([]);
    setBulkKind(null);
    setBulkDelete(false);
    load();
  };

  const submitBulkValue = () => {
    if (bulkKind === "stock") {
      const v = Math.round(Number(bulkValue));
      if (!Number.isFinite(v)) return error("Enter a whole number.");
      if (bulkMode === "set" && v < 0) return error("Stock cannot be negative.");
      runBulk({ action: "stock", mode: bulkMode as BulkProductPayload["mode"], value: v }, "Stock updated");
    } else if (bulkKind === "price") {
      const isPercent = bulkMode.endsWith("percent");
      const v = isPercent ? percentToBp(bulkValue) : takaToPoisha(bulkValue);
      if (v === null || v < 0) return error("Enter a valid amount.");
      if (isPercent && v > 10000) return error("Percentages cannot exceed 100%.");
      runBulk({ action: "price", mode: bulkMode as BulkProductPayload["mode"], value: v }, "Prices updated");
    }
  };

  const changeStatus = async (p: AdminProductListItem, status: ProductStatus) => {
    setRowBusy(p.id);
    const res = await updateAdminProductStatusAction(p.id, status);
    setRowBusy(null);
    if (!res.success) return error(res.error.message);
    setList((l) => ({ ...l, data: l.data.map((x) => (x.id === p.id ? { ...x, status } : x)) }));
    success(`"${p.name}" is now ${status}.`);
  };

  const duplicate = async (p: AdminProductListItem) => {
    setRowBusy(p.id);
    const res = await duplicateAdminProductAction(p.id);
    setRowBusy(null);
    if (!res.success) return error(res.error.message);
    success(`Copied as draft "${res.data.name}". Stock starts at zero.`);
    load();
    setEditId(res.data.id);
    setFormOpen(true);
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await deleteAdminProductAction(deleting.id);
    setBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`"${deleting.name}" deleted.`);
      load();
    }
    setDeleting(null);
  };

  const exportHref = downloadUrl("/admin/products/export", {
    format: exportFormat,
    status: filters.status,
    brand_id: filters.brand_id,
    category_id: filters.category_id,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Layers}
        title="Products"
        description="Catalogue items, their variants, prices, stock and visibility."
        actions={
          <>
            <Button variant="secondary" icon={Upload} onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button variant="secondary" icon={Download} onClick={() => setExportOpen(true)}>
              Export
            </Button>
            <Button variant="secondary" icon={ImageIcon} onClick={() => setImagesOpen(true)}>
              Bulk images
            </Button>
            <Button
              icon={Plus}
              onClick={() => {
                setEditId(null);
                setFormOpen(true);
              }}
            >
              New product
            </Button>
          </>
        }
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        <SearchInput
          value={filters.q}
          onChange={(v) => {
            setFilters((f) => ({ ...f, q: v }));
            debouncedQ(v);
          }}
          placeholder="Search name or SKU"
          className="col-span-2"
        />
        <Select value={filters.status} onChange={(e) => applyFilter("status", e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
        </Select>
        <Select value={filters.category_id} onChange={(e) => applyFilter("category_id", e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.depth ?? 0)}
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filters.brand_id} onChange={(e) => applyFilter("brand_id", e.target.value)} aria-label="Brand">
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select value={filters.stock} onChange={(e) => applyFilter("stock", e.target.value)} aria-label="Stock">
          <option value="">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </Select>
        <Select value={filters.flag} onChange={(e) => applyFilter("flag", e.target.value)} aria-label="Flag">
          <option value="">Any flag</option>
          {Object.entries(FLAG_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={filters.sort} onChange={(e) => applyFilter("sort", e.target.value)} className="w-48" aria-label="Sort">
            <option value="">Recently updated</option>
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => {
                setFilters(emptyFilters);
                setPage(1);
                load(emptyFilters, 1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <span className="text-xs text-slate-500">{list.meta.total} products</span>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-lg">
          <span className="text-sm font-semibold mr-2">{selected.length} selected</span>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value as ProductStatus;
              if (v) runBulk({ action: "status", status: v }, `Status set to ${v}`);
            }}
            className="h-8 w-40 text-xs bg-slate-800 border-slate-700 text-white"
            aria-label="Set status"
            disabled={busy}
          >
            <option value="">Set status…</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const [flag, on] = e.target.value.split(":");
              if (flag) runBulk({ action: "flag", flag: flag as ProductFlag, value: on === "1" }, `${FLAG_LABEL[flag as ProductFlag]} ${on === "1" ? "added" : "removed"}`);
            }}
            className="h-8 w-44 text-xs bg-slate-800 border-slate-700 text-white"
            aria-label="Set flag"
            disabled={busy}
          >
            <option value="">Flags…</option>
            {Object.entries(FLAG_LABEL).map(([v, l]) => (
              <React.Fragment key={v}>
                <option value={`${v}:1`}>Mark {l.toLowerCase()}</option>
                <option value={`${v}:0`}>Unmark {l.toLowerCase()}</option>
              </React.Fragment>
            ))}
          </Select>
          <Button size="sm" variant="secondary" onClick={() => { setBulkKind("price"); setBulkMode("increase_percent"); setBulkValue(""); }}>
            Adjust price
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setBulkKind("stock"); setBulkMode("add"); setBulkValue(""); }}>
            Adjust stock
          </Button>
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => setBulkDelete(true)}>
            Delete
          </Button>
          <button type="button" onClick={() => setSelected([])} className="ml-auto text-xs text-slate-300 hover:text-white">
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <TableShell>
        <THead>
          <th className={`${th} w-10`}>
            <input
              type="checkbox"
              aria-label="Select all on this page"
              className="w-4 h-4 accent-[var(--color-primary)]"
              checked={allOnPage}
              onChange={() =>
                setSelected(allOnPage ? selected.filter((id) => !list.data.some((p) => p.id === id)) : [...new Set([...selected, ...list.data.map((p) => p.id)])])
              }
            />
          </th>
          <th className={th}>Product</th>
          <th className={th}>Category</th>
          <th className={`${th} text-right`}>Price</th>
          <th className={`${th} text-right`}>Stock</th>
          <th className={th}>Status</th>
          <th className={th}>Updated</th>
          <th className={`${th} text-right`}>Actions</th>
        </THead>
        <TBody>
          {loading ? (
            <LoadingRows cols={8} />
          ) : list.data.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <EmptyState
                  icon={Package}
                  title={filtersActive ? "No products match these filters" : "No products yet"}
                  description={filtersActive ? "Clear the filters to see everything." : "Create a product or import a spreadsheet."}
                />
              </td>
            </tr>
          ) : (
            list.data.map((p) => {
              const flags = (
                [
                  p.is_featured && "Featured",
                  p.is_trending && "Trending",
                  p.is_new_arrival && "New",
                  p.is_best_seller && "Best seller",
                ].filter(Boolean) as string[]
              );
              return (
                <tr key={p.id} className={selected.includes(p.id) ? "bg-brand-50/40" : "hover:bg-slate-50/60"}>
                  <td className={td}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                      checked={selected.includes(p.id)}
                      onChange={() => setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                    />
                  </td>
                  <td className={td}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(p.id);
                        setFormOpen(true);
                      }}
                      className="flex items-center gap-3 text-left cursor-pointer group"
                    >
                      <span className="w-11 h-11 rounded-lg bg-slate-100 ring-1 ring-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {p.image?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-primary truncate max-w-[260px]">{p.name}</span>
                        <span className="block text-xs text-slate-500">
                          <span className="font-mono">{p.sku ?? "—"}</span>
                          {p.variants_count > 1 && <> · {p.variants_count} variants</>}
                          {p.brand && <> · {p.brand.name}</>}
                        </span>
                        {flags.length > 0 && (
                          <span className="flex gap-1 mt-1">
                            {flags.map((f) => (
                              <Badge key={f} tone="orange">
                                {f}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  </td>
                  <td className={`${td} text-xs`}>{p.category?.name ?? "—"}</td>
                  <td className={`${td} text-right tabular-nums whitespace-nowrap`}>
                    {p.min_price === p.max_price ? formatTaka(p.min_price) : `${formatTaka(p.min_price)} – ${formatTaka(p.max_price)}`}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    <span className={p.stock_total === 0 ? "text-rose-600 font-semibold" : p.in_stock ? "" : "text-amber-600"}>{p.stock_total}</span>
                  </td>
                  <td className={td}>
                    <Select
                      value={p.status}
                      disabled={rowBusy === p.id}
                      onChange={(e) => changeStatus(p, e.target.value as ProductStatus)}
                      aria-label={`Status of ${p.name}`}
                      className={`h-8 w-28 text-xs font-semibold ${
                        STATUS_TONE[p.status] === "green" ? "text-emerald-700" : STATUS_TONE[p.status] === "amber" ? "text-amber-700" : "text-slate-600"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="hidden">Hidden</option>
                    </Select>
                  </td>
                  <td className={`${td} text-xs whitespace-nowrap`}>{formatDateTime(p.updated_at)}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <span className="inline-flex gap-0.5">
                      {p.status === "active" && (
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          title="View on storefront"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <IconButton
                        label="Edit product"
                        icon={Edit2}
                        tone="primary"
                        onClick={() => {
                          setEditId(p.id);
                          setFormOpen(true);
                        }}
                      />
                      <IconButton label="Duplicate as draft" icon={Copy} disabled={rowBusy === p.id} onClick={() => duplicate(p)} />
                      <IconButton label="Delete product" icon={Trash2} tone="danger" onClick={() => setDeleting(p)} />
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </TBody>
      </TableShell>

      <Pagination
        meta={list.meta}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          load({}, p);
        }}
      />

      <ProductFormModal
        open={formOpen}
        productId={editId}
        categories={categories}
        brands={brands}
        optionTypes={optionTypes}
        onClose={() => setFormOpen(false)}
        onSaved={(name, created) => {
          setFormOpen(false);
          success(created ? `"${name}" created.` : `"${name}" saved.`);
          load();
        }}
      />

      <ImportProductsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onFinished={(msg) => {
          success(msg);
          load();
        }}
      />
      <BulkImagesModal
        open={imagesOpen}
        onClose={() => setImagesOpen(false)}
        onFinished={(msg) => {
          success(msg);
          load();
        }}
      />

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export products"
        description="Downloads every product matching the current status, category and brand filters."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <a
              href={exportHref}
              onClick={() => setTimeout(() => setExportOpen(false), 300)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </>
        }
      >
        <Field label="File format">
          <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as "xlsx" | "csv")}>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
          </Select>
        </Field>
      </Modal>

      <Modal
        open={bulkKind !== null}
        onClose={() => setBulkKind(null)}
        title={bulkKind === "price" ? "Adjust prices" : "Adjust stock"}
        description={`Applies to every variant of the ${selected.length} selected product${selected.length === 1 ? "" : "s"}.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkKind(null)} disabled={busy}>
              Cancel
            </Button>
            <Button loading={busy} onClick={submitBulkValue}>
              Apply
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Change">
            <Select value={bulkMode} onChange={(e) => setBulkMode(e.target.value)}>
              {bulkKind === "price" ? (
                <>
                  <option value="increase_percent">Increase by %</option>
                  <option value="decrease_percent">Decrease by %</option>
                  <option value="increase_amount">Increase by amount</option>
                  <option value="decrease_amount">Decrease by amount</option>
                  <option value="set">Set price to</option>
                </>
              ) : (
                <>
                  <option value="add">Add to stock (use a negative number to remove)</option>
                  <option value="set">Set stock to</option>
                </>
              )}
            </Select>
          </Field>
          <Field label="Value">
            {bulkKind === "price" && !bulkMode.endsWith("percent") ? (
              <MoneyInput value={bulkValue} onChange={setBulkValue} />
            ) : (
              <Input type="number" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} step={bulkKind === "stock" ? 1 : 0.01} />
            )}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete product?"
        message={<><strong className="text-slate-900">{deleting?.name}</strong> and all its variants will be deleted. To take it off sale without losing it, set it to Hidden.</>}
        confirmLabel="Delete product"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
      <ConfirmDialog
        open={bulkDelete}
        title={`Delete ${selected.length} products?`}
        message="The selected products and all their variants will be deleted permanently."
        confirmLabel="Delete products"
        loading={busy}
        onConfirm={() => runBulk({ action: "delete" }, "Products deleted")}
        onClose={() => setBulkDelete(false)}
      />
    </div>
  );
}
