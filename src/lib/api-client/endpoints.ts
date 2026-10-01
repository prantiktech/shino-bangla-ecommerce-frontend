/**
 * API Endpoints Registry for Shino-Bangla eCommerce Backend
 * Central repository for all backend route mappings (224 endpoints / 25 modules).
 * Formatted strictly according to api_documation.md
 */
export const ApiEndpoints = {
  // 00 · System & Public Settings
  GET_HEALTH: '/health',
  GET_SETTINGS: '/settings',

  // 01 · Browse the shop
  GET_CATEGORIES: '/categories',
  GET_CATEGORY: '/categories/:slug',
  GET_BRANDS: '/brands',
  GET_BRAND: '/brands/:slug',
  GET_PRODUCTS: '/products',
  GET_PRODUCT: '/products/:slug',
  GET_PRODUCT_FACETS: '/products/facets',
  GET_PRODUCT_SUGGEST: '/products/suggest',
  GET_PRODUCT_RELATED: '/products/:slug/related',
  GET_PRODUCT_REVIEWS: '/products/:slug/reviews',
  GET_HOME: '/home',
  GET_PAGES: '/pages',
  GET_PAGE: '/pages/:slug',
  GET_FAQS: '/faqs',
  GET_SITEMAP: '/sitemap',
  GET_LOCATIONS: '/locations',
  GET_SHIPPING_ZONES: '/shipping/zones',
  TRACK_VIEW: '/track/view',

  // 02 · Customer Auth & Account
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  LOGOUT_ALL: '/auth/logout-all',
  GET_ME: '/me',
  UPDATE_ME: '/me',
  VERIFY_OTP: '/auth/otp/verify',
  RESEND_OTP: '/auth/otp/resend',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/password',
  AUTH_GOOGLE: '/auth/google',
  AUTH_TOKENS: '/auth/tokens',
  REVOKE_TOKEN: '/auth/tokens/:token',
  CHANGE_CONTACT: '/me/contact',
  VERIFY_CONTACT: '/me/contact/verify',

  // 03 · Addresses
  GET_ADDRESSES: '/me/addresses',
  CREATE_ADDRESS: '/me/addresses',
  GET_ADDRESS: '/me/addresses/:id',
  UPDATE_ADDRESS: '/me/addresses/:id',
  DELETE_ADDRESS: '/me/addresses/:id',

  // 04 · Wishlist & Recently Viewed
  GET_WISHLIST: '/me/wishlist',
  ADD_WISHLIST: '/me/wishlist',
  REMOVE_WISHLIST: '/me/wishlist/:id',
  GET_RECENTLY_VIEWED: '/me/recently-viewed',
  ADD_RECENTLY_VIEWED: '/me/recently-viewed',

  // 05 · Cart
  GET_CART: '/cart',
  ADD_CART_ITEM: '/cart/items',
  UPDATE_CART_ITEM: '/cart/items/:id',
  REMOVE_CART_ITEM: '/cart/items/:id',
  SAVE_FOR_LATER: '/cart/items/:id/save-for-later',
  MOVE_TO_CART: '/cart/items/:id/move-to-cart',
  APPLY_COUPON: '/cart/coupon',
  REMOVE_COUPON: '/cart/coupon',
  CLAIM_CART: '/cart/claim',

  // 06 & 07 · Checkout & Buy Now
  CHECKOUT_QUOTE: '/checkout/quote',
  CHECKOUT: '/checkout',
  BUY_NOW_QUOTE: '/buy-now/quote',
  BUY_NOW: '/buy-now',

  // 08 · My Orders & Tracking
  GET_ORDERS: '/me/orders',
  GET_ORDER: '/me/orders/:orderNumber',
  GET_ORDER_INVOICE: '/me/orders/:orderNumber/invoice',
  CANCEL_ORDER: '/me/orders/:orderNumber/cancel',
  TRACK_ORDER: '/orders/track',
  ORDER_PAY: '/orders/:number/pay',

  // 09 · My Reviews
  GET_MY_REVIEWS: '/me/reviews',
  SUBMIT_REVIEW: '/me/reviews',
  SUBMIT_PRODUCT_REVIEW: '/me/reviews',
  GET_REVIEWABLE_ITEMS: '/me/reviewable-items',
  UPLOAD_REVIEW_PHOTO: '/me/reviews/photos',
  UPDATE_MY_REVIEW: '/me/reviews/:id',
  DELETE_MY_REVIEW: '/me/reviews/:id',

  // 10 · Contact & Newsletter
  CONTACT_SUBMIT: '/contact',
  NEWSLETTER_SUBSCRIBE: '/newsletter/subscribe',
  NEWSLETTER_UNSUBSCRIBE: '/newsletter/unsubscribe',

  // 12 · Back Office: Auth, Settings, Media
  ADMIN_LOGIN: '/auth/login',
  ADMIN_LOGOUT: '/auth/logout',
  GET_ADMIN_ME: '/me',
  GET_ADMIN_SETTINGS: '/admin/settings',
  UPDATE_ADMIN_SETTINGS: '/admin/settings',
  UPLOAD_ADMIN_LOGO: '/admin/settings/assets/logo',
  UPLOAD_ADMIN_MEDIA: '/admin/media',
  DELETE_ADMIN_MEDIA: '/admin/media/:id',

  // 13 · Back Office: Catalogue
  GET_ADMIN_BRANDS: '/admin/brands',
  CREATE_ADMIN_BRAND: '/admin/brands',
  GET_ADMIN_BRAND: '/admin/brands/:id',
  UPDATE_ADMIN_BRAND: '/admin/brands/:id',
  DELETE_ADMIN_BRAND: '/admin/brands/:id',

  GET_ADMIN_CATEGORIES: '/admin/categories',
  CREATE_ADMIN_CATEGORY: '/admin/categories',
  GET_ADMIN_CATEGORY: '/admin/categories/:id',
  UPDATE_ADMIN_CATEGORY: '/admin/categories/:id',
  DELETE_ADMIN_CATEGORY: '/admin/categories/:id',
  MOVE_ADMIN_CATEGORY: '/admin/categories/:id/move',

  GET_ADMIN_OPTION_TYPES: '/admin/option-types',
  CREATE_ADMIN_OPTION_TYPE: '/admin/option-types',
  UPDATE_ADMIN_OPTION_TYPE: '/admin/option-types/:id',
  DELETE_ADMIN_OPTION_TYPE: '/admin/option-types/:id',

  GET_ADMIN_PRODUCTS: '/admin/products',
  CREATE_ADMIN_PRODUCT: '/admin/products',
  GET_ADMIN_PRODUCT: '/admin/products/:id',
  UPDATE_ADMIN_PRODUCT: '/admin/products/:id',
  UPDATE_ADMIN_PRODUCT_STATUS: '/admin/products/:id/status',
  DUPLICATE_ADMIN_PRODUCT: '/admin/products/:id/duplicate',
  LINK_ADMIN_PRODUCT: '/admin/products/:id/links',
  DELETE_ADMIN_PRODUCT: '/admin/products/:id',
  BULK_ADMIN_PRODUCTS: '/admin/products/bulk',
  EXPORT_ADMIN_PRODUCTS: '/admin/products/export',

  // 14 · Back Office: Inventory
  GET_ADMIN_INVENTORY: '/admin/inventory',
  GET_ADMIN_INVENTORY_SUMMARY: '/admin/inventory/summary',
  GET_ADMIN_INVENTORY_MOVEMENTS: '/admin/inventory/movements',
  ADMIN_INVENTORY_ADJUSTMENTS: '/admin/inventory/adjustments',
  ADMIN_INVENTORY_PURCHASES: '/admin/inventory/purchases',
  ADMIN_INVENTORY_PURCHASE: '/admin/inventory/purchases/:id',
  UPDATE_ADMIN_INVENTORY_STOCK: '/admin/inventory/adjustments',
  GET_ADMIN_LOW_STOCK: '/admin/inventory/summary',

  // 15 · Back Office: Orders
  GET_ADMIN_ORDERS: '/admin/orders',
  CREATE_ADMIN_ORDER: '/admin/orders',
  GET_ADMIN_ORDER: '/admin/orders/:id',
  UPDATE_ADMIN_ORDER_STATUS: '/admin/orders/:id/status',
  UPDATE_ADMIN_ORDER_PAYMENT: '/admin/orders/:id/payment',
  GET_ADMIN_ORDER_INVOICE: '/admin/orders/:id/invoice',
  GET_ADMIN_ORDER_REFUNDS: '/admin/orders/:id/refunds',
  CREATE_ADMIN_ORDER_REFUND: '/admin/orders/:id/refunds',

  // 16 · Back Office: Customers
  GET_ADMIN_CUSTOMERS: '/admin/customers',
  GET_ADMIN_CUSTOMER: '/admin/customers/:id',
  UPDATE_ADMIN_CUSTOMER: '/admin/customers/:id',
  DELETE_ADMIN_CUSTOMER: '/admin/customers/:id',

  // 17 · Back Office: Discounts & Coupons
  GET_ADMIN_COUPONS: '/admin/coupons',
  CREATE_ADMIN_COUPON: '/admin/coupons',
  GET_ADMIN_COUPON: '/admin/coupons/:id',
  UPDATE_ADMIN_COUPON: '/admin/coupons/:id',
  DELETE_ADMIN_COUPON: '/admin/coupons/:id',

  GET_ADMIN_FLASH_SALES: '/admin/flash-sales',
  CREATE_ADMIN_FLASH_SALE: '/admin/flash-sales',
  GET_ADMIN_FLASH_SALE: '/admin/flash-sales/:id',
  UPDATE_ADMIN_FLASH_SALE: '/admin/flash-sales/:id',
  DELETE_ADMIN_FLASH_SALE: '/admin/flash-sales/:id',

  // 18 · Back Office: Delivery
  GET_ADMIN_SHIPPING_ZONES: '/admin/shipping-zones',
  CREATE_ADMIN_SHIPPING_ZONE: '/admin/shipping-zones',
  GET_ADMIN_SHIPPING_ZONE: '/admin/shipping-zones/:id',
  UPDATE_ADMIN_SHIPPING_ZONE: '/admin/shipping-zones/:id',
  DELETE_ADMIN_SHIPPING_ZONE: '/admin/shipping-zones/:id',

  // 19 · Back Office: Reviews
  GET_ADMIN_REVIEWS: '/admin/reviews',
  GET_ADMIN_REVIEW: '/admin/reviews/:id',
  APPROVE_ADMIN_REVIEW: '/admin/reviews/:id/approve',
  REJECT_ADMIN_REVIEW: '/admin/reviews/:id/reject',
  UPDATE_ADMIN_REVIEW: '/admin/reviews/:id',
  HIDE_ADMIN_REVIEW: '/admin/reviews/:id/hide',
  UNHIDE_ADMIN_REVIEW: '/admin/reviews/:id/hide',
  FEATURE_ADMIN_REVIEW: '/admin/reviews/:id/feature',
  UNFEATURE_ADMIN_REVIEW: '/admin/reviews/:id/feature',
  DELETE_ADMIN_REVIEW: '/admin/reviews/:id',

  // 20 · Back Office: Home Page & Banners
  GET_ADMIN_HOME_SECTIONS: '/admin/home-sections',
  GET_ADMIN_HOME_SECTION_TYPES: '/admin/home-sections/types',
  CREATE_ADMIN_HOME_SECTION: '/admin/home-sections',
  GET_ADMIN_HOME_SECTION: '/admin/home-sections/:id',
  UPDATE_ADMIN_HOME_SECTION: '/admin/home-sections/:id',
  REORDER_ADMIN_HOME_SECTIONS: '/admin/home-sections/reorder',
  DELETE_ADMIN_HOME_SECTION: '/admin/home-sections/:id',

  GET_ADMIN_BANNERS: '/admin/banners',
  CREATE_ADMIN_BANNER: '/admin/banners',
  UPDATE_ADMIN_BANNER: '/admin/banners/:id',
  DELETE_ADMIN_BANNER: '/admin/banners/:id',

  // 21 · Back Office: Pages, FAQs, Messages
  GET_ADMIN_PAGES: '/admin/pages',
  CREATE_ADMIN_PAGE: '/admin/pages',
  GET_ADMIN_PAGE: '/admin/pages/:id',
  UPDATE_ADMIN_PAGE: '/admin/pages/:id',
  DELETE_ADMIN_PAGE: '/admin/pages/:id',

  GET_ADMIN_FAQS: '/admin/faqs',
  CREATE_ADMIN_FAQ: '/admin/faqs',
  UPDATE_ADMIN_FAQ: '/admin/faqs/:id',
  DELETE_ADMIN_FAQ: '/admin/faqs/:id',

  GET_ADMIN_MESSAGES: '/admin/contact-messages',
  GET_ADMIN_MESSAGE: '/admin/contact-messages/:id',
  REPLY_ADMIN_MESSAGE: '/admin/contact-messages/:id/replied',
  DELETE_ADMIN_MESSAGE: '/admin/contact-messages/:id',

  // 22 · Back Office: Newsletter
  GET_ADMIN_NEWSLETTER_SUBSCRIBERS: '/admin/newsletter/subscribers',
  GET_ADMIN_NEWSLETTER_CAMPAIGNS: '/admin/newsletter/campaigns',
  CREATE_ADMIN_NEWSLETTER_CAMPAIGN: '/admin/newsletter/campaigns',
  GET_ADMIN_NEWSLETTER_CAMPAIGN: '/admin/newsletter/campaigns/:id',
  UPDATE_ADMIN_NEWSLETTER_CAMPAIGN: '/admin/newsletter/campaigns/:id',
  SEND_ADMIN_NEWSLETTER_CAMPAIGN: '/admin/newsletter/campaigns/:id/send',
  DELETE_ADMIN_NEWSLETTER_CAMPAIGN: '/admin/newsletter/campaigns/:id',

  // 23 · Back Office: Dashboard & Reports
  GET_ADMIN_DASHBOARD: '/admin/dashboard',
  GET_ADMIN_REPORTS: '/admin/reports',
  GET_ADMIN_REPORTS_SALES: '/admin/reports/sales',
  GET_ADMIN_REPORTS_PRODUCT: '/admin/reports/product',
  GET_ADMIN_REPORTS_INVENTORY: '/admin/reports/inventory',
  GET_ADMIN_REPORTS_CUSTOMER: '/admin/reports/customer',
  GET_ADMIN_REPORTS_ORDER: '/admin/reports/order',
  GET_ADMIN_REPORTS_COUPON: '/admin/reports/coupon',
  GET_ADMIN_REPORTS_TAX: '/admin/reports/tax',
  GET_ADMIN_REPORTS_REVENUE: '/admin/reports/revenue',
  GET_ADMIN_ACTIVITY_LOG: '/admin/activity-log',
  GET_ADMIN_RECORD_ACTIVITY_LOG: '/admin/activity-log/:type/:id',

  // 24 · Back Office: Roles & Staff
  GET_ADMIN_PERMISSIONS: '/permissions',
  GET_ADMIN_ROLES: '/roles',
  CREATE_ADMIN_ROLE: '/roles',
  GET_ADMIN_ROLE: '/roles/:id',
  UPDATE_ADMIN_ROLE: '/roles/:id',
  DELETE_ADMIN_ROLE: '/roles/:id',

  GET_ADMIN_STAFF: '/staff',
  CREATE_ADMIN_STAFF: '/staff',
  GET_ADMIN_MEMBER: '/staff/:id',
  UPDATE_ADMIN_MEMBER: '/staff/:id',
  DELETE_ADMIN_MEMBER: '/staff/:id',
} as const;

export type EndpointKey = keyof typeof ApiEndpoints;
export type TargetEndpoint = EndpointKey | (string & {});

export function resolveEndpoint(
  target: TargetEndpoint,
  pathParams?: Record<string, string | number>
): string {
  let path: string = (ApiEndpoints as any)[target] || target;

  if (pathParams) {
    Object.entries(pathParams).forEach(([param, value]) => {
      const regex = new RegExp(`:${param}\\b|{${param}}`, 'g');
      path = path.replace(regex, String(value));
    });
  }

  return path;
}
