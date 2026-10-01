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
  BarChart3,
  ArrowLeft,
  X,
  ShieldCheck,
  Settings,
  Image as ImageIcon,
  FolderTree,
  Boxes,
  History,
  Award,
  SlidersHorizontal,
  PackagePlus,
  MessageSquareText,
  Ticket,
  Zap,
  Truck,
  LayoutTemplate,
  FileText,
  HelpCircle,
  Mail,
  Inbox,
} from "lucide-react";

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  /** Permission needed to see the link; omitted means always visible. */
  permission?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsMobileOpen: (open: boolean) => void;
  forceOpen?: boolean;
  /** Permissions of the signed-in staff member; null while loading (show everything). */
  permissions?: string[] | null;
}

const SECTIONS: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin", permission: "dashboard.view" },
      { label: "Reports", icon: BarChart3, href: "/admin/reports", permission: "reports.view" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Products", icon: Layers, href: "/admin/products", permission: "products.view" },
      { label: "Categories", icon: FolderTree, href: "/admin/categories", permission: "categories.view" },
      { label: "Brands", icon: Award, href: "/admin/brands", permission: "brands.view" },
      { label: "Product options", icon: SlidersHorizontal, href: "/admin/option-types", permission: "products.view" },
      { label: "Inventory", icon: Boxes, href: "/admin/inventory", permission: "inventory.view" },
      { label: "Purchases", icon: PackagePlus, href: "/admin/purchases", permission: "inventory.view" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", icon: ShoppingBag, href: "/admin/orders", permission: "orders.view" },
      { label: "Customers", icon: Users, href: "/admin/customers", permission: "customers.view" },
      { label: "Reviews", icon: MessageSquareText, href: "/admin/reviews", permission: "reviews.view" },
      { label: "Coupons", icon: Ticket, href: "/admin/coupons", permission: "discounts.view" },
      { label: "Flash sales", icon: Zap, href: "/admin/flash-sales", permission: "discounts.view" },
      { label: "Shipping zones", icon: Truck, href: "/admin/shipping", permission: "shipping.view" },
    ],
  },
  {
    title: "Storefront",
    items: [
      { label: "Home page", icon: LayoutTemplate, href: "/admin/home-sections", permission: "storefront.view" },
      { label: "Banners", icon: ImageIcon, href: "/admin/banners", permission: "storefront.view" },
      { label: "Pages", icon: FileText, href: "/admin/pages", permission: "content.view" },
      { label: "FAQs", icon: HelpCircle, href: "/admin/faqs", permission: "content.view" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Newsletter", icon: Mail, href: "/admin/newsletter", permission: "marketing.view" },
      { label: "Inbox", icon: Inbox, href: "/admin/messages", permission: "content.view" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Staff", icon: UserCheck, href: "/admin/staff", permission: "staff.view" },
      { label: "Roles & permissions", icon: ShieldCheck, href: "/admin/roles", permission: "roles.view" },
      { label: "Activity log", icon: History, href: "/admin/activity-log", permission: "activity-log.view" },
      { label: "Settings", icon: Settings, href: "/admin/settings", permission: "settings.view" },
    ],
  },
];

export function AdminSidebar({
  isCollapsed,
  setIsMobileOpen,
  forceOpen = false,
  permissions = null,
}: SidebarProps) {
  const pathname = usePathname();
  const showText = !isCollapsed || forceOpen;

  const can = (perm?: string) => !perm || !permissions || permissions.includes(perm);
  const sidebarSections = SECTIONS.map((sec) => ({ ...sec, items: sec.items.filter((i) => can(i.permission)) })).filter(
    (sec) => sec.items.length > 0
  );
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname?.startsWith(`${href}/`));

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
      <nav aria-label="Admin" className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
        {sidebarSections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            {showText && (
              <span className="px-3 text-[10px] font-semibold text-slate-400/80 uppercase tracking-wider text-left">
                {section.title}
              </span>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={showText ? undefined : item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors group relative ${
                      active ? "bg-primary text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 ${
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
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
      </nav>

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
