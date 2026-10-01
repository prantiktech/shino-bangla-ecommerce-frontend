"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Truck, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const itemBase =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 h-14 text-[10px] font-medium transition-colors";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname() || "/";
  const { totalItems, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuth();

  const isActive = (match: (p: string) => boolean) => match(pathname);

  const links = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    {
      href: "/products",
      label: "Shop",
      icon: LayoutGrid,
      match: (p: string) => p.startsWith("/products") || p.startsWith("/category") || p.startsWith("/brand"),
    },
    { href: "/track-order", label: "Track", icon: Truck, match: (p: string) => p.startsWith("/track-order") },
    {
      href: isAuthenticated ? "/account" : "/login",
      label: isAuthenticated ? "Account" : "Sign in",
      icon: User,
      match: (p: string) => p.startsWith("/account") || p.startsWith("/login") || p.startsWith("/orders"),
    },
  ];

  const renderLink = (l: (typeof links)[number]) => {
    const active = isActive(l.match);
    const Icon = l.icon;
    return (
      <Link
        key={l.label}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={cn(itemBase, active ? "text-primary" : "text-slate-500 hover:text-slate-700")}
      >
        {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />}
        <Icon className={cn("w-5 h-5", active ? "stroke-[2.2]" : "stroke-[1.8]")} />
        <span className={active ? "font-semibold" : undefined}>{l.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_16px_-6px_rgb(15_23_42/0.12)] pb-safe"
    >
      <div className="flex items-stretch">
        {renderLink(links[0])}
        {renderLink(links[1])}

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          className={cn(itemBase, "text-slate-500 hover:text-slate-700")}
        >
          <span className="relative">
            <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </span>
          <span>Cart</span>
        </button>

        {renderLink(links[2])}
        {renderLink(links[3])}
      </div>
    </nav>
  );
};
