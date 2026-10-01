"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Check,
  Share2,
  Heart,
  Minus,
  Plus,
  Sparkles,
  Info,
  ChevronRight,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { ApiProduct, ApiProductVariant } from "@/app/(user)/actions/products";
import { getProductReviewsAction, PublicReview } from "@/app/(user)/actions/reviews";
import { recordProductViewAction, addToWishlistAction, removeFromWishlistAction } from "@/app/(user)/actions/wishlist";
import { ProductCard } from "@/components/common/ProductCard";
import { BuyNowModal } from "@/components/common/BuyNowModal";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { poishaToTaka, formatVatRate } from "@/lib/utils/money";
import { mapApiProductToProduct } from "@/lib/utils/product-mapper";
import { Product } from "@/types";

interface ProductDetailClientProps {
  product: ApiProduct;
  similarProducts: ApiProduct[];
  crossSellProducts?: ApiProduct[];
  upsellProducts?: ApiProduct[];
}

export function ProductDetailClient({ product, similarProducts, crossSellProducts = [], upsellProducts = [] }: ProductDetailClientProps) {
  const router = useRouter();
  const { cart, addToCart, updateQuantity, removeFromCart, setIsCartOpen, showToast } = useCart();
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const itemInCart = cart.find((item) => String(item.product.id) === String(product.id));
  const quantityInCart = itemInCart ? itemInCart.quantity : 0;

  // Active Variant State (if variants exist)
  const variants = product.variants || [];
  const defaultVariant = variants.find((v) => v.is_default) || variants[0] || null;
  const [selectedVariant, setSelectedVariant] = useState<ApiProductVariant | null>(defaultVariant);

  // Quantity State
  const [quantity, setQuantity] = useState<number>(1);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState<boolean>(false);

  // Active Tab: description, specs, reviews
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [hasLoadedReviews, setHasLoadedReviews] = useState<boolean>(false);

  React.useEffect(() => {
    if (activeTab === "reviews" && !hasLoadedReviews) {
      setReviewsLoading(true);
      getProductReviewsAction(product.slug)
        .then((res) => {
          if (res.success && res.data) {
            setReviews(res.data.reviews);
          }
          setHasLoadedReviews(true);
        })
        .finally(() => setReviewsLoading(false));
    }
  }, [activeTab, hasLoadedReviews, product.slug]);

  // Track product view & recently viewed
  React.useEffect(() => {
    if (product?.id && product?.slug) {
      recordProductViewAction(product.id, product.slug);
    }
  }, [product?.id, product?.slug]);

  // Main Image Active State
  const allImages = [
    product.image || product.main_image || "/placeholder.svg",
    ...(product.gallery || []),
  ].filter(Boolean);
  const [activeImage, setActiveImage] = useState<string>(
    selectedVariant?.image || allImages[0] || "/placeholder.svg"
  );

  // Compute Active Pricing from Variant or Product Root
  const activePricePoisha = selectedVariant ? selectedVariant.price : product.price.min;
  const activeComparePoisha = selectedVariant?.compare_at || product.price.compare_at;
  const activeDiscountPercent =
    selectedVariant?.discount_percent || product.price.discount_percent;

  const currentPriceTaka = poishaToTaka(activePricePoisha);
  const originalPriceTaka = activeComparePoisha ? poishaToTaka(activeComparePoisha) : null;
  const savingsTaka = originalPriceTaka && originalPriceTaka > currentPriceTaka
    ? originalPriceTaka - currentPriceTaka
    : null;

  const isCurrentlyInStock = selectedVariant ? selectedVariant.in_stock : product.in_stock;

  // Handle Variant Selection
  const handleSelectVariant = (v: ApiProductVariant) => {
    setSelectedVariant(v);
    if (v.image) {
      setActiveImage(v.image);
    }
  };

  // Convert current state into Cart UI Product model
  const getUiProduct = (): Product => {
    return {
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : String(product.id),
      title: selectedVariant
        ? `${product.name} (${selectedVariant.label || selectedVariant.value})`
        : product.name,
      slug: product.slug,
      image: activeImage,
      price: currentPriceTaka,
      originalPrice: originalPriceTaka || undefined,
      discountBadge: activeDiscountPercent ? `${activeDiscountPercent}% OFF` : undefined,
      rating: product.rating?.average || 5.0,
      reviewCount: product.rating?.count || 0,
      soldCount: 24,
      category: product.category?.slug || "general",
      brand: product.brand?.name,
      inStock: isCurrentlyInStock,
      isNewArrival: product.is_new_arrival,
      isFlashDeal: product.is_trending,
      // Pass variantId so CartContext can sync with the API
      variantId: selectedVariant ? selectedVariant.id : variants[0]?.id,
    };
  };


  const handleAddToCart = () => {
    if (!isCurrentlyInStock) {
      showToast("This item is currently out of stock.");
      return;
    }
    const item = getUiProduct();
    addToCart(item, quantity);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!isCurrentlyInStock) {
      showToast("This item is currently out of stock.");
      return;
    }
    setIsBuyNowOpen(true);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!");
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showToast("Please sign in to save products to your wishlist.");
      return;
    }
    if (isWishlisted) {
      setIsWishlisted(false);
      await removeFromWishlistAction(product.id);
      showToast("Removed from wishlist");
    } else {
      setIsWishlisted(true);
      await addToWishlistAction(product.id);
      showToast("Saved to your wishlist!");
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-slate-200/70 py-2.5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap [&>li]:shrink-0">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
            <li>
              <Link href="/products" className="hover:text-primary transition-colors">
                Products
              </Link>
            </li>
            {product.category && (
              <>
                <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
                <li>
                  <Link
                    href={`/category/${product.category.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
            <li className="font-semibold text-gray-800 truncate max-w-xs">{product.name}</li>
          </ol>
        </div>
      </nav>

      {/* 2. Main Product Info Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-8 shadow-xs">
          
          {/* Left Column: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Big Main Image Container */}
            <div className="relative aspect-square w-full rounded-2xl bg-gray-50/80 border border-gray-100 overflow-hidden flex items-center justify-center p-4">
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                {activeDiscountPercent && (
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-sm">
                    {activeDiscountPercent}% OFF
                  </span>
                )}
                {product.is_featured && (
                  <span className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow-sm">
                    Featured
                  </span>
                )}
              </div>

              {/* Share & Wishlist buttons */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={handleToggleWishlist}
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-colors cursor-pointer ${
                    isWishlisted
                      ? "bg-rose-50 text-rose-500"
                      : "bg-white/90 hover:bg-white text-gray-600 hover:text-rose-500"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
                <button
                  onClick={handleShare}
                  title="Copy link"
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-contain p-4 transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-gray-50 ${
                      activeImage === img
                        ? "border-primary shadow-sm scale-95"
                        : "border-gray-200/80 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Purchasing & Summary (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Category & Stock Tag */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && (
                    <Link
                      href={`/category/${product.category.slug}`}
                      className="text-xs font-bold text-primary hover:underline bg-brand-50 px-2.5 py-1 rounded-md"
                    >
                      {product.category.name}
                    </Link>
                  )}
                  {product.brand && (
                    <span className="text-xs text-gray-500 font-semibold">
                      Brand: <span className="text-gray-900 font-bold">{product.brand.name}</span>
                    </span>
                  )}
                </div>

                {isCurrentlyInStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* SKU & Ratings */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pb-2 border-b border-gray-100 flex-wrap">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating?.average?.toFixed(1) || "5.0"}</span>
                  <span className="text-gray-400 font-normal">
                    ({product.rating?.count || 0} customer reviews)
                  </span>
                </div>
                {selectedVariant?.sku && (
                  <span className="font-mono text-gray-400">
                    SKU: <span className="text-gray-700 font-semibold">{selectedVariant.sku}</span>
                  </span>
                )}
              </div>

              {/* Price Banner */}
              <div className="bg-brand-50 border border-brand-100/90 rounded-2xl p-4 sm:p-5 flex flex-wrap items-baseline gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-primary">
                    ৳ {currentPriceTaka.toFixed(2)}
                  </span>
                  {originalPriceTaka && originalPriceTaka > currentPriceTaka && (
                    <span className="text-sm sm:text-base text-gray-400 line-through font-semibold">
                      ৳ {originalPriceTaka.toFixed(2)}
                    </span>
                  )}
                </div>

                {savingsTaka && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    Save ৳{savingsTaka.toFixed(2)}
                  </span>
                )}

                {product.vat_rate_bp !== undefined && (
                  <span className="text-[11px] text-gray-500 block w-full mt-1">
                    VAT included ({formatVatRate(product.vat_rate_bp)})
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Variant Selector (e.g. Weight: 1kg, 2kg, 5kg) */}
              {variants.length > 1 && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-gray-900 block">
                    Select {product.option?.name || "Option"}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleSelectVariant(variant)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs scale-102"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                          } ${!variant.in_stock ? "opacity-50 line-through" : ""}`}
                        >
                          {variant.label || variant.value}
                          <span className="ml-1.5 opacity-90 text-[11px]">
                            - ৳{poishaToTaka(variant.price).toFixed(0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & CTA Button Row */}
              <div className="space-y-4 pt-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  
                  {/* Quantity Controller */}
                  <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden h-11">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-gray-900 select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart / Quantity Controller Button */}
                  {quantityInCart > 0 ? (
                    <div className="flex-1 min-w-[160px] h-11 px-3 bg-brand-50/90 border-2 border-primary rounded-xl flex items-center justify-between shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (quantityInCart <= 1) {
                            removeFromCart(String(product.id));
                          } else {
                            updateQuantity(String(product.id), quantityInCart - 1);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-primary hover:bg-brand-100 flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 select-none">
                        <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                        <span>{quantityInCart} In Cart</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQuantity(String(product.id), quantityInCart + 1)}
                        className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={!isCurrentlyInStock}
                      className="flex-1 min-w-[160px] h-11 px-5 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  )}

                  {/* Buy Now Button */}
                  <button
                    onClick={handleBuyNow}
                    disabled={!isCurrentlyInStock}
                    className="flex-1 min-w-[160px] h-11 px-5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Buy Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Guarantees Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[11px] font-semibold">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold">100% Genuine</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <RefreshCcw className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-[11px] font-semibold">7-Day Returns</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Check className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-[11px] font-semibold">Cash On Delivery</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 3. Detailed Tabs (Description, Specifications, Reviews) */}
        <div className="mt-8 bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 bg-gray-50/60 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "description"
                  ? "border-primary text-primary bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Description & Overview
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-primary text-primary bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Specifications {product.specifications?.length ? `(${product.specifications.length})` : ""}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "reviews"
                  ? "border-primary text-primary bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Reviews & Ratings ({product.rating?.count || 0})
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6 sm:p-8">
            {activeTab === "description" && (
              <div className="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
                {product.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="leading-relaxed"
                  />
                ) : (
                  <p>{product.short_description || "Detailed description coming soon."}</p>
                )}
              </div>
            )}

            {activeTab === "specs" && (
              <div>
                {product.specifications && product.specifications.length > 0 ? (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {product.specifications.map((spec, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 p-3.5 text-xs sm:text-sm even:bg-gray-50/50"
                      >
                        <span className="font-bold text-gray-800 col-span-1">{spec.key}</span>
                        <span className="text-gray-600 col-span-2">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No technical specifications specified for this item.
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-brand-50 border border-brand-100 max-w-lg">
                  <div className="text-center">
                    <span className="text-4xl sm:text-5xl font-black text-primary">
                      {product.rating?.average?.toFixed(1) || "5.0"}
                    </span>
                    <div className="flex items-center justify-center gap-1 text-amber-400 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Based on {product.rating?.count || reviews.length} reviews
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-800">100% Verified Purchases</p>
                    <p>All reviews are written by authentic store customers after receipt of goods.</p>
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    Loading customer reviews...
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="divide-y divide-gray-100 space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {rev.customer_name || "Verified Customer"}
                            </span>
                            {rev.verified_purchase && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {rev.comment}
                          </p>
                        )}
                        {rev.photos && rev.photos.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            {rev.photos.map((p, pIdx) => (
                              <div key={pIdx} className="w-14 h-14 rounded-lg bg-gray-50 relative overflow-hidden border border-gray-200">
                                <Image src={p} alt="Review attachment" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No customer reviews yet. Be the first verified buyer to share your feedback!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Related / Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Similar & Related Products</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  You may also like these
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={mapApiProductToProduct(p)} />
              ))}
            </div>
          </div>
        )}

        {[
          { title: "Frequently bought together", subtitle: "Customers often add these to the same order", items: crossSellProducts },
          { title: "Upgrade options", subtitle: "Bigger, better or higher-rated alternatives", items: upsellProducts },
        ]
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.title} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{g.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{g.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                {g.items.map((p) => (
                  <ProductCard key={p.id} product={mapApiProductToProduct(p)} />
                ))}
              </div>
            </section>
          ))}

        {/* 5. Buy Now Instant Modal */}
        {isBuyNowOpen && (
          <BuyNowModal
            isOpen={isBuyNowOpen}
            onClose={() => setIsBuyNowOpen(false)}
            variantId={selectedVariant?.id || product.variants?.[0]?.id}
            productSlug={product.slug}
            productTitle={product.name}
            productImage={selectedVariant?.image || activeImage || product.image || product.main_image}
            initialQuantity={quantity}
            initialPrice={currentPriceTaka}
            variantLabel={selectedVariant?.label || selectedVariant?.value}
            sku={selectedVariant?.sku}
            variants={product.variants}
            optionName={product.option?.name}
          />
        )}
      </div>
    </div>
  );
}
