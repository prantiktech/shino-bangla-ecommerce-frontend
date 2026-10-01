import React from "react";
import { SITE_URL } from "@/lib/api/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugAction, getProductsAction, getRelatedProductsAction } from "@/app/(user)/actions/products";
import { ProductDetailClient } from "./_components/ProductDetailClient";
import { DeliveryInfo } from "@/components/products/DeliveryInfo";
import { poishaToTaka } from "@/lib/utils/money";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = SITE_URL;

  const res = await getProductBySlugAction(slug);
  if (!res.success || !res.data) {
    return {
      title: "Product Details",
      description: "Buy genuine products and hardware online at Nogod Bazar.",
    };
  }

  const product = res.data;
  const title = `${product.name}`;
  const priceTaka = poishaToTaka(product.price.min);
  const description = product.short_description || `Buy ${product.name} online for ৳${priceTaka.toFixed(2)}. 100% genuine products with fast delivery in Bangladesh.`;
  const imageUrl = product.image || product.main_image || `${baseUrl}/placeholder.svg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${product.slug}`,
      siteName: "Nogod Bazar",
      locale: "en_BD",
      type: "website",
      images: [
        {
          url: imageUrl,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = SITE_URL;

  // Fetch product detail on the server
  const productRes = await getProductBySlugAction(slug);

  if (!productRes.success || !productRes.data) {
    notFound();
  }

  const product = productRes.data;

  // Linked products curated in the admin panel (falls back to the same category).
  const [relatedRes, crossRes, upsellRes] = await Promise.all([
    getRelatedProductsAction(product.slug, "related"),
    getRelatedProductsAction(product.slug, "cross_sell"),
    getRelatedProductsAction(product.slug, "upsell"),
  ]);
  const notSelf = (p: { id: number; slug: string }) => p.id !== product.id && p.slug !== product.slug;
  let similarProducts = (relatedRes.success ? relatedRes.data : []).filter(notSelf).slice(0, 10);
  const crossSellProducts = (crossRes.success ? crossRes.data : []).filter(notSelf).slice(0, 10);
  const upsellProducts = (upsellRes.success ? upsellRes.data : []).filter(notSelf).slice(0, 10);

  if (similarProducts.length === 0 && product.category?.slug) {
    const similarRes = await getProductsAction({ category: product.category.slug, per_page: 6 });
    if (similarRes.success && similarRes.data.items) {
      similarProducts = similarRes.data.items.filter(notSelf).slice(0, 5);
    }
  }

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image || product.main_image || `${baseUrl}/placeholder.svg`],
    "description": product.short_description || product.description || product.name,
    "sku": product.variants?.[0]?.sku || String(product.id),
    "brand": {
      "@type": "Brand",
      "name": product.brand?.name || "Nogod Bazar",
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.slug}`,
      "priceCurrency": "BDT",
      "price": poishaToTaka(product.price.min),
      "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Nogod Bazar",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient
        product={product}
        similarProducts={similarProducts}
        crossSellProducts={crossSellProducts}
        upsellProducts={upsellProducts}
      />
      <DeliveryInfo />
    </>
  );
}
