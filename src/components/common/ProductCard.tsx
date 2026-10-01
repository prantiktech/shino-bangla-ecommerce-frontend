"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart, ShoppingBag, Eye, Plus, Minus } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { BuyNowModal } from "@/components/common/BuyNowModal";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className = "" }) => {
  const { cart, addToCart, updateQuantity, removeFromCart, setIsCartOpen, setQuickViewProduct } = useCart();
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);

  const cartItem = cart.find((item) => String(item.product.id) === String(product.id));
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBuyNowOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative w-full aspect-square bg-gray-50/80 overflow-hidden flex items-center justify-center p-3">
        {/* Discount Badge */}
        {product.discountBadge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge variant="discount" className="bg-[#16A34A] text-white px-2 py-0.5 text-[11px] font-bold rounded shadow-xs">
              {product.discountBadge}
            </Badge>
          </div>
        )}

        {/* Quick View Button */}
        <button
          onClick={handleQuickView}
          aria-label="Quick view product"
          className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FF5B00] hover:text-white"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Product Image */}
        <Link
          href={`/products/${product.slug}`}
          className="relative w-full h-full cursor-pointer transition-transform duration-500 group-hover:scale-105 block"
        >
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover rounded-lg"
          />
        </Link>
      </div>

      {/* Content Section */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating and Sold count */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-medium text-gray-700">({product.reviewCount || 0})</span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              {product.soldCount} Sold
            </span>
          </div>

          {/* Product Title */}
          <Link
            href={`/products/${product.slug}`}
            className="block text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug cursor-pointer hover:text-[#FF5B00] transition-colors mb-2 min-h-[36px]"
            title={product.title}
          >
            {product.title}
          </Link>

          {/* Price Container */}
          <div className="flex items-baseline gap-2 mb-3">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through font-normal">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-sm sm:text-base font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 pt-1">
          {/* Buy Now Button */}
          <Button
            onClick={handleBuyNow}
            variant="default"
            size="sm"
            className="w-full bg-[#FF5B00] hover:bg-[#E64E00] text-white text-xs font-semibold py-2 h-8 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Buy Now
          </Button>

          {/* Add to Cart / Quantity Controller Button */}
          {quantityInCart > 0 ? (
            <div
              className="w-full h-8 rounded-lg bg-orange-50/90 border border-[#FF5B00]/40 flex items-center justify-between px-1.5 shadow-2xs transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantityInCart <= 1) {
                    removeFromCart(product.id);
                  } else {
                    updateQuantity(product.id, quantityInCart - 1);
                  }
                }}
                aria-label="Decrease quantity"
                className="w-6 h-6 rounded-md bg-white border border-gray-200 hover:bg-orange-100 text-[#FF5B00] hover:text-[#E64E00] flex items-center justify-center font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-900 select-none">
                <span>{quantityInCart}</span>
                <span className="text-[10px] font-medium text-gray-500">in cart</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, quantityInCart + 1);
                }}
                aria-label="Increase quantity"
                className="w-6 h-6 rounded-md bg-[#FF5B00] hover:bg-[#E64E00] text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              variant="cartOutline"
              size="sm"
              className="w-full text-xs font-medium py-2 h-8 rounded-lg flex items-center justify-center gap-1.5 border-gray-200 hover:border-gray-300 hover:bg-gray-100/80 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-gray-600" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
      {/* Buy Now Modal */}
      <BuyNowModal
        isOpen={isBuyNowOpen}
        onClose={() => setIsBuyNowOpen(false)}
        variantId={product.variantId ? Number(product.variantId) : (typeof product.id === "number" ? product.id : 0)}
        productTitle={product.title}
        productImage={product.image}
        initialQuantity={1}
        initialPrice={product.price}
      />
    </div>
  );
};
