/**
 * API Configuration Constants
 * Base URL and endpoint routes for Shino-Bangla eCommerce Backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://13.140.181.253/api/v1";

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
  PRODUCT_BY_SLUG: (slug: string) => `/products/${slug}`,
  PRODUCT_RELATED: (slug: string) => `/products/${slug}/related`,

  // 02 · Auth & Account
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_OTP_VERIFY: "/auth/otp/verify",
  AUTH_OTP_RESEND: "/auth/otp/resend",
  AUTH_FORGOT_PASSWORD: "/auth/password/forgot",
  AUTH_RESET_PASSWORD: "/auth/password/reset",
  AUTH_LOGOUT: "/auth/logout",
  ME: "/me",

  // 03 · Addresses
  ADDRESSES: "/account/addresses",
  ADDRESS_BY_ID: (id: number) => `/account/addresses/${id}`,
  ADDRESS_DEFAULT: (id: number) => `/account/addresses/${id}/default`,

  // 04 · Wishlist & Recently Viewed
  WISHLIST: "/account/wishlist",
  WISHLIST_ADD: "/account/wishlist",
  WISHLIST_ITEM: (productId: number) => `/account/wishlist/${productId}`,
  RECENTLY_VIEWED: "/account/recently-viewed",

  // 05 · Cart
  CART: "/cart",
  CART_ITEMS: "/cart/items",
  CART_ITEM_BY_ID: (id: number) => `/cart/items/${id}`,
  CART_COUPON: "/cart/coupons",
  CART_ESTIMATE: "/cart/estimate-delivery",
  CART_CLAIM: "/cart/claim",

  // 06 · Checkout
  CHECKOUT_LOCATIONS: "/checkout/locations",
  CHECKOUT_SHIPPING_METHODS: "/checkout/shipping-methods",
  CHECKOUT: "/checkout",

  // 07 · Buy Now
  BUY_NOW: "/buy-now",

  // 08 · Orders
  MY_ORDERS: "/account/orders",
  ORDER_BY_NUMBER: (orderNumber: string) => `/account/orders/${orderNumber}`,
  TRACK_ORDER: "/orders/track",

  // 09 · Reviews
  REVIEWS: "/reviews",
  MY_REVIEWS: "/account/reviews",

  // 10 · Contact & Newsletter
  CONTACT: "/contact",
  NEWSLETTER_SUBSCRIBE: "/newsletter/subscribe"
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "shino_customer_token",
  USER_DATA: "shino_customer_user",
  CART_TOKEN: "shino_cart_token"
} as const;
