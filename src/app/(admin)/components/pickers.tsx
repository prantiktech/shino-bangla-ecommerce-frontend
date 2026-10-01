"use client";

import React, { useRef, useState } from "react";
import { Package, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAdminVariantsAction, VariantOption } from "../actions/variants";
import { getAdminProductsAction } from "../actions/products";
import { Input, Spinner, useDebouncedCallback } from "./ui";
import { formatTaka } from "./format";

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const handler = (e: React.FocusEvent) => {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) onOutside();
  };
  return { ref, onBlur: handler };
}

/** Search box that lists matching product variants; calls `onPick` for each choice. */
export function VariantPicker({
  onPick,
  excludeIds = [],
  placeholder = "Search by product name or SKU",
}: {
  onPick: (v: VariantOption) => void;
  excludeIds?: number[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VariantOption[]>([]);
  const { ref, onBlur } = useClickOutside(() => setOpen(false));

  const search = useDebouncedCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const res = await searchAdminVariantsAction(term.trim());
    setResults(res.success ? res.data.data : []);
    setLoading(false);
  });

  const visible = results.filter((r) => !excludeIds.includes(r.variant_id));

  return (
    <div ref={ref} onBlur={onBlur} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <Input
        value={q}
        placeholder={placeholder}
        className="pl-9"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setLoading(true);
          search(e.target.value);
        }}
      />
      {open && q.trim() && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 max-h-72 overflow-y-auto py-1">
          {loading ? (
            <div className="flex justify-center py-5">
              <Spinner />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500">No matching variants.</p>
          ) : (
            visible.map((v) => (
              <button
                key={v.variant_id}
                type="button"
                onClick={() => {
                  onPick(v);
                  setQ("");
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">
                    {v.product.name}
                    {v.label ? <span className="text-slate-500"> · {v.label}</span> : null}
                  </span>
                  <span className="block text-xs text-slate-500 font-mono">{v.sku}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-xs text-slate-500">Stock {v.stock}</span>
                  {v.cost_price !== null && <span className="block text-xs text-slate-400">Cost {formatTaka(v.cost_price)}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export interface ProductRef {
  id: number;
  name: string;
}

/** Multi-select of products, shown as removable chips. */
export function ProductPicker({
  value,
  onChange,
  max = 50,
  excludeIds = [],
  placeholder = "Search products to add",
}: {
  value: ProductRef[];
  onChange: (v: ProductRef[]) => void;
  max?: number;
  excludeIds?: number[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductRef[]>([]);
  const { ref, onBlur } = useClickOutside(() => setOpen(false));

  const search = useDebouncedCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const res = await getAdminProductsAction({ q: term.trim(), per_page: 15 });
    setResults(res.success ? res.data.data.map((p) => ({ id: p.id, name: p.name })) : []);
    setLoading(false);
  });

  const taken = new Set([...value.map((v) => v.id), ...excludeIds]);
  const visible = results.filter((r) => !taken.has(r.id));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700"
            >
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="max-w-[200px] truncate">{p.name}</span>
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(value.filter((v) => v.id !== p.id))}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      {value.length < max && (
        <div ref={ref} onBlur={onBlur} className="relative">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={q}
            placeholder={placeholder}
            className="pl-9"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setLoading(true);
              search(e.target.value);
            }}
          />
          {open && q.trim() && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 max-h-64 overflow-y-auto py-1">
              {loading ? (
                <div className="flex justify-center py-5">
                  <Spinner />
                </div>
              ) : visible.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-500">No matching products.</p>
              ) : (
                visible.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange([...value, p]);
                      setQ("");
                      setResults([]);
                    }}
                    className={cn("w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer")}
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
