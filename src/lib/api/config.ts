/**
 * API Configuration Constants
 * Base URL and endpoint routes for Shino-Bangla eCommerce Backend
 */

/**
 * Single source of truth for the backend address.
 * Set API_BASE_URL (server only) or NEXT_PUBLIC_API_BASE_URL; NEXT_PUBLIC_API_URL is still honoured.
 */
export const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://13.140.181.253/api/v1"
).replace(/\/+$/, "");

/** Public address of this storefront, used for absolute links (sitemap, robots). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const API_ENDPOINTS = {
  // 00 · Health & Settings
  HEALTH: "/health",
  SETTINGS: "/settings",

  // 01 · Shop Browsing
  CATEGORIES: "/categories",
  CATEGORY_BY_SLUG: (slug: string) => `/categories/${slug}`,
  BRANDS: "/brands",
  BRAND_BY_SLUG: (slug: string) => `/brands/${slug}`,
  PRODUCTS: "/products",
  PRODUCT_FACETS: "/products/facets",
  PRODUCT_SUGGEST: "/products/suggest",
  PRODUCT_BY_SLUG: (slug: string) => `/products/${slug}`,
  PRODUCT_RELATED: (slug: string) => `/products/${slug}/related`,
  PRODUCT_REVIEWS: (slug: string) => `/products/${slug}/reviews`,
  HOME: "/home",
  PAGES: "/pages",
  PAGE_BY_SLUG: (slug: string) => `/pages/${slug}`,
  FAQS: "/faqs",
  SITEMAP: "/sitemap",

  // 02 · Auth & Account
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_OTP_VERIFY: "/auth/otp/verify",
  AUTH_OTP_RESEND: "/auth/otp/resend",
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
  AUTH_RESET_PASSWORD: "/auth/reset-password",
  AUTH_CHANGE_PASSWORD: "/auth/password",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_LOGOUT_ALL: "/auth/logout-all",
  AUTH_GOOGLE: "/auth/google",
  AUTH_TOKENS: "/auth/tokens",
  ME: "/me",
  ME_CONTACT: "/me/contact",
  ME_CONTACT_VERIFY: "/me/contact/verify",

  // 03 · Addresses
  ADDRESSES: "/me/addresses",
  ADDRESS_BY_ID: (id: number | string) => `/me/addresses/${id}`,

  // 04 · Wishlist & Recently Viewed
  WISHLIST: "/me/wishlist",
  WISHLIST_ITEM: (productId: number | string) => `/me/wishlist/${productId}`,
  RECENTLY_VIEWED: "/me/recently-viewed",

  // 05 · Cart
  CART: "/cart",
  CART_ITEMS: "/cart/items",
  CART_ITEM_BY_ID: (id: number | string) => `/cart/items/${id}`,
  CART_COUPON: "/cart/coupon",
  CART_CLAIM: "/cart/claim",

  // 06 · Checkout & Buy Now
  CHECKOUT_LOCATIONS: "/locations",
  CHECKOUT_SHIPPING_METHODS: "/shipping/zones",
  CHECKOUT_QUOTE: "/checkout/quote",
  CHECKOUT: "/checkout",
  BUY_NOW_QUOTE: "/buy-now/quote",
  BUY_NOW: "/buy-now",

  // 08 · Orders
  MY_ORDERS: "/me/orders",
  ORDER_BY_NUMBER: (orderNumber: string) => `/me/orders/${orderNumber}`,
  ORDER_CANCEL: (orderNumber: string) => `/me/orders/${orderNumber}/cancel`,
  ORDER_INVOICE: (orderNumber: string) => `/me/orders/${orderNumber}/invoice`,
  TRACK_ORDER: "/orders/track",
  ORDER_PAY: (orderNumber: string) => `/orders/${orderNumber}/pay`,

  // 09 · Reviews
  MY_REVIEWS: "/me/reviews",
  REVIEW_BY_ID: (id: number | string) => `/me/reviews/${id}`,
  REVIEWABLE_ITEMS: "/me/reviewable-items",
  REVIEW_PHOTOS: "/me/reviews/photos",

  // 10 · Contact & Newsletter
  CONTACT: "/contact",
  NEWSLETTER_SUBSCRIBE: "/newsletter/subscribe",
  NEWSLETTER_UNSUBSCRIBE: "/newsletter/unsubscribe",
  TRACK_VIEW: "/track/view"
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "shino_customer_token",
  USER_DATA: "shino_customer_user",
  CART_TOKEN: "shino_cart_token"
} as const;
