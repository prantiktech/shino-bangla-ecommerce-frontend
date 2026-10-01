"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

/** Empties the local cart once an online payment is confirmed. */
export function ClearCartOnSuccess() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
