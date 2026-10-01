import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF5B00",
};

export const metadata: Metadata = {
  title: {
    default: "Nogod Bazar - Trusted Online Shopping in Bangladesh",
    template: "%s | Nogod Bazar",
  },
  applicationName: "Nogod Bazar",
  description:
    "Discover the finest collection of products, safety equipment, hardware, and books with instant delivery and cash on delivery at Nogod Bazar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className="min-h-screen flex flex-col bg-canvas font-sans antialiased text-slate-800 selection:bg-primary selection:text-white">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
