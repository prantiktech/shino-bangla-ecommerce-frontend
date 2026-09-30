"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ChevronLeft, LogOut, Search, User } from "lucide-react";
import { AdminSidebar } from "./components/Sidebar";
import { adminLogoutAction } from "./actions/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex w-full min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden lg:block bg-[#1E293B] border-r border-slate-700/60 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <AdminSidebar
          isCollapsed={isCollapsed}
          setIsMobileOpen={setIsMobileOpen}
        />
      </aside>

      {/* 2. Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#1E293B] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            <AdminSidebar
              isCollapsed={false}
              setIsMobileOpen={setIsMobileOpen}
              forceOpen={true}
            />
          </aside>
        </div>
      )}

      {/* 3. Main Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-3.5 flex-1 max-w-xl">
            <button
              onClick={() => {
                if (!isDesktop) {
                  setIsMobileOpen(true);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              {isDesktop && !isCollapsed ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className="relative w-full max-w-md hidden sm:block">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search catalogue, orders, customers..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 focus:bg-white transition-all rounded-lg pl-9 pr-4 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#FF5B00] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                A
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">Admin User</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Super Admin</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
