"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderTree, Plus, ChevronRight, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { createAdminCategoryAction, deleteAdminCategoryAction } from "@/app/(admin)/actions/categories";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  product_count?: number;
  children?: Category[];
}

interface CategoriesManagementProps {
  initialCategories: Category[];
}

export function CategoriesManagement({ initialCategories }: CategoriesManagementProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [vatRateBp, setVatRateBp] = useState<number>(1500); // 15%
  const [isActive, setIsActive] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const payload: any = {
        name,
        vat_rate_bp: Number(vatRateBp),
        is_active: isActive,
      };

      if (parentId) {
        payload.parent_id = Number(parentId);
      }

      const res = await createAdminCategoryAction(payload);
      if (res.success) {
        setSuccess(`Category "${name}" created successfully!`);
        setName("");
        setParentId("");
        setIsModalOpen(false);
        router.refresh();
      } else {
        setError(res.error.message || "Failed to create category");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      const res = await deleteAdminCategoryAction(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        alert(res.error.message || "Failed to delete category");
      }
    } catch {
      alert("Failed to delete category. Ensure no products are currently assigned to it.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Categories Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Unlimited nested category hierarchy supporting SEO fields and VAT configurations.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Category Tree Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Category Tree</h2>
          <span className="text-xs font-semibold text-slate-500">
            {categories.length} Top-level Categories
          </span>
        </div>

        <div className="p-5 divide-y divide-slate-100">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No categories found.</div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5B00] flex items-center justify-center font-bold text-xs">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">/{cat.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      {cat.product_count ?? 0} Products
                    </span>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-xs font-semibold text-[#FF5B00] hover:underline"
                      target="_blank"
                    >
                      View on Store
                    </Link>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories (children) */}
                {cat.children && cat.children.length > 0 && (
                  <div className="ml-11 pl-4 border-l-2 border-slate-150 space-y-2">
                    {cat.children.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-1 text-xs">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{sub.name}</span>
                          <span className="font-mono text-slate-400 text-[10px]">/{sub.slug}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[11px] font-semibold">
                            {sub.product_count ?? 0} items
                          </span>
                          <Link
                            href={`/category/${cat.slug}/${sub.slug}`}
                            className="text-[11px] font-semibold text-slate-500 hover:text-[#FF5B00]"
                            target="_blank"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete subcategory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF5B00] flex items-center justify-center font-bold">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hose Reels, Gas Detectors"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent bg-white"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Leave empty to create a root category.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">VAT Rate (Basis Points)</label>
                <input
                  type="number"
                  value={vatRateBp}
                  onChange={(e) => setVatRateBp(Number(e.target.value))}
                  placeholder="1500"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent"
                />
                <p className="text-[11px] text-slate-400">1500 = 15% VAT, 500 = 5% VAT.</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#FF5B00] rounded border-slate-300 focus:ring-[#FF5B00]"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active (visible on storefront)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="px-4 py-2 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
