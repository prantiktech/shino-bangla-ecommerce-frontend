"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-md p-0 bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              My Shopping Cart ({totalItems})
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-primary mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-1">Your cart is empty</h4>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                Looks like you haven&apos;t added anything to your cart yet. Start exploring our products.
              </p>
              <Button
                onClick={() => setIsCartOpen(false)}
                className="bg-primary hover:bg-primary-hover text-xs font-semibold"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-start gap-3 p-3 bg-gray-50/70 border border-gray-100 rounded-xl"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 bg-white rounded-lg border border-gray-200/80 overflow-hidden shrink-0">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-900 line-clamp-1 mb-1" title={product.title}>
                    {product.title}
                  </h4>
                  <div className="text-xs font-bold text-primary mb-2">
                    {formatPrice(product.price)}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 bg-white rounded-md">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-md"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-gray-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-md"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with subtotal & checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount</span>
                <span className="text-base text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-11 rounded-xl shadow-md gap-2 flex items-center justify-center"
            >
              Checkout Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
