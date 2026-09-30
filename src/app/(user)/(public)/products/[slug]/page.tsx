import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugAction, getProductsAction } from "@/app/(user)/actions/products";
import { ProductDetailClient } from "./_components/ProductDetailClient";
import { poishaToTaka } from "@/lib/utils/money";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await getProductBySlugAction(slug);
  if (!res.success || !res.data) {
    return {
      title: "Product Details | Demo Safety Store",
      description: "Buy genuine safety equipment and hardware products online.",
    };
  }

  const product = res.data;
  const title = `${product.name} | Demo Safety Store`;
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
      siteName: "Demo Safety Store",
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Fetch product detail on the server
  const productRes = await getProductBySlugAction(slug);

  if (!productRes.success || !productRes.data) {
    notFound();
  }

  const product = productRes.data;

  // Fetch similar products dynamically from the same category or general catalog
  let similarProducts: any[] = [];
  if (product.category?.slug) {
    const similarRes = await getProductsAction({
      category: product.category.slug,
      per_page: 6,
    });
    if (similarRes.success && similarRes.data.items) {
      similarProducts = similarRes.data.items
        .filter((p) => p.slug !== product.slug && p.id !== product.id)
        .slice(0, 5);
    }
  }

  if (similarProducts.length === 0) {
    const generalRes = await getProductsAction({ per_page: 6 });
    if (generalRes.success && generalRes.data.items) {
      similarProducts = generalRes.data.items
        .filter((p) => p.slug !== product.slug && p.id !== product.id)
        .slice(0, 5);
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
      "name": product.brand?.name || "Demo Safety Store",
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.slug}`,
      "priceCurrency": "BDT",
      "price": poishaToTaka(product.price.min),
      "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Demo Safety Store",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} similarProducts={similarProducts} />
    </>
  );
}
