"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { subscribeNewsletterAction } from "@/app/(user)/actions/content";

export const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const { showToast } = useCart();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showToast("Please enter a valid email address.");
      return;
    }
    setSubscribing(true);
    try {
      const res = await subscribeNewsletterAction(email, "footer");
      if (res.success) {
        showToast(res.data?.message || "Thank you for subscribing to our newsletter!");
        setEmail("");
      } else {
        showToast(res.error?.message || "Failed to subscribe. Please try again.");
      }
    } catch {
      showToast("Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex w-full md:w-auto md:min-w-[380px] gap-2">
      <label htmlFor="footer-newsletter" className="sr-only">
        Email address
      </label>
      <input
        id="footer-newsletter"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={subscribing}
        placeholder="Enter your email"
        autoComplete="email"
        className="h-11 px-4 text-sm bg-slate-950/60 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 flex-1 min-w-0 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={subscribing}
        className="h-11 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
      >
        <span>{subscribing ? "Subscribing..." : "Subscribe"}</span>
        <Send className="w-4 h-4 hidden sm:block" />
      </button>
    </form>
  );
};
