import React, { Suspense } from "react";
import { TopHeader } from "./TopHeader";
import { NavBar } from "./NavBar";

/**
 * Global storefront header. Rendered once from the (user) layout so every
 * page shares the exact same top bar and category navigation.
 */
export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-[0_1px_0_rgb(15_23_42/0.04),0_2px_8px_-2px_rgb(15_23_42/0.08)]">
      <TopHeader />
      <Suspense fallback={<div className="h-11 bg-primary" aria-hidden="true" />}>
        <NavBar />
      </Suspense>
    </header>
  );
};
