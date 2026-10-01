"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  Users,
  UserCheck,
  Percent,
  BarChart3,
  ArrowLeft,
  X,
  ShieldCheck,
  Shield,
  Tag,
  Image as ImageIcon,
  FolderTree,
  Boxes,
  History,
} from "lucide-react";

interface SidebarItem {
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsMobileOpen: (open: boolean) => void;
  forceOpen?: boolean;
}

export function AdminSidebar({
  isCollapsed,
  setIsMobileOpen,
  forceOpen = false,
}: SidebarProps) {
  const pathname = usePathname();
  const showText = !isCollapsed || forceOpen;

  const sidebarSections: SidebarSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
      ],
    },
    {
      title: "CATALOGUE",
      items: [
        { label: "Products", icon: Layers, href: "/admin/products" },
        { label: "Categories", icon: FolderTree, href: "/admin/categories" },
        { label: "Inventory", icon: Boxes, href: "/admin/inventory" },
        { label: "Banners & Promos", icon: ImageIcon, href: "/admin/banners" },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
        { label: "Customers", icon: Users, href: "/admin/customers" },
        { label: "Staff Members", icon: UserCheck, href: "/admin/staff" },
        { label: "Roles & Permissions", icon: ShieldCheck, href: "/admin/roles" },
        { label: "Activity Logs", icon: History, href: "/admin/activity-log" },
        { label: "Settings", icon: Shield, href: "/admin/settings" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full text-slate-300 select-none bg-[#1E293B]">
      {/* Brand Logo Container */}
      <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#FF5B00] flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm">
            N
          </div>
          {showText && (
            <div className="flex flex-col text-left">
              <span className="text-white font-black text-sm leading-none tracking-tight">Nogod Bazar</span>
              <span className="text-[10px] text-orange-400 font-bold tracking-widest mt-0.5 uppercase">Admin Portal</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3.5 space-y-6">
        {sidebarSections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            {showText && (
              <span className="px-3 text-[10px] font-semibold text-slate-400/80 uppercase tracking-wider text-left">
                {section.title}
              </span>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? "bg-[#FF5B00] text-white shadow-sm"
                        : "hover:bg-slate-750 text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {showText && <span className="truncate">{item.label}</span>}

                    {!showText && (
                      <div className="absolute left-16 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Storefront Link */}
      <div className="p-3.5 border-t border-slate-700/60">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
          {showText && <span className="truncate">View Storefront</span>}
        </Link>
      </div>
    </div>
  );
}
