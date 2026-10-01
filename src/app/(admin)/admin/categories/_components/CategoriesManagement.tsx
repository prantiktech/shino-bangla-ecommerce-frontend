"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Move,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AdminCategoryResource,
  createAdminCategoryAction,
  updateAdminCategoryAction,
  deleteAdminCategoryAction,
  moveAdminCategoryAction,
  getAdminCategoriesAction,
} from "@/app/(admin)/actions/categories";
import { uploadAdminMediaAction } from "@/app/(admin)/actions/media";

interface CategoriesManagementProps {
  initialCategories: AdminCategoryResource[];
}

export function CategoriesManagement({ initialCategories }: CategoriesManagementProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategoryResource[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AdminCategoryResource | null>(null);

  // Form States (Create & Edit)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [vatRateBp, setVatRateBp] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [iconImageId, setIconImageId] = useState<number | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [bannerImageId, setBannerImageId] = useState<number | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  // Move Form State
  const [moveParentId, setMoveParentId] = useState<number>(0);
  const [movePosition, setMovePosition] = useState<number>(0);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Slug generator helper
  const handleNameChange = (val: string, isCreate: boolean) => {
    setName(val);
    if (isCreate) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  // Open Create Modal
  const openCreateModal = (presetParentId: number = 0) => {
    setError(null);
    setSuccess(null);
    setName("");
    setSlug("");
    setParentId(presetParentId);
    setDescription("");
    setVatRateBp(0);
    setIsActive(true);
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywords("");
    setIconImageId(null);
    setIconPreviewUrl(null);
    setBannerImageId(null);
    setBannerPreviewUrl(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (cat: AdminCategoryResource) => {
    setError(null);
    setSuccess(null);
    setActiveCategory(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setParentId(cat.parent_id || 0);
    setDescription(cat.description || "");
    setVatRateBp(cat.vat_rate_bp || 0);
    setIsActive(cat.is_active ?? true);
    setSeoTitle(cat.seo_title || "");
    setSeoDescription(cat.seo_description || "");
    setSeoKeywords(cat.seo_keywords || "");
    setIconImageId(cat.icon?.id || null);
    setIconPreviewUrl(cat.icon?.url || null);
    setBannerImageId(cat.banner?.id || null);
    setBannerPreviewUrl(cat.banner?.url || null);
    setIsEditModalOpen(true);
  };

  // Open Move Modal
  const openMoveModal = (cat: AdminCategoryResource) => {
    setError(null);
    setSuccess(null);
    setActiveCategory(cat);
    setMoveParentId(cat.parent_id || 0);
    setMovePosition(0);
    setIsMoveModalOpen(true);
  };

  // Handle Icon Upload
  const handleUploadMedia = async (
    file: File,
    type: "icon" | "banner"
  ) => {
    if (type === "icon") setIsUploadingIcon(true);
    else setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadAdminMediaAction(formData);
      if (res.success) {
        if (type === "icon") {
          setIconImageId(res.data.id);
          setIconPreviewUrl(res.data.url);
        } else {
          setBannerImageId(res.data.id);
          setBannerPreviewUrl(res.data.url);
        }
      } else {
        setError(res.error?.message || `Failed to upload ${type} image.`);
      }
    } catch {
      setError(`Failed to upload ${type} image.`);
    } finally {
      if (type === "icon") setIsUploadingIcon(false);
      else setIsUploadingBanner(false);
    }
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createAdminCategoryAction({
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-"),
        parent_id: parentId ? Number(parentId) : 0,
        description: description.trim(),
        vat_rate_bp: Number(vatRateBp),
        is_active: isActive,
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        seo_keywords: seoKeywords.trim(),
        icon_image_id: iconImageId,
        banner_image_id: bannerImageId,
      });

      if (res.success) {
        setSuccess(`Category "${name}" created successfully!`);
        setIsCreateModalOpen(false);
        refreshCategoryList();
      } else {
        setError(res.error?.message || "Failed to create category");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateAdminCategoryAction(activeCategory.id, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        vat_rate_bp: Number(vatRateBp),
        is_active: isActive,
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        seo_keywords: seoKeywords.trim(),
        icon_image_id: iconImageId,
        banner_image_id: bannerImageId,
      });

      if (res.success) {
        setSuccess(`Category "${name}" updated successfully!`);
        setIsEditModalOpen(false);
        refreshCategoryList();
      } else {
        setError(res.error?.message || "Failed to update category");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Move
  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await moveAdminCategoryAction(activeCategory.id, {
        parent_id: Number(moveParentId),
        position: Number(movePosition),
      });

      if (res.success) {
        setSuccess(`Category "${activeCategory.name}" moved successfully!`);
        setIsMoveModalOpen(false);
        refreshCategoryList();
      } else {
        setError(res.error?.message || "Failed to move category");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`Are you sure you want to permanently delete category "${catName}"?`)) return;

    try {
      const res = await deleteAdminCategoryAction(id);
      if (res.success) {
        setSuccess(`Category "${catName}" deleted.`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        refreshCategoryList();
      } else {
        setError(res.error?.message || "Failed to delete category");
      }
    } catch {
      setError("Failed to delete category. Ensure no products are currently assigned to it.");
    }
  };

  // Refresh Category List
  const refreshCategoryList = async () => {
    const res = await getAdminCategoriesAction();
    if (res.success && res.data) {
      setCategories(res.data);
    }
    router.refresh();
  };

  // Search filter
  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Categories Architecture
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Hierarchical taxonomy, SEO metadata, VAT configuration, and visual banner management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshCategoryList}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openCreateModal(0)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Total Categories: <strong className="text-slate-900">{categories.length}</strong>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Category & Visuals</th>
                <th className="px-5 py-3.5">Slug / Hierarchy</th>
                <th className="px-5 py-3.5">VAT Rate</th>
                <th className="px-5 py-3.5">Catalog Items</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">SEO Preview</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <FolderTree className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Visuals & Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cat.icon?.url ? (
                          <img
                            src={cat.icon.url}
                            alt={cat.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5B00] flex items-center justify-center font-bold text-xs shrink-0">
                            <FolderTree className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">
                            {cat.name}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug & Hierarchy Depth */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-slate-700 font-semibold">
                          /{cat.slug}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cat.parent_id ? `Child of #${cat.parent_id} (depth: ${cat.depth})` : "Root level"}
                        </span>
                      </div>
                    </td>

                    {/* VAT Rate */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-slate-800 font-semibold text-xs">
                        {(cat.vat_rate_bp / 100).toFixed(cat.vat_rate_bp % 100 === 0 ? 0 : 2)}%
                      </span>
                    </td>

                    {/* Products Count */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full">
                        {cat.products_count ?? 0} products
                      </span>
                    </td>

                    {/* Active Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          cat.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* SEO Preview */}
                    <td className="px-5 py-3.5 max-w-xs">
                      {cat.seo_title || cat.seo_description ? (
                        <div className="flex flex-col text-[11px]">
                          <span className="font-semibold text-slate-800 truncate" title={cat.seo_title || ""}>
                            {cat.seo_title || "Auto Title"}
                          </span>
                          <span className="text-slate-400 truncate text-[10px]" title={cat.seo_description || ""}>
                            {cat.seo_description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Default store SEO</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/category/${cat.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => openMoveModal(cat)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Move / Re-parent category"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-500 hover:text-[#FF5B00] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete category"
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
      </div>

      {/* CREATE CATEGORY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center font-bold">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Create Category</h3>
                  <p className="text-xs text-slate-500">Add a new department or subcategory to your store</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value, true)}
                    placeholder="e.g. Power Tools"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. power-tools"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Parent Category
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  >
                    <option value={0}>None (Top-Level / Root Department)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (/{c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    VAT Rate (Basis Points)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={vatRateBp}
                      onChange={(e) => setVatRateBp(Number(e.target.value))}
                      placeholder="e.g. 1500 for 15%"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                    />
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                      = {(vatRateBp / 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short department overview for customers..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                />
              </div>

              {/* Media Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Icon Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Category Icon</label>
                  <div className="flex items-center gap-3">
                    {iconPreviewUrl ? (
                      <img
                        src={iconPreviewUrl}
                        alt="Icon Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingIcon ? "Uploading..." : "Upload Icon"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadMedia(file, "icon");
                          }}
                        />
                      </label>
                      {iconImageId && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Media ID: #{iconImageId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Category Banner</label>
                  <div className="flex items-center gap-3">
                    {bannerPreviewUrl ? (
                      <img
                        src={bannerPreviewUrl}
                        alt="Banner Preview"
                        className="w-16 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingBanner ? "Uploading..." : "Upload Banner"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadMedia(file, "banner");
                          }}
                        />
                      </label>
                      {bannerImageId && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Media ID: #{bannerImageId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  SEO & Search Engine Metadata
                </span>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="SEO Title (e.g. Best Power Tools Online - Fast Delivery)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="SEO Meta Description..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="SEO Keywords (comma separated)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF5B00] focus:ring-[#FF5B00]"
                />
                <label htmlFor="create_is_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Publish Category immediately (Active on storefront)
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL (PUT /api/v1/admin/categories/{category}) */}
      {isEditModalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsEditModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Edit Category #{activeCategory.id}
                  </h3>
                  <p className="text-xs text-slate-500">Update naming, VAT rate, SEO, and visual assets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value, false)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  VAT Rate (Basis Points)
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    value={vatRateBp}
                    onChange={(e) => setVatRateBp(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    = {(vatRateBp / 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                />
              </div>

              {/* Media Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Category Icon</label>
                  <div className="flex items-center gap-3">
                    {iconPreviewUrl ? (
                      <img
                        src={iconPreviewUrl}
                        alt="Icon Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingIcon ? "Uploading..." : "Change Icon"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadMedia(file, "icon");
                          }}
                        />
                      </label>
                      {iconImageId && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Media ID: #{iconImageId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Category Banner</label>
                  <div className="flex items-center gap-3">
                    {bannerPreviewUrl ? (
                      <img
                        src={bannerPreviewUrl}
                        alt="Banner Preview"
                        className="w-16 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingBanner ? "Uploading..." : "Change Banner"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadMedia(file, "banner");
                          }}
                        />
                      </label>
                      {bannerImageId && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Media ID: #{bannerImageId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  SEO & Search Engine Metadata
                </span>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="SEO Title..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="SEO Meta Description..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="SEO Keywords..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF5B00] focus:ring-[#FF5B00]"
                />
                <label htmlFor="edit_is_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Category is Active (Visible on storefront)
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE CATEGORY MODAL (PUT /api/v1/admin/categories/{category}/move) */}
      {isMoveModalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsMoveModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 animate-in zoom-in-95 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Move Category
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">{activeCategory.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select New Parent Category
                </label>
                <select
                  value={moveParentId}
                  onChange={(e) => setMoveParentId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20"
                >
                  <option value={0}>None (Top-Level / Root Department)</option>
                  {categories
                    .filter((c) => c.id !== activeCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (/{c.slug})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sort Position Index
                </label>
                <input
                  type="number"
                  min="0"
                  value={movePosition}
                  onChange={(e) => setMovePosition(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Determines the display order under the selected parent (0 = first).
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? "Moving..." : "Confirm Move"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
