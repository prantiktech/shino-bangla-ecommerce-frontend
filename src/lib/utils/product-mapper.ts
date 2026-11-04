import { Product } from "@/types";
import { ApiProduct } from "@/app/(user)/actions/products";
import { poishaToTaka } from "@/lib/utils/money";
import { imageAlt, imageSrc } from "@/lib/utils/image";

export function mapApiProductToProduct(apiProd: ApiProduct): Product {
  const minTaka = poishaToTaka(apiProd.price?.min || 0);
  const compareTaka = apiProd.price?.compare_at ? poishaToTaka(apiProd.price.compare_at) : undefined;

  let discountBadge: string | undefined = undefined;
  if (apiProd.price?.discount_percent) {
    discountBadge = `${apiProd.price.discount_percent}% OFF`;
  } else if (compareTaka && compareTaka > minTaka) {
    discountBadge = `৳${Math.round(compareTaka - minTaka)} OFF`;
  }

  // Use the default variant's ID (or first variant) for API cart sync
  const variants = apiProd.variants || [];
  const defaultVariant = variants.find((v) => v.is_default) || variants[0];
  const rawImg = apiProd.image ?? apiProd.main_image;

  return {
    id: String(apiProd.id),
    title: apiProd.name,
    slug: apiProd.slug,
    image: imageSrc(rawImg, "card", "/placeholder.svg"),
    thumbImage: imageSrc(rawImg, "thumb", "/placeholder.svg"),
    fullImage: imageSrc(rawImg, "full", "/placeholder.svg"),
    imageAlt: imageAlt(rawImg, apiProd.name),
    price: minTaka,
    originalPrice: compareTaka,
    discountBadge,
    rating: apiProd.rating?.average || 5.0,
    reviewCount: apiProd.rating?.count || 0,
    soldCount: 18,
    category: apiProd.category?.slug || "all",
    brand: apiProd.brand?.name || undefined,
    inStock: apiProd.in_stock ?? true,
    isNewArrival: apiProd.is_new_arrival || false,
    isFlashDeal: apiProd.is_trending || Boolean(apiProd.price?.discount_percent),
    description: apiProd.short_description || apiProd.description || "",
    variantId: defaultVariant?.id,
  };
}

