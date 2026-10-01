"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Package, X, Heart } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getProductSuggestAction } from "@/app/(user)/actions/products";
import { poishaToTaka } from "@/lib/utils/money";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setProductSuggestions([]);
      setCategorySuggestions([]);
      setBrandSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await getProductSuggestAction(searchQuery.trim());
        if (res.success && res.data) {
          setProductSuggestions(res.data.products || []);
          setCategorySuggestions(res.data.categories || []);
          setBrandSuggestions(res.data.brands || []);
        }
      } catch {
        // ignore
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 border-b border-slate-100 relative z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 md:py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-4 gap-y-2.5 md:gap-8">

        <Logo showTagline />

        {/* Search: full-width second row on mobile, inline on desktop */}
        <div className="order-last md:order-none w-full md:w-auto md:flex-1 md:max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} role="search" className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSearchFocused(false);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Search products, brands and categories"
              aria-label="Search products"
              autoComplete="off"
              className="w-full h-10 md:h-11 pl-10 pr-24 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-[4.75rem] top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3.5 md:px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs md:text-sm font-semibold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Search Live Dropdown Suggestions */}
          {isSearchFocused && (productSuggestions.length > 0 || categorySuggestions.length > 0 || brandSuggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 py-2 z-50 overflow-hidden text-slate-800 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {categorySuggestions.length > 0 && (
                <div className="pb-2">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3.5 pt-1">
                    {categorySuggestions.map((cat: any) => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        onMouseDown={() => {
                          setIsSearchFocused(false);
                          router.push(`/category/${cat.slug}`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {brandSuggestions.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Brands
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3.5 pt-1">
                    {brandSuggestions.map((b: any) => (
                      <Link
                        key={b.slug}
                        href={`/brand/${b.slug}`}
                        onMouseDown={() => {
                          setIsSearchFocused(false);
                          router.push(`/brand/${b.slug}`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {productSuggestions.length > 0 && (
                <div className="pt-2">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Products
                  </div>
                  {productSuggestions.map((p: any) => {
                    const priceTaka = p.price ? (p.price.min ? poishaToTaka(p.price.min) : poishaToTaka(p.price)) : 0;
                    return (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        onMouseDown={() => {
                          setIsSearchFocused(false);
                          router.push(`/products/${p.slug}`);
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 text-sm transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">{p.name}</span>
                        </span>
                        {priceTaka > 0 && (
                          <span className="font-bold text-primary shrink-0 text-xs">
                            {formatPrice(priceTaka)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Account, Orders, Cart */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {isAuthenticated && user ? (
            <>
              <Link
                href="/account?tab=wishlist"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart className="w-5 h-5 md:w-6 md:h-6 stroke-[1.8]" />
              </Link>
              <Link
                href="/account?tab=orders"
                className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
              >
                <Package className="w-5 h-5 stroke-[1.8]" />
                <span className="text-sm font-medium">Orders</span>
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors"
                aria-label="My account"
              >
                <span className="w-8 h-8 rounded-full bg-brand-50 ring-1 ring-brand-200 text-brand-700 flex items-center justify-center text-sm font-bold">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </span>
                <span className="hidden sm:flex flex-col leading-tight text-left">
                  <span className="text-[11px] text-slate-400">Hello,</span>
                  <span className="text-sm font-semibold max-w-[110px] truncate">
                    {user.name?.split(" ")[0] || "Account"}
                  </span>
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors"
              aria-label="Sign in"
            >
              <User className="w-5 h-5 md:w-6 md:h-6 stroke-[1.8]" />
              <span className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-[11px] text-slate-400">Welcome</span>
                <span className="text-sm font-semibold">Sign in</span>
              </span>
            </Link>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors"
            aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          >
            <span className="relative">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 stroke-[1.8]" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </span>
            <span className="hidden lg:inline text-sm font-semibold">Cart</span>
          </button>
        </div>

      </div>
    </div>
  );
};
