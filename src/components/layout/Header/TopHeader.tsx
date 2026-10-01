"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getProductsAction, getProductSuggestAction } from "@/app/(user)/actions/products";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { Product } from "@/types";
import { poishaToTaka } from "@/lib/utils/money";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const { totalItems, setIsCartOpen, setQuickViewProduct } = useCart();
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
    <div className="bg-white text-gray-900 py-3 px-4 md:px-8 border-b border-gray-100 shadow-2xs relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        
        {/* Brand Logo matching the primary brand color (#FF5B00) */}
        <Link href="/" className="flex items-center gap-2 group shrink-0 select-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5B00] to-[#FF8433] flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline leading-none">
              <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                nogod
              </span>
              <span className="text-xl md:text-2xl font-black text-[#FF5B00] tracking-tight ml-0.5">
                bazar
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
              Online Store
            </span>
          </div>
        </Link>

        {/* Center Rounded Pill Search Bar */}
        <div className="flex-1 max-w-xl mx-2 md:mx-6 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search for products..."
              className="w-full h-10 pl-5 pr-11 rounded-full border border-gray-300/90 bg-white text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#FF5B00] focus:ring-2 focus:ring-[#FF5B00]/20 transition-all shadow-2xs"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF5B00] transition-colors"
            >
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>
          </form>

          {/* Search Live Dropdown Suggestions */}
          {isSearchFocused && (productSuggestions.length > 0 || categorySuggestions.length > 0 || brandSuggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 overflow-hidden text-gray-800 divide-y divide-gray-100">
              {/* Categories match */}
              {categorySuggestions.length > 0 && (
                <div className="pb-2">
                  <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 pt-1">
                    {categorySuggestions.map((cat: any) => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        onMouseDown={() => {
                          setIsSearchFocused(false);
                          router.push(`/category/${cat.slug}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#FF5B00] hover:bg-orange-100 text-xs font-bold transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands match */}
              {brandSuggestions.length > 0 && (
                <div className="py-2">
                  <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Brands
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 pt-1">
                    {brandSuggestions.map((b: any) => (
                      <Link
                        key={b.slug}
                        href={`/brand/${b.slug}`}
                        onMouseDown={() => {
                          setIsSearchFocused(false);
                          router.push(`/brand/${b.slug}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products match */}
              {productSuggestions.length > 0 && (
                <div className="pt-2">
                  <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                        className="px-3.5 py-2 hover:bg-orange-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-semibold text-gray-800 line-clamp-1 flex-1 pr-3">
                          {p.name}
                        </span>
                        {priceTaka > 0 && (
                          <span className="font-black text-[#FF5B00] shrink-0">
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

        {/* Right Actions: User Profile & Shopping Cart */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0 text-gray-800">
          
          {/* User Profile / Sign in */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-gray-800 hover:text-[#FF5B00] transition-colors p-1"
                aria-label="My Account"
              >
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 text-[#FF5B00] flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-gray-800 line-clamp-1 max-w-[100px]">
                  {user.name.split(" ")[0]}
                </span>
              </Link>

              <Link
                href="/account?tab=orders"
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-[#FF5B00] hover:bg-slate-100 rounded-lg transition-colors"
                title="My Orders"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-gray-800 hover:text-[#FF5B00] transition-colors p-1 flex items-center gap-1"
              aria-label="User Sign In"
            >
              <User className="w-6 h-6 stroke-[1.8]" />
              <span className="hidden md:inline text-xs font-medium text-gray-600 hover:text-[#FF5B00]">
                Sign In
              </span>
            </Link>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-gray-800 hover:text-[#FF5B00] transition-transform active:scale-95 relative p-1"
            aria-label="Open Shopping Cart"
          >
            <ShoppingCart className="w-6 h-6 stroke-[1.8]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#FF5B00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
