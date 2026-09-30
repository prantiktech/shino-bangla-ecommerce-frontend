"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { poishaToTaka } from "@/lib/utils/money";
import { createAdminProductAction, deleteAdminProductAction } from "@/app/(admin)/actions/products";

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  price: {
    min: number;
    max?: number;
    compare_at?: number | null;
  };
  in_stock: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  is_trending?: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

interface ProductsManagementProps {
  products: ProductItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  categories: CategoryOption[];
}

export function ProductsManagement({
  products,
  total,
  totalPages,
  currentPage,
  searchQuery,
  categories,
}: ProductsManagementProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?.id ? String(categories[0].id) : ""
  );
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "draft" | "hidden">("active");
  const [priceTaka, setPriceTaka] = useState<number>(0);
  const [costPriceTaka, setCostPriceTaka] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [sku, setSku] = useState("");
  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      // Backend expects integer poisha (৳1 = 100 poisha)
      const pricePoisha = Math.round(priceTaka * 100);
      const costPricePoisha = Math.round(costPriceTaka * 100);

      const payload = {
        name,
        category_id: Number(categoryId),
        short_description: shortDescription,
        description: description ? `<p>${description}</p>` : `<p>${shortDescription}</p>`,
        status,
        is_featured: isFeatured,
        is_new_arrival: isNewArrival,
        variants: [
          {
            sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
            price: pricePoisha,
            cost_price: costPricePoisha > 0 ? costPricePoisha : Math.round(pricePoisha * 0.7),
            stock: Number(stock),
            weight_grams: Number(weightGrams),
          },
        ],
      };

      const res = await createAdminProductAction(payload);
      if (res.success) {
        setSuccess(`Product "${name}" created successfully in backend catalog!`);
        setIsModalOpen(false);
        setName("");
        setShortDescription("");
        setDescription("");
        setPriceTaka(0);
        setSku("");
        router.refresh();
      } else {
        setError(res.error.message || "Failed to create product");
      }
    } catch {
      setError("An unexpected error occurred while saving product.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (!confirm(`Are you sure you want to delete "${prodName}"?`)) return;

    try {
      const res = await deleteAdminProductAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error.message || "Failed to delete product");
      }
    } catch {
      alert("Failed to delete product.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Products Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage live items, prices in poisha (auto-converted to Taka), and inventory status.
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
          Add Product
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form method="GET" className="relative w-full sm:w-80">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search products by title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
        <div className="text-xs text-slate-500 font-semibold">
          Showing <span className="text-slate-900 font-bold">{products.length}</span> of{" "}
          <span className="text-slate-900 font-bold">{total}</span> total
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Product Title</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Price (BDT)</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Flags</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-400">#{p.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">{p.slug}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      ৳ {poishaToTaka(p.price.min).toFixed(2)}
                      {p.price.compare_at && (
                        <span className="text-slate-400 line-through text-[10px] ml-1.5 font-normal">
                          ৳ {poishaToTaka(p.price.compare_at).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.in_stock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_featured && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-[#FF5B00] rounded text-[10px] font-bold">
                            Featured
                          </span>
                        )}
                        {p.is_best_seller && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                            Best Seller
                          </span>
                        )}
                        {p.is_new_arrival && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-[#FF5B00] hover:bg-orange-50 rounded-lg transition-colors"
                          title="View on storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              {currentPage > 1 && (
                <Link
                  href={`/admin/products?page=${currentPage - 1}${searchQuery ? `&q=${searchQuery}` : ""}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/products?page=${currentPage + 1}${searchQuery ? `&q=${searchQuery}` : ""}`}
                  className="px-3 py-1.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-lg text-xs font-semibold"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF5B00] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
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

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Dry Powder Fire Extinguisher 2kg"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent bg-white"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Short Summary</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief 1-sentence product summary"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Detailed Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full specifications, safety guidelines, and application details..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] focus:border-transparent resize-none"
                />
              </div>

              {/* Pricing & Inventory */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Pricing & Default Inventory</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Price (BDT) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={priceTaka || ""}
                      onChange={(e) => setPriceTaka(Number(e.target.value))}
                      placeholder="950"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {Math.round(priceTaka * 100)} poisha
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Cost Price (BDT)</label>
                    <input
                      type="number"
                      min={0}
                      value={costPriceTaka || ""}
                      onChange={(e) => setCostPriceTaka(Number(e.target.value))}
                      placeholder="650"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Stock Qty *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">SKU Code</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="FE-ABC-1KG"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                    />
                  </div>
                </div>
              </div>

              {/* Marketing Flags */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#FF5B00] rounded border-slate-300 focus:ring-[#FF5B00]"
                  />
                  Featured Product
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="w-4 h-4 text-[#FF5B00] rounded border-slate-300 focus:ring-[#FF5B00]"
                  />
                  New Arrival
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
                  disabled={isPending || !name.trim() || priceTaka <= 0}
                  className="px-4 py-2 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
