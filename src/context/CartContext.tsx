"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Product, CartItem } from "@/types";
import { cartService } from "@/lib/api/services/cart.service";
import { poishaToTaka } from "@/lib/utils/money";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_KEY = "toy_house_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to map backend items to CartItem[]
  const mapApiCartToItems = (apiCart: any): CartItem[] => {
    const rawCart = apiCart?.data || apiCart;
    if (!rawCart || !Array.isArray(rawCart.items)) return [];
    return rawCart.items.map((item: any) => ({
      product: {
        id: `${item.product?.id || item.variant_id}-${item.variant_id}`,
        title: item.product?.name
          ? item.label
            ? `${item.product.name} (${item.label})`
            : item.product.name
          : "Product",
        slug: item.product?.slug || "",
        image: item.product?.image || "/images/placeholder.svg",
        price: poishaToTaka(item.unit_price),
        originalPrice: item.compare_at ? poishaToTaka(item.compare_at) : undefined,
        rating: 5,
        reviewCount: 0,
        soldCount: 0,
        category: "General",
        inStock: item.available ?? true,
        variantId: item.variant_id,
      },
      quantity: item.quantity,
      apiCartItemId: item.id,
    }));
  };

  // ─── Hydrate from localStorage and API on mount ───────────────────────────
  useEffect(() => {
    let localItems: CartItem[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        localItems = JSON.parse(stored);
        if (Array.isArray(localItems) && localItems.length > 0) {
          setCart(localItems);
        }
      }
    } catch {
      // ignore
    }
    setIsInitialized(true);

    // Fetch live cart from backend API (works for both guests via X-Cart-Token and logged-in customers)
    cartService
      .getCart()
      .then((apiCart) => {
        const serverItems = mapApiCartToItems(apiCart);
        if (serverItems.length > 0) {
          setCart(serverItems);
          try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(serverItems));
          } catch {}
        }
      })
      .catch(() => {
        // Backend unavailable or network error, keep localItems
      });
  }, []);

  // ─── Persist to localStorage on change only after initialization ──────────
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, isInitialized]);

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ─── Add to cart ──────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (product: Product, quantity: number = 1) => {
      // 1. Optimistic local update
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });

      showToast(`Added "${product.title.slice(0, 24)}..." to cart!`);

      // 2. Resolve variant ID if not present on product card
      let variantId = product.variantId;
      if (!variantId && product.slug) {
        try {
          const detailRes: any = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://13.140.181.253/api/v1"}/products/${product.slug}`
          ).then((r) => r.json());
          const variants = detailRes?.data?.variants || [];
          const defaultVar = variants.find((v: any) => v.is_default) || variants[0];
          if (defaultVar?.id) {
            variantId = defaultVar.id;
          }
        } catch {
          // ignore
        }
      }

      // 3. API sync with resolved variantId
      if (variantId) {
        try {
          const apiCart = await cartService.addItem({
            variant_id: variantId,
            quantity
          });

          // Sync whole cart from server response if available
          const serverItems = mapApiCartToItems(apiCart);
          if (serverItems.length > 0) {
            setCart(serverItems);
            try {
              localStorage.setItem(LOCAL_KEY, JSON.stringify(serverItems));
            } catch {}
          } else {
            const apiItemId =
              apiCart?.item?.id ||
              apiCart?.data?.item?.id ||
              apiCart?.items?.find((i: any) => i.variant_id === variantId)?.id ||
              apiCart?.data?.items?.find((i: any) => i.variant_id === variantId)?.id;

            if (apiItemId) {
              setCart((prev) =>
                prev.map((item) =>
                  item.product.id === product.id
                    ? {
                        ...item,
                        apiCartItemId: apiItemId,
                        product: { ...item.product, variantId }
                      }
                    : item
                )
              );
            }
          }
        } catch {
          // local cart still works even if network hiccup
        }
      }
    },
    [showToast]
  );

  // ─── Remove from cart ─────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    (productId: string) => {
      setCart((prev) => {
        const item = prev.find((i) => i.product.id === productId);
        if (item?.apiCartItemId) {
          cartService.removeItem(item.apiCartItemId).catch(() => {});
        }
        return prev.filter((i) => i.product.id !== productId);
      });
      showToast("Item removed from cart");
    },
    [showToast]
  );

  // ─── Update quantity ──────────────────────────────────────────────────────
  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setCart((prev) => {
        const updated = prev.map((item) => {
          if (item.product.id !== productId) return item;
          if (item.apiCartItemId) {
            cartService.updateItem(item.apiCartItemId, quantity).catch(() => {});
          }
          return { ...item, quantity };
        });
        return updated;
      });
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {}
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        quickViewProduct,
        setQuickViewProduct,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
