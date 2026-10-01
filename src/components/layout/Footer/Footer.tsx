import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RefreshCcw,
  Headphones,
  Mail,
  PhoneCall,
  MapPin,
  Banknote,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { NewsletterForm } from "./NewsletterForm";
import { getSettingsAction } from "@/app/(user)/actions/settings";
import { getPagesAction } from "@/app/(user)/actions/content";
import { getCategoriesAction } from "@/app/(user)/actions/categories";

const SERVICE_HIGHLIGHTS = [
  { icon: Truck, title: "Fast Delivery", text: "All across Bangladesh" },
  { icon: ShieldCheck, title: "100% Genuine", text: "Sourced from trusted brands" },
  { icon: RefreshCcw, title: "Easy Returns", text: "7-day hassle-free policy" },
  { icon: Headphones, title: "Dedicated Support", text: "9 AM - 10 PM, every day" },
];

const SUPPORT_LINKS = [
  { label: "Track Your Order", href: "/track-order" },
  { label: "My Account", href: "/account" },
  { label: "My Orders", href: "/account?tab=orders" },
  { label: "All Products", href: "/products" },
  { label: "All Brands", href: "/brands" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

type FooterLink = { label: string; href: string };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Storefront footer. Server component: store contact details, CMS pages and
 * top categories come straight from the API so nothing is hard-coded.
 */
export async function Footer() {
  const [settingsRes, pagesRes, categoriesRes] = await Promise.all([
    getSettingsAction(),
    getPagesAction(),
    getCategoriesAction(),
  ]);

  const settings = settingsRes.success ? settingsRes.data : null;
  const pages = pagesRes.success ? pagesRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  const categoryLinks: FooterLink[] = categories
    .slice(0, 6)
    .map((c: { name: string; slug: string }) => ({ label: c.name, href: `/category/${c.slug}` }));

  const companyLinks: FooterLink[] = [
    ...pages.map((p) => ({ label: p.title, href: `/pages/${p.slug}` })),
    { label: "Guides & Articles", href: "/blogs" },
  ];

  const storeName = settings?.store_name || "Nogod Bazar";
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pb-24 md:pb-0">
      {/* Service highlights */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {SERVICE_HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center text-brand-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-xs text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          <div className="col-span-2 space-y-5">
            <Logo variant="light" />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Bangladesh&apos;s trusted destination for genuine products, hardware and safety
              equipment, delivered fast with cash on delivery.
            </p>

            {settings && (
              <ul className="space-y-2.5 text-sm">
                {settings.store_phone && (
                  <li>
                    <a
                      href={`tel:${settings.store_phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                    >
                      <PhoneCall className="w-4 h-4 text-brand-400 shrink-0" />
                      <span>{settings.store_phone}</span>
                    </a>
                  </li>
                )}
                {settings.store_email && (
                  <li>
                    <a
                      href={`mailto:${settings.store_email}`}
                      className="inline-flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="break-all">{settings.store_email}</span>
                    </a>
                  </li>
                )}
                {settings.store_address && (
                  <li className="flex items-start gap-2.5 text-slate-300">
                    <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{settings.store_address}</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          <FooterColumn title="Shop" links={categoryLinks} />
          <FooterColumn title="Customer Care" links={SUPPORT_LINKS} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        {/* Newsletter */}
        <div className="mt-12 p-6 md:p-8 rounded-2xl bg-slate-800/60 ring-1 ring-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">
              Get exclusive offers and product updates
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Join our newsletter. No spam, unsubscribe any time.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {year} {storeName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <li className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Secure payments
            </li>
            {(settings?.cod_enabled ?? true) && (
              <li className="inline-flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                Cash on delivery
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
