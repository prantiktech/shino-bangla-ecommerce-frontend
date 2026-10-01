"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Upload,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Sparkles,
  Sliders,
  Clock,
} from "lucide-react";
import {
  AdminBannerResource,
  createAdminBannerAction,
  updateAdminBannerAction,
  deleteAdminBannerAction,
  getAdminBannersAction,
} from "@/app/(admin)/actions/banners";
import { uploadAdminMediaAction } from "@/app/(admin)/actions/media";

interface BannersManagementProps {
  initialBanners: AdminBannerResource[];
}

export function BannersManagement({ initialBanners }: BannersManagementProps) {
  const router = useRouter();
  const [banners, setBanners] = useState<AdminBannerResource[]>(initialBanners);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<AdminBannerResource | null>(null);
  const [activeBanner, setActiveBanner] = useState<AdminBannerResource | null>(null);

  // Form Fields
  const [type, setType] = useState<string>("slider");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState<number>(0);
  const [startsAt, setStartsAt] = useState<string>("");
  const [endsAt, setEndsAt] = useState<string>("");

  // Media States
  const [imageId, setImageId] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mobileImageId, setMobileImageId] = useState<number | null>(null);
  const [mobileImagePreviewUrl, setMobileImagePreviewUrl] = useState<string | null>(null);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingMobileImage, setIsUploadingMobileImage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format ISO string to input datetime-local "YYYY-MM-DDTHH:mm"
  const toLocalInputValue = (isoStr?: string | null) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  // Format input datetime-local to ISO string
  const toIsoValue = (inputStr: string) => {
    if (!inputStr) return null;
    try {
      const d = new Date(inputStr);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setError(null);
    setSuccess(null);
    setType("slider");
    setTitle("");
    setSubtitle("");
    setButtonLabel("Shop Now");
    setLinkUrl("/products");
    setIsActive(true);
    setPosition(banners.length);
    setStartsAt("");
    setEndsAt("");
    setImageId(null);
    setImagePreviewUrl(null);
    setMobileImageId(null);
    setMobileImagePreviewUrl(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (banner: AdminBannerResource) => {
    setError(null);
    setSuccess(null);
    setActiveBanner(banner);
    setType(banner.type || "slider");
    setTitle(banner.title || "");
    setSubtitle(banner.subtitle || "");
    setButtonLabel(banner.button_label || "");
    setLinkUrl(banner.link_url || "");
    setIsActive(banner.is_active ?? true);
    setPosition(banner.position || 0);
    setStartsAt(toLocalInputValue(banner.starts_at));
    setEndsAt(toLocalInputValue(banner.ends_at));
    setImageId(banner.image?.id || null);
    setImagePreviewUrl(banner.image?.url || null);
    setMobileImageId(banner.mobile_image?.id || null);
    setMobileImagePreviewUrl(banner.mobile_image?.url || null);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (banner: AdminBannerResource) => {
    setError(null);
    setSuccess(null);
    setActiveBanner(banner);
    setIsDeleteModalOpen(true);
  };

  // Refresh Banners
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    const res = await getAdminBannersAction();
    if (res.success) {
      setBanners(res.data);
      setSuccess("Banners list refreshed successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error?.message || "Failed to refresh banners.");
    }
    setIsRefreshing(false);
  };

  // Handle Media Upload
  const handleUploadMedia = async (file: File, target: "desktop" | "mobile") => {
    if (target === "desktop") setIsUploadingImage(true);
    else setIsUploadingMobileImage(true);

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadAdminMediaAction(formData);
    if (res.success) {
      if (target === "desktop") {
        setImageId(res.data.id);
        setImagePreviewUrl(res.data.url);
      } else {
        setMobileImageId(res.data.id);
        setMobileImagePreviewUrl(res.data.url);
      }
    } else {
      setError(res.error?.message || `Failed to upload ${target} image.`);
    }

    if (target === "desktop") setIsUploadingImage(false);
    else setIsUploadingMobileImage(false);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Banner title is required.");
      return;
    }
    if (!imageId) {
      setError("Desktop banner image is required. Please upload or specify a media ID.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createAdminBannerAction({
      type,
      title: title.trim(),
      subtitle: subtitle.trim(),
      button_label: buttonLabel.trim(),
      link_url: linkUrl.trim(),
      is_active: isActive,
      position: Number(position),
      starts_at: toIsoValue(startsAt),
      ends_at: toIsoValue(endsAt),
      image_id: imageId,
      mobile_image_id: mobileImageId,
    });

    if (res.success) {
      setSuccess(`Banner "${res.data.title}" created successfully!`);
      setIsCreateModalOpen(false);
      handleRefresh();
      router.refresh();
    } else {
      setError(res.error?.message || "Failed to create banner.");
    }

    setIsSubmitting(false);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBanner) return;
    if (!title.trim()) {
      setError("Banner title is required.");
      return;
    }
    if (!imageId) {
      setError("Desktop banner image is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await updateAdminBannerAction(activeBanner.id, {
      type,
      title: title.trim(),
      subtitle: subtitle.trim(),
      button_label: buttonLabel.trim(),
      link_url: linkUrl.trim(),
      is_active: isActive,
      position: Number(position),
      starts_at: toIsoValue(startsAt),
      ends_at: toIsoValue(endsAt),
      image_id: imageId,
      mobile_image_id: mobileImageId,
    });

    if (res.success) {
      setSuccess(`Banner "${res.data.title}" updated successfully!`);
      setIsEditModalOpen(false);
      handleRefresh();
      router.refresh();
    } else {
      setError(res.error?.message || "Failed to update banner.");
    }

    setIsSubmitting(false);
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!activeBanner) return;
    setIsSubmitting(true);
    setError(null);

    const res = await deleteAdminBannerAction(activeBanner.id);
    if (res.success) {
      setSuccess(`Banner "${activeBanner.title}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setActiveBanner(null);
      handleRefresh();
      router.refresh();
    } else {
      setError(res.error?.message || "Failed to delete banner.");
    }

    setIsSubmitting(false);
  };

  // Filtered list
  const filteredBanners = banners.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.subtitle && b.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.type && b.type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "all" || b.type === typeFilter;

    let matchesStatus = true;
    const now = new Date();
    const isLive =
      b.is_active &&
      (!b.starts_at || new Date(b.starts_at) <= now) &&
      (!b.ends_at || new Date(b.ends_at) >= now);

    if (statusFilter === "active") {
      matchesStatus = b.is_active;
    } else if (statusFilter === "inactive") {
      matchesStatus = !b.is_active;
    } else if (statusFilter === "live") {
      matchesStatus = isLive;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Schedule status helper
  const getScheduleBadge = (banner: AdminBannerResource) => {
    if (!banner.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <EyeOff className="w-3 h-3" /> Inactive
        </span>
      );
    }

    const now = new Date();
    const starts = banner.starts_at ? new Date(banner.starts_at) : null;
    const ends = banner.ends_at ? new Date(banner.ends_at) : null;

    if (starts && starts > now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> Scheduled
        </span>
      );
    }

    if (ends && ends < now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3" /> Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Sparkles className="w-3 h-3" /> Live Now
      </span>
    );
  };

  const totalBanners = banners.length;
  const activeCount = banners.filter((b) => b.is_active).length;
  const sliderCount = banners.filter((b) => b.type === "slider").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF5B00] flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Banners & Hero Carousels
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Storefront hero sliders, promotional campaigns, scheduling, and destination URLs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Banners */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Banners
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalBanners}</span>
            <span className="text-xs font-semibold text-slate-400">items</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Visual campaign assets stored</p>
        </div>

        {/* Active & Live */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active / Published
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeCount}</span>
            <span className="text-xs font-semibold text-slate-400">active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Visible on storefront</p>
        </div>

        {/* Sliders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Homepage Sliders
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{sliderCount}</span>
            <span className="text-xs font-semibold text-slate-400">slides</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Carousel rotation slides</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, subtitle, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] transition-all"
          >
            <option value="all">All Types</option>
            <option value="slider">Slider (Hero)</option>
            <option value="hero">Hero Single</option>
            <option value="promo">Promo Strip</option>
            <option value="banner">Banner</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live Now</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Banners Grid */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 text-[#FF5B00] flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Banners Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "No banners match your current filter criteria. Try adjusting or clearing your filters."
              : "Get started by adding your first promotional banner or homepage slider."}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Media Preview Header */}
              <div className="relative aspect-[16/8] bg-slate-100 overflow-hidden border-b border-slate-100">
                {banner.image?.url ? (
                  <img
                    src={banner.image.url}
                    alt={banner.image.alt || banner.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-40 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-400">No Image Uploaded</span>
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/80 shadow-xs">
                    {banner.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 backdrop-blur-sm text-slate-600 border border-slate-200/80 shadow-xs">
                    Pos #{banner.position}
                  </span>
                </div>

                <div className="absolute top-3 right-3 shadow-xs">{getScheduleBadge(banner)}</div>

                {/* Mobile Image Indicator */}
                {banner.mobile_image?.url && (
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 backdrop-blur-sm text-slate-700 border border-slate-200/80 flex items-center gap-1 shadow-xs">
                    <Smartphone className="w-3 h-3 text-[#FF5B00]" />
                    Mobile Ready
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-[#FF5B00] transition-colors">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  {banner.button_label && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Button Label:</span>
                      <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {banner.button_label}
                      </span>
                    </div>
                  )}

                  {banner.link_url && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Destination:</span>
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#FF5B00] hover:underline flex items-center gap-1 max-w-[170px] truncate"
                      >
                        {banner.link_url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {(banner.starts_at || banner.ends_at) && (
                    <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-50">
                      <span className="flex items-center gap-1 font-medium text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Schedule:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {banner.starts_at
                          ? new Date(banner.starts_at).toLocaleDateString()
                          : "Start"}{" "}
                        →{" "}
                        {banner.ends_at
                          ? new Date(banner.ends_at).toLocaleDateString()
                          : "Forever"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setPreviewBanner(banner)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Preview
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(banner)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Banner Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {isCreateModalOpen ? "Create New Banner" : "Edit Banner"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure visual images, CTA action link, type, and active scheduling.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit}
              className="p-6 space-y-4"
            >
              {error && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200 font-medium">
                  {error}
                </div>
              )}

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Banner Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Industrial Safety Equipment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 transition-all"
                  >
                    <option value="slider">Slider (Hero)</option>
                    <option value="hero">Hero Single</option>
                    <option value="promo">Promo Strip</option>
                    <option value="banner">Banner</option>
                  </select>
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subtitle / Promo Catchphrase
                </label>
                <input
                  type="text"
                  placeholder="e.g. Up to 30% off certified protective wear and fire extinguishers"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Button Label & Link URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Destination URL
                  </label>
                  <input
                    type="text"
                    placeholder="/products or https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/20 focus:border-[#FF5B00] text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Desktop Image Upload */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#FF5B00]" />
                    <span className="text-xs font-bold text-slate-800">
                      Desktop Banner Image <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  {imageId && (
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Media ID: #{imageId}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {imagePreviewUrl ? (
                    <div className="relative w-full sm:w-48 aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                      <img
                        src={imagePreviewUrl}
                        alt="Desktop Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-48 aspect-[16/9] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-40 text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-400">No desktop image</span>
                    </div>
                  )}

                  <div className="w-full space-y-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#FF5B00]" />
                      {isUploadingImage ? "Uploading..." : "Upload Desktop Banner"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadMedia(file, "desktop");
                        }}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Or Media ID:</span>
                      <input
                        type="number"
                        placeholder="Image ID"
                        value={imageId || ""}
                        onChange={(e) => setImageId(e.target.value ? Number(e.target.value) : null)}
                        className="w-24 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#FF5B00]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Image Upload (Optional) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Mobile Banner Image (Optional)
                    </span>
                  </div>
                  {mobileImageId && (
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Media ID: #{mobileImageId}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {mobileImagePreviewUrl ? (
                    <div className="relative w-full sm:w-24 aspect-[9/16] rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                      <img
                        src={mobileImagePreviewUrl}
                        alt="Mobile Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-24 aspect-[9/16] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white">
                      <Smartphone className="w-5 h-5 mb-1 opacity-40 text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-400">Optional</span>
                    </div>
                  )}

                  <div className="w-full space-y-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      {isUploadingMobileImage ? "Uploading..." : "Upload Mobile Banner"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingMobileImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadMedia(file, "mobile");
                        }}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Or Media ID:</span>
                      <input
                        type="number"
                        placeholder="Mobile ID"
                        value={mobileImageId || ""}
                        onChange={(e) =>
                          setMobileImageId(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-24 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#FF5B00]"
                      />
                      {mobileImageId && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileImageId(null);
                            setMobileImagePreviewUrl(null);
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF5B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ends At
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF5B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Position (Index)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF5B00]"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Active Status
                  </span>
                  <span className="text-[11px] text-slate-500">
                    If disabled, this banner will not be rendered on the customer storefront.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5B00]"></div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#FF5B00] hover:bg-[#E64E00] rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreateModalOpen ? "Create Banner" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && activeBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Delete Banner</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{activeBanner.title}"</span>? This action cannot be undone.
              </p>
            </div>

            {activeBanner.image?.url && (
              <div className="aspect-[16/8] rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                <img
                  src={activeBanner.image.url}
                  alt={activeBanner.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setActiveBanner(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#FF5B00]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Storefront Preview: {previewBanner.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewBanner(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Desktop Viewport Preview */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600">
                  <Monitor className="w-4 h-4 text-slate-500" /> Desktop Viewport (21:9)
                </div>
                <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 text-white flex items-center p-8 sm:p-12 shadow-md">
                  {previewBanner.image?.url && (
                    <img
                      src={previewBanner.image.url}
                      alt={previewBanner.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent"></div>

                  <div className="relative z-10 max-w-lg space-y-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FF5B00] text-white uppercase tracking-wider shadow-sm">
                      {previewBanner.type}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                      {previewBanner.title}
                    </h2>
                    {previewBanner.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                        {previewBanner.subtitle}
                      </p>
                    )}
                    {previewBanner.button_label && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5B00] text-white text-xs font-bold rounded-xl shadow-sm">
                          {previewBanner.button_label}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Viewport Preview (if mobile image exists) */}
              {previewBanner.mobile_image?.url && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600">
                    <Smartphone className="w-4 h-4 text-slate-500" /> Mobile Viewport (9:16)
                  </div>
                  <div className="max-w-xs mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 text-white relative flex flex-col justify-end p-5 shadow-md border-4 border-slate-200">
                    <img
                      src={previewBanner.mobile_image.url}
                      alt={previewBanner.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    <div className="relative z-10 space-y-2">
                      <h4 className="text-base font-bold text-white">{previewBanner.title}</h4>
                      {previewBanner.subtitle && (
                        <p className="text-[11px] text-slate-200">{previewBanner.subtitle}</p>
                      )}
                      {previewBanner.button_label && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF5B00] text-white text-[11px] font-bold rounded-lg shadow-sm">
                          {previewBanner.button_label}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
