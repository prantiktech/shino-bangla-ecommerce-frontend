"use client";

import React from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const ToastNotification: React.FC = () => {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Notification</p>
          <p className="text-xs text-gray-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
};
