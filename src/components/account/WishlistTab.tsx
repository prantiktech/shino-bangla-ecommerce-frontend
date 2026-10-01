"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Heart, Loader2, Trash2 } from "lucide-react";
import {
  WishlistProduct,
  getRecentlyViewedAction,
  removeFromWishlistAction,
} from "@/app/(user)/actions/wishlist";
import type { ApiProduct } from "@/app/(user)/actions/products";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { ProductCard } from "@/components/common/ProductCard";
import { useCart } from "@/context/CartContext";

/** Saved products plus the shopper's recently viewed items. */
export function WishlistTab({ initial }: { initial: WishlistProduct[] }) {
  const [items, setItems] = useState(initial);
  const [removing, setRemoving] = useState<number | null>(null);
  const [recent, setRecent] = useState<WishlistProduct[] | null>(null);
  const { showToast } = useCart();

  useEffect(() => {
    let cancelled = false;
    getRecentlyViewedAction().then((res) => {
      if (!cancelled) setRecent(res.success ? res.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (p: WishlistProduct) => {
    setRemoving(p.id);
    const res = await removeFromWishlistAction(p.id);
    setRemoving(null);
    if (!res.success) return showToast(res.error.message || "Could not remove this item.");
    setItems((list) => list.filter((x) => x.id !== p.id));
    showToast("Removed from your wishlist");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Your wishlist
            <span className="text-sm font-normal text-slate-400">({items.length})</span>
          </h2>
        </div>
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-10 text-center">
            <Heart className="w-10 h-10 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">Your wishlist is empty</p>
            <p className="text-sm text-slate-500 mt-1">Tap the heart on any product to save it for later.</p>
            <Link href="/products" className="mt-5 inline-flex h-10 items-center px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <ProductCard product={mapApiProductToProduct(p as unknown as ApiProduct)} />
                <button
                  type="button"
                  onClick={() => remove(p)}
                  disabled={removing === p.id}
                  className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  {removing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Recently viewed
        </h2>
        {recent === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-slate-500">Products you look at will appear here.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {recent.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={mapApiProductToProduct(p as unknown as ApiProduct)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
