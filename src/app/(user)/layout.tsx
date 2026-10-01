import React from "react";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import { MobileBottomNav } from "@/components/layout/MobileNav/MobileBottomNav";
import { FloatingChat } from "@/components/layout/FloatingChat";
import { QuickViewModal } from "@/components/common/QuickViewModal";
import { CartDrawer } from "@/components/common/CartDrawer";
import { ToastNotification } from "@/components/common/ToastNotification";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <FloatingChat />
      <QuickViewModal />
      <CartDrawer />
      <ToastNotification />
    </div>
  );
}
