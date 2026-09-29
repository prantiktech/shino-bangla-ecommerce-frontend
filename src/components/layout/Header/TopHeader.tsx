"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ALL_PRODUCTS } from "@/data/products";
import { formatPrice } from "@/lib/utils";

export const TopHeader: React.FC = () => {
  const { totalItems, setIsCartOpen, setQuickViewProduct } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = searchQuery.trim()
    ? ALL_PRODUCTS.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="bg-white text-gray-900 py-3 px-4 md:px-8 border-b border-gray-100 shadow-2xs relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        
        {/* Brand Logo matching the screenshot (Cembula with stylized cyan cart mark) */}
        <Link href="/" className="flex items-center gap-1 group shrink-0 select-none">
          <div className="flex items-center">
            {/* Cyan cart 'C' icon */}
            <div className="relative flex items-center justify-center mr-0.5">
              <span className="text-3xl md:text-4xl font-black text-[#009cae] leading-none tracking-tighter">
                C
              </span>
              {/* Cart wheels */}
              <span className="absolute -bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#009cae]" />
              <span className="absolute -bottom-1 right-0.5 w-1.5 h-1.5 rounded-full bg-[#009cae]" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                embula
              </span>
              <span className="text-[11px] font-semibold text-gray-400 ml-0.5">
                .com
              </span>
            </div>
          </div>
        </Link>

        {/* Center Rounded Pill Search Bar (matching screenshot) */}
        <div className="flex-1 max-w-xl mx-2 md:mx-6 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search for products..."
              className="w-full h-10 pl-5 pr-11 rounded-full border border-gray-300/90 bg-white text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#009cae] focus:ring-2 focus:ring-[#009cae]/20 transition-all shadow-2xs"
            />
            <button
              aria-label="Search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#009cae] transition-colors"
            >
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Search Live Dropdown Suggestions */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden text-gray-800">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Matching Products
              </div>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  onMouseDown={() => setQuickViewProduct(product)}
                  className="px-3 py-2 hover:bg-teal-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors border-b last:border-0 border-gray-50"
                >
                  <span className="font-medium text-gray-800 line-clamp-1 flex-1 pr-2">
                    {product.title}
                  </span>
                  <span className="font-bold text-[#009cae] shrink-0">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions: User Profile & Shopping Cart (matching screenshot) */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0 text-gray-800">
          
          {/* User Profile */}
          <Link
            href="/login"
            className="text-gray-800 hover:text-[#009cae] transition-colors p-1"
            aria-label="User Account"
          >
            <User className="w-6 h-6 stroke-[1.8]" />
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-gray-800 hover:text-[#009cae] transition-transform active:scale-95 relative p-1"
            aria-label="Open Shopping Cart"
          >
            <ShoppingCart className="w-6 h-6 stroke-[1.8]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#009cae] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
