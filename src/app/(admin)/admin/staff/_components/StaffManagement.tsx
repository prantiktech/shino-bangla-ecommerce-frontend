"use client";

import React, { useState } from "react";
import {
  StaffMember,
  createAdminStaffAction,
  updateAdminStaffAction,
  deleteAdminStaffAction,
  getAdminStaffAction,
} from "@/app/(admin)/actions/staff";
import { RoleResource } from "@/app/(admin)/actions/roles";
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  Key,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  Lock,
  RefreshCw,
  Eye,
} from "lucide-react";

interface StaffManagementProps {
  initialStaff: StaffMember[];
  initialRoles: RoleResource[];
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  initialStaff,
  initialRoles,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [roles, setRoles] = useState<RoleResource[]>(initialRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State for Create / Edit
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]?.name || "super-admin");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSuccess, setEditorSuccess] = useState<string | null>(null);

  // Modal State for Inspect Privileges
  const [inspectStaff, setInspectStaff] = useState<StaffMember | null>(null);

  // Deleting State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refreshStaff = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminStaffAction();
      if (res.success && res.data) {
        setStaffList(res.data.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole(roles[0]?.name || "super-admin");
    setIsActive(true);
    setEditorError(null);
    setEditorSuccess(null);
    setIsEditorOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setEmail(member.email || "");
    setPassword("");
    setRole(member.roles?.[0] || roles[0]?.name || "super-admin");
    setIsActive(member.is_active);
    setEditorError(null);
    setEditorSuccess(null);
    setIsEditorOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setEditorError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setEditorError("Valid email is required.");
      return;
    }
    if (!editingStaff && (!password || password.length < 8)) {
      setEditorError("Starting password must be at least 8 characters.");
      return;
    }

    setIsSaving(true);
    setEditorError(null);
    setEditorSuccess(null);

    try {
      if (editingStaff) {
        const payload: any = {
          name: name.trim(),
          email: email.trim(),
          role,
          is_active: isActive,
        };
        if (password) {
          payload.password = password;
        }

        const res = await updateAdminStaffAction(editingStaff.id, payload);
        if (!res.success) {
          setEditorError(res.error?.message || "Failed to update staff account");
        } else {
          setEditorSuccess("Staff member updated successfully!");
          await refreshStaff();
          setTimeout(() => setIsEditorOpen(false), 900);
        }
      } else {
        const res = await createAdminStaffAction({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          is_active: isActive,
        });
        if (!res.success) {
          setEditorError(res.error?.message || "Failed to create staff account");
        } else {
          setEditorSuccess("New staff account created successfully!");
          await refreshStaff();
          setTimeout(() => setIsEditorOpen(false), 900);
        }
      }
    } catch {
      setEditorError("An unexpected network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (member.name === "Store Owner" || member.roles?.includes("super-admin") && staffList.filter((s) => s.roles?.includes("super-admin")).length <= 1) {
      alert("Cannot delete the primary owner account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete staff account "${member.name}"? Active login tokens will be immediately terminated.`)) {
      return;
    }

    setDeletingId(member.id);
    try {
      const res = await deleteAdminStaffAction(member.id);
      if (!res.success) {
        alert(res.error?.message || "Failed to delete staff account");
      } else {
        setStaffList((prev) => prev.filter((s) => s.id !== member.id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === "all" || s.roles?.includes(roleFilter);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Back Office Staff
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#FF5B00] border border-orange-200">
              {staffList.length} Team Members
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage back office administrator accounts, assign operational roles, and revoke session credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshStaff}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh Staff"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5B00] hover:bg-[#E64E00] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5B00] bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Staff Accounts Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No staff members match the selected filters or search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Member Details</th>
                  <th className="py-3.5 px-6">Assigned Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Permissions</th>
                  <th className="py-3.5 px-6">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member) => {
                  const roleName = member.roles?.[0] || "No Role";
                  const isSuperAdmin = roleName === "super-admin";
                  const permCount = member.permissions?.length || 0;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#009cae] flex items-center justify-center text-sm font-black shadow-2xs">
                            {member.name ? member.name[0].toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isSuperAdmin && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF5B00]">
                                  Super
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <ShieldCheck className="w-3 h-3 text-[#FF5B00]" />
                          {roleName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {member.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3 text-rose-600" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Permissions */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setInspectStaff(member)}
                          className="font-bold text-slate-700 hover:text-[#FF5B00] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isSuperAdmin ? "All Privileges" : `${permCount} grants`}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {member.last_login_at ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(member.last_login_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(member)}
                            title="Edit Staff Member"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member)}
                            disabled={deletingId === member.id}
                            title="Delete Account"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: CREATE / EDIT STAFF MEMBER                                 */}
      {/* =================================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF5B00]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStaff ? `Edit Staff: ${editingStaff.name}` : "Create Staff Account"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Account is immediately active upon creation
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

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariqul Islam"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tariqul@example.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
                <p className="text-[11px] text-slate-400">
                  Address is automatically marked verified on creation by administrator.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {editingStaff ? "New Password (Leave blank to keep existing)" : "Starting Password *"}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingStaff ? "••••••••••••" : "Min 8 characters"}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Assigned Operational Role *</label>
                <select
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5B00]"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name} {r.is_reserved ? "(Reserved System Role)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#FF5B00] rounded-sm focus:ring-[#FF5B00]"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Active Account (Allowed to log into Back Office)
                  </span>
                </label>
              </div>

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
                  {isSaving ? "Saving..." : editingStaff ? "Update Staff" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: INSPECT STAFF PRIVILEGES                                   */}
      {/* =================================================================== */}
      {inspectStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF5B00]">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {inspectStaff.name} Privileges
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inherited from role: <span className="font-bold text-slate-800">{inspectStaff.roles?.[0]}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectStaff.roles?.includes("super-admin") ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Unrestricted System Super-Administrator</span>
                </div>
                <p>
                  This account has unrestricted permissions to all administrative operations.
                </p>
              </div>
            ) : inspectStaff.permissions?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                This staff member currently has no active permissions assigned.
              </p>
            ) : (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Granted Capabilities ({inspectStaff.permissions.length})
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {inspectStaff.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setInspectStaff(null)}
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
