"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RefreshCcw,
  Headphones,
  Mail,
  Send,
  PhoneCall,
  MapPin,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const FOOTER_SECTIONS = [
  {
    title: "Categories",
    links: [
      { label: "Safety Equipment", href: "/category/safety-equipment" },
      { label: "Fire Extinguishers", href: "/category/fire-extinguishers" },
      { label: "Alarms & Detectors", href: "/category/alarms-detectors" },
      { label: "Hardware & Fasteners", href: "/category/hardware" },
      { label: "Safety Manuals", href: "/category/safety-manuals" },
    ],
  },
  {
    title: "Customer Support",
    links: [
      { label: "Track Your Order", href: "/track-order" },
      { label: "All Products", href: "/products" },
      { label: "All Brands", href: "/brands" },
      { label: "Staff Portal", href: "/admin/login" },
      { label: "My Account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/blogs" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Return Policy", href: "#" },
      { label: "Contact Us", href: "/track-order" },
    ],
  },
];

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const { showToast } = useCart();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }
    showToast("Thank you for subscribing to our newsletter!");
    setEmail("");
  };

  return (
    <footer className="bg-slate-900 text-gray-300 pt-12 pb-24 md:pb-12 border-t border-slate-800">
      {/* Guarantees / Service Highlights */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF5B00] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-white">Super Fast Delivery</h4>
              <p className="text-[11px] text-gray-400">All across Bangladesh</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF5B00] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-white">100% Genuine Products</h4>
              <p className="text-[11px] text-gray-400">Certified industrial standards</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF5B00] shrink-0">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-white">Easy Exchange</h4>
              <p className="text-[11px] text-gray-400">7-day hassle free policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF5B00] shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-white">Dedicated Support</h4>
              <p className="text-[11px] text-gray-400">9 AM - 10 PM daily</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#009cae] flex items-center justify-center text-white font-extrabold text-base">
                C
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Cembula Store
              </span>
            </Link>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Bangladesh&apos;s premier destination for genuine safety equipment, certified fire extinguishers, industrial hardware, and safety handbooks.
            </p>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-[#FF5B00]" />
                <span>+880 1700-000000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FF5B00]" />
                <span>shop@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF5B00]" />
                <span>12/A Motijheel, Dhaka 1000, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Nav Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2 text-xs">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-[#FF5B00] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm md:text-base font-bold text-white">
              Subscribe to Get Exclusive Offers & Product Updates
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Receive updates on new catalog additions and safety equipment promotions.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto max-w-md gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5B00] flex-1"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#FF5B00] hover:bg-[#E64E00] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <span>Subscribe</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2">
        <p>© 2026 Demo Safety Store. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Safe & Secure Payments</span>
          <span>•</span>
          <span>Cash On Delivery Available</span>
        </p>
      </div>
    </footer>
  );
};
