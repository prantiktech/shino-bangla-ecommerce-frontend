"use client";

import React, { useState } from "react";
import {
  RoleResource,
  createAdminRoleAction,
  updateAdminRoleAction,
  deleteAdminRoleAction,
  getAdminRolesAction,
  getAdminRoleDetailAction,
} from "@/app/(admin)/actions/roles";
import {
  ShieldCheck,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Key,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  Lock,
  Layers,
  ShoppingBag,
  Tag,
  FileText,
  BarChart3,
  Truck,
  Eye,
  RefreshCw,
} from "lucide-react";

// Categorized permissions with labels
export const PERMISSION_GROUPS = [
  {
    category: "Products & Catalogue",
    icon: Layers,
    permissions: [
      { key: "products.view", label: "View Products", desc: "Browse products and search catalogue" },
      { key: "products.create", label: "Create Products", desc: "Add new products and variants" },
      { key: "products.update", label: "Edit Products", desc: "Update pricing, descriptions, and stock" },
      { key: "products.delete", label: "Delete Products", desc: "Remove products from store" },
      { key: "products.import", label: "Import CSV", desc: "Bulk import products via CSV" },
      { key: "products.export", label: "Export CSV", desc: "Export product inventory to CSV" },
      { key: "categories.view", label: "View Categories", desc: "View category hierarchy" },
      { key: "categories.create", label: "Create Categories", desc: "Create new categories and subcategories" },
      { key: "categories.update", label: "Edit Categories", desc: "Update category name and icon" },
      { key: "categories.delete", label: "Delete Categories", desc: "Remove categories" },
      { key: "brands.view", label: "View Brands", desc: "View manufacturer brands" },
      { key: "brands.create", label: "Create Brands", desc: "Add brand manufacturers" },
      { key: "brands.update", label: "Edit Brands", desc: "Update brand details" },
      { key: "brands.delete", label: "Delete Brands", desc: "Delete brands" },
    ],
  },
  {
    category: "Inventory & Logistics",
    icon: Truck,
    permissions: [
      { key: "inventory.view", label: "View Inventory", desc: "Inspect warehouse stock levels" },
      { key: "inventory.adjust", label: "Adjust Stock", desc: "Manually increment/decrement stock counts" },
      { key: "inventory.receive", label: "Receive Shipments", desc: "Log inbound shipments from suppliers" },
      { key: "shipping.view", label: "View Shipping", desc: "View shipping zones and courier rates" },
      { key: "shipping.update", label: "Update Shipping", desc: "Edit delivery fees and coverage zones" },
    ],
  },
  {
    category: "Orders & Fulfillment",
    icon: ShoppingBag,
    permissions: [
      { key: "orders.view", label: "View Orders", desc: "View list of customer orders and details" },
      { key: "orders.update", label: "Update Orders", desc: "Edit customer address and order notes" },
      { key: "orders.fulfil", label: "Fulfil Orders", desc: "Pack, assign courier, and mark shipped" },
      { key: "orders.cancel", label: "Cancel Orders", desc: "Cancel orders and restock inventory" },
      { key: "orders.refund", label: "Process Refunds", desc: "Issue financial refunds to customers" },
    ],
  },
  {
    category: "Customers & Reviews",
    icon: Users,
    permissions: [
      { key: "customers.view", label: "View Customers", desc: "Browse registered customer directory" },
      { key: "customers.update", label: "Edit Customers", desc: "Modify customer information" },
      { key: "customers.delete", label: "Delete Customers", desc: "Permanently delete customer data" },
      { key: "reviews.view", label: "View Reviews", desc: "Read customer product reviews" },
      { key: "reviews.moderate", label: "Moderate Reviews", desc: "Approve or reject customer reviews" },
      { key: "reviews.delete", label: "Delete Reviews", desc: "Remove inappropriate reviews" },
    ],
  },
  {
    category: "Discounts & Marketing",
    icon: Tag,
    permissions: [
      { key: "discounts.view", label: "View Discounts", desc: "Inspect coupon codes and promotions" },
      { key: "discounts.create", label: "Create Coupons", desc: "Create new discount vouchers" },
      { key: "discounts.update", label: "Edit Discounts", desc: "Update voucher expiration and discounts" },
      { key: "discounts.delete", label: "Delete Discounts", desc: "Delete coupon codes" },
      { key: "marketing.view", label: "View Marketing", desc: "View promotional campaigns" },
      { key: "marketing.update", label: "Manage Marketing", desc: "Run banners and marketing promotions" },
    ],
  },
  {
    category: "Staff & Access Control",
    icon: Shield,
    permissions: [
      { key: "staff.view", label: "View Staff", desc: "List staff accounts" },
      { key: "staff.create", label: "Create Staff", desc: "Invite new team members" },
      { key: "staff.update", label: "Edit Staff", desc: "Modify staff profile and role" },
      { key: "staff.delete", label: "Delete Staff", desc: "Remove staff account access" },
      { key: "roles.view", label: "View Roles", desc: "List all roles and permission matrix" },
      { key: "roles.create", label: "Create Roles", desc: "Create new custom permission roles" },
      { key: "roles.update", label: "Edit Roles", desc: "Modify role permissions and names" },
      { key: "roles.delete", label: "Delete Roles", desc: "Delete custom unused roles" },
      { key: "roles.assign", label: "Assign Roles", desc: "Assign staff to specific roles" },
    ],
  },
  {
    category: "Content & Storefront",
    icon: FileText,
    permissions: [
      { key: "storefront.view", label: "View Storefront", desc: "Inspect storefront settings" },
      { key: "storefront.update", label: "Update Storefront", desc: "Customize hero banners and homepage" },
      { key: "content.view", label: "View Content", desc: "Browse CMS pages and FAQs" },
      { key: "content.create", label: "Create Content", desc: "Publish new blog or info pages" },
      { key: "content.update", label: "Edit Content", desc: "Edit policy and informational content" },
      { key: "content.delete", label: "Delete Content", desc: "Remove CMS articles" },
      { key: "media.upload", label: "Upload Media", desc: "Upload images and PDF documents" },
      { key: "media.delete", label: "Delete Media", desc: "Delete uploaded media files" },
    ],
  },
  {
    category: "Analytics & Settings",
    icon: BarChart3,
    permissions: [
      { key: "dashboard.view", label: "View Dashboard", desc: "Access the admin KPI dashboard" },
      { key: "reports.view", label: "View Reports", desc: "View sales and revenue financial reports" },
      { key: "reports.export", label: "Export Reports", desc: "Download reports as CSV/Excel" },
      { key: "activity-log.view", label: "View Audit Log", desc: "Review administrative activity trails" },
      { key: "settings.view", label: "View Settings", desc: "Read store settings and payment keys" },
      { key: "settings.update", label: "Update Settings", desc: "Modify core store configuration" },
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

interface RolesManagementProps {
  initialRoles: RoleResource[];
}

export const RolesManagement: React.FC<RolesManagementProps> = ({ initialRoles }) => {
  const [roles, setRoles] = useState<RoleResource[]>(initialRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State for Create / Edit Role
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResource | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSuccess, setEditorSuccess] = useState<string | null>(null);

  // Detail Modal State
  const [inspectRole, setInspectRole] = useState<RoleResource | null>(null);

  // Delete State
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

  const refreshRoles = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminRolesAction();
      if (res.success && res.data) {
        setRoles(res.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Create Role Modal
  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName("");
    setSelectedPermissions([]);
    setEditorError(null);
    setEditorSuccess(null);
    setIsEditorOpen(true);
  };

  // Open Edit Role Modal
  const openEditModal = (role: RoleResource) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setEditorError(null);
    setEditorSuccess(null);
    setIsEditorOpen(true);
  };

  // Toggle single permission
  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Toggle all permissions in a category
  const toggleCategory = (groupPermissions: Array<{ key: string }>) => {
    const keys = groupPermissions.map((p) => p.key);
    const allSelected = keys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  // Quick Preset Handlers
  const applyPreset = (presetName: string) => {
    if (presetName === "all") {
      setSelectedPermissions(ALL_PERMISSION_KEYS);
    } else if (presetName === "clear") {
      setSelectedPermissions([]);
    } else if (presetName === "fulfillment") {
      setSelectedPermissions([
        "orders.view",
        "orders.update",
        "orders.fulfil",
        "inventory.view",
        "shipping.view",
      ]);
    } else if (presetName === "catalogue") {
      setSelectedPermissions([
        "products.view",
        "products.create",
        "products.update",
        "categories.view",
        "categories.create",
        "categories.update",
        "brands.view",
        "brands.create",
        "brands.update",
        "media.upload",
      ]);
    } else if (presetName === "support") {
      setSelectedPermissions([
        "orders.view",
        "customers.view",
        "reviews.view",
        "reviews.moderate",
      ]);
    }
  };

  // Save Role
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setEditorError("Role name cannot be empty.");
      return;
    }
    if (roleName.trim().length > 125) {
      setEditorError("Role name cannot exceed 125 characters.");
      return;
    }

    setIsSaving(true);
    setEditorError(null);
    setEditorSuccess(null);

    try {
      if (editingRole) {
        const res = await updateAdminRoleAction(editingRole.id, {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        if (!res.success) {
          setEditorError(res.error?.message || "Failed to update role");
        } else {
          setEditorSuccess("Role and permissions updated successfully!");
          await refreshRoles();
          setTimeout(() => setIsEditorOpen(false), 900);
        }
      } else {
        const res = await createAdminRoleAction({
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        if (!res.success) {
          setEditorError(res.error?.message || "Failed to create role");
        } else {
          setEditorSuccess("New role created successfully!");
          await refreshRoles();
          setTimeout(() => setIsEditorOpen(false), 900);
        }
      }
    } catch {
      setEditorError("An unexpected network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (role: RoleResource) => {
    if (role.is_reserved) {
      alert("Reserved system roles cannot be deleted.");
      return;
    }
    if (role.users_count > 0) {
      alert(`Cannot delete "${role.name}": ${role.users_count} staff member(s) currently hold this role.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    setDeletingRoleId(role.id);
    try {
      const res = await deleteAdminRoleAction(role.id);
      if (!res.success) {
        alert(res.error?.message || "Failed to delete role");
      } else {
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
      }
    } finally {
      setDeletingRoleId(null);
    }
  };

  // Filtered Roles
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Roles & Permissions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#FF5B00] border border-orange-200">
              {roles.length} Roles
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define administrative roles, manage granular permissions, and control team member privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshRoles}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh Roles"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles by name..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5B00] bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>{roles.filter((r) => r.is_reserved).length} Reserved</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{roles.reduce((acc, r) => acc + (r.users_count || 0), 0)} Total Assigned Staff</span>
          </span>
        </div>
      </div>

      {/* Roles Cards Grid */}
      {filteredRoles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center space-y-4 border border-slate-200/80">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Roles Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No roles match &quot;{searchQuery}&quot;. Try adjusting your search query or create a new custom role.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5B00] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#E64E00] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => {
            const permCount = role.permissions?.length || 0;
            const isSuperAdmin = role.name === "super-admin";

            return (
              <div
                key={role.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-5"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF5B00] border border-orange-100 flex items-center justify-center font-bold">
                        {role.is_reserved ? (
                          <Lock className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-[#FF5B00]" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 capitalize leading-tight">
                          {role.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {role.is_reserved ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              System Reserved
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Custom Role
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(role)}
                        title="Edit Permissions"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!role.is_reserved && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          disabled={deletingRoleId === role.id || role.users_count > 0}
                          title={role.users_count > 0 ? "Cannot delete role held by staff" : "Delete Role"}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Staff assignment count */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 pb-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned Staff</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {role.users_count} {role.users_count === 1 ? "member" : "members"}
                    </span>
                  </div>

                  {/* Permissions count */}
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>Granted Permissions</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {isSuperAdmin ? "Full Access (All)" : `${permCount} granted`}
                    </span>
                  </div>

                  {/* Permissions preview tag list */}
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {isSuperAdmin ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ⚡ Super Admin Bypass (All Privileges Granted)
                        </span>
                      ) : permCount === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No permissions granted yet.</span>
                      ) : (
                        role.permissions.slice(0, 6).map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {perm}
                          </span>
                        ))
                      )}
                      {!isSuperAdmin && permCount > 6 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                          +{permCount - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setInspectRole(role)}
                    className="text-xs font-bold text-[#FF5B00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Permission Matrix</span>
                  </button>

                  <button
                    onClick={() => openEditModal(role)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: CREATE / EDIT ROLE                                         */}
      {/* =================================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF5B00]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Role"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure role name and select explicit permissions to grant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Alerts Inside Modal */}
            {editorError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editorError}</span>
              </div>
            )}
            {editorSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{editorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-6">
              {/* Role Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={125}
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Warehouse Dispatcher, Catalogue Manager"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Use clear naming reflecting staff duty.</span>
                  <span>{roleName.length}/125</span>
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Quick Templates:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset("all")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800 transition-colors"
                    >
                      Select All ({ALL_PERMISSION_KEYS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("clear")}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-300 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { key: "fulfillment", label: "📦 Order Fulfillment Specialist" },
                    { key: "catalogue", label: "🏷️ Catalog & Inventory Specialist" },
                    { key: "support", label: "🎧 Customer Support Agent" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-100 transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permission Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Granted Permissions ({selectedPermissions.length} selected)
                  </span>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {PERMISSION_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    const groupKeys = group.permissions.map((p) => p.key);
                    const allInGroupSelected = groupKeys.every((k) => selectedPermissions.includes(k));
                    const someInGroupSelected = groupKeys.some((k) => selectedPermissions.includes(k));

                    return (
                      <div
                        key={group.category}
                        className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3"
                      >
                        {/* Group Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <GroupIcon className="w-4 h-4 text-[#FF5B00]" />
                            <span className="text-xs font-extrabold text-slate-900">
                              {group.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              ({group.permissions.filter((p) => selectedPermissions.includes(p.key)).length} / {group.permissions.length})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleCategory(group.permissions)}
                            className="text-xs font-bold text-[#FF5B00] hover:underline cursor-pointer"
                          >
                            {allInGroupSelected ? "Deselect Group" : "Select Group"}
                          </button>
                        </div>

                        {/* Group Items */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {group.permissions.map((perm) => {
                            const isChecked = selectedPermissions.includes(perm.key);
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? "border-[#FF5B00] bg-orange-50/20 ring-1 ring-[#FF5B00]/40"
                                    : "border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(perm.key)}
                                  className="mt-0.5 w-4 h-4 text-[#FF5B00] rounded-sm focus:ring-[#FF5B00]"
                                />
                                <div className="text-xs space-y-0.5">
                                  <div className="font-bold text-slate-900">{perm.label}</div>
                                  <div className="text-[11px] font-mono text-slate-500">{perm.key}</div>
                                  <p className="text-[11px] text-slate-400">{perm.desc}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#FF5B00] hover:bg-[#E64E00] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving Role..." : editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: INSPECT ROLE PERMISSION MATRIX                             */}
      {/* =================================================================== */}
      {inspectRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF5B00]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 capitalize">
                    {inspectRole.name} Permissions
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectRole.permissions?.length || 0} active administrative grants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectRole(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectRole.name === "super-admin" ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Unrestricted System Super-Administrator</span>
                </div>
                <p>
                  This system role has absolute authority across all modules (including user creation, store configuration, orders, catalog, and finances).
                </p>
              </div>
            ) : inspectRole.permissions?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                This role currently has no permissions assigned.
              </p>
            ) : (
              <div className="space-y-4">
                {PERMISSION_GROUPS.filter((g) =>
                  g.permissions.some((p) => inspectRole.permissions.includes(p.key))
                ).map((g) => (
                  <div key={g.category} className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {g.category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {g.permissions
                        .filter((p) => inspectRole.permissions.includes(p.key))
                        .map((p) => (
                          <div
                            key={p.key}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="font-bold text-slate-900">{p.label}</div>
                            <div className="text-[10px] font-mono text-slate-500">{p.key}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setInspectRole(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
