/**
 * Complete API Type Definitions for Storefront Customer Facing Endpoints
 */

// 1. Generic Response Envelopes
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  request_id?: string;
  errors?: Record<string, string[]>;
}

// 2. Auth & User
export interface User {
  id: number;
  name: string;
  email: string | null;
  email_verified: boolean;
  email_verified_at?: string | null;
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  has_password: boolean;
  google_linked?: boolean;
  is_active: boolean;
  is_staff: boolean;
  roles: string[];
  permissions: string[];
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthToken {
  token: string;
  token_type: string;
  expires_at: string;
  abilities: string[];
}

export interface LoginResponseData {
  token: AuthToken;
  user: User;
}

// 3. Categories & Brands
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  product_count: number;
  vat_rate?: number; // basis points (1500 = 15%)
  children?: ApiCategory[];
}

export interface ApiBrand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  product_count?: number;
}

// 4. Products & Pricing (Prices in Poisha: 100 poisha = ৳1.00)
export interface ApiProductPrice {
  min: number; // in integer poisha
  max: number; // in integer poisha
  compare_at: number | null; // in integer poisha
  discount_percent: number | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  image: string | null;
  gallery?: string[];
  brand: { id: number; name: string; slug: string } | null;
  category?: { id: number; name: string; slug: string } | null;
  price: ApiProductPrice;
  has_options: boolean;
  in_stock: boolean;
  rating: {
    average: number;
    count: number;
  };
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  description?: string;
  short_description?: string;
  specifications?: Record<string, string>;
  options?: {
    id: number;
    name: string;
    values: { id: number; name: string; price_adjustment?: number }[];
  }[];
}

// Product query parameters filter
export interface ProductFilterParams {
  category?: string;
  brand?: string;
  price_min?: number; // in poisha
  price_max?: number; // in poisha
  rating_min?: number;
  in_stock?: 0 | 1;
  flag?: "featured" | "trending" | "new_arrival" | "best_seller" | "on_sale";
  sort?: "newest" | "relevance" | "price_asc" | "price_desc" | "popular" | "best_selling" | "rating" | "name";
  q?: string;
  page?: number;
  per_page?: number;
}

// 5. Cart
export interface ApiCartItem {
  id: number;
  product_id?: number;
  variant_id?: number | null;
  product?: {
    id: number;
    name: string;
    slug: string;
    thumbnail_url?: string | null;
    image?: string | null;
  };
  product_name?: string;
  product_slug?: string;
  image?: string | null;
  sku?: string;
  label?: string | null;
  unit_price: number; // in poisha
  quantity: number;
  subtotal?: number; // in poisha
  line_subtotal?: number; // in poisha
  line_total?: number; // in poisha
  is_saved_for_later?: boolean;
  saved_for_later?: boolean;
  options?: Record<string, string>;
}

export interface ApiCartTotals {
  subtotal: number; // in poisha
  discount?: number; // in poisha
  discount_total?: number;
  shipping?: number; // in poisha
  shipping_total?: number;
  vat?: number;
  vat_total?: number;
  tax?: number;
  total?: number; // in poisha
  grand_total?: number; // in poisha
}

export interface ApiCart {
  id?: number | null;
  token?: string | null;
  items: ApiCartItem[];
  saved_for_later?: ApiCartItem[];
  item_count?: number;
  totals?: ApiCartTotals;
  subtotal?: number; // in poisha
  discount_total?: number; // in poisha
  vat_total?: number; // in poisha
  shipping_total?: number; // in poisha
  grand_total?: number; // in poisha
  coupon?: {
    code: string;
    discount?: number; // in poisha
    discount_amount?: number; // in poisha
  } | null;
  shipping?: {
    zone_id?: number;
    zone_name?: string;
    charge?: number;
    free_applied?: boolean;
    delivery_days_min?: number;
    delivery_days_max?: number;
  } | null;
}

// 6. Checkout & Orders
export interface ShippingLocation {
  id: number;
  name: string;
  parent_id?: number | null;
  division_id?: number;
  zone_id?: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
  rate: number; // in poisha
  estimated_days?: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
}

export interface CheckoutPayload {
  address_id?: number;
  billing_address_id?: number | null;
  address?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    area?: string | null;
    district_id: number;
    postcode?: string | null;
  };
  billing_address?: any;
  payment_method: "cod" | "sslcommerz" | "bank_transfer";
  note?: string;
}

export interface OrderItem {
  id: number;
  product_id?: number;
  variant_id?: number;
  product_name?: string;
  name?: string;
  label?: string | null;
  sku?: string;
  quantity: number;
  unit_price: number; // in poisha
  subtotal?: number; // in poisha
  line_total?: number; // in poisha
}

export interface Order {
  id?: number;
  number?: string;
  order_number?: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" | string;
  payment_status: "pending" | "unpaid" | "paid" | "failed" | string;
  payment_method: string;
  payment_method_label?: string;
  source?: string;
  contact?: {
    name: string;
    phone: string;
    email?: string | null;
  };
  items?: OrderItem[];
  preview?: Array<{
    name: string;
    label?: string | null;
    image?: string | null;
    quantity: number;
  }>;
  subtotal?: number; // in poisha
  discount_total?: number; // in poisha
  vat_total?: number; // in poisha
  shipping_total?: number; // in poisha
  grand_total?: number; // in poisha
  total_amount?: number; // in poisha
  totals?: ApiCartTotals;
  shipping_address?: Record<string, any>;
  billing_address?: Record<string, any>;
  can_cancel?: boolean;
  placed_at?: string;
  created_at?: string;
}

// 7. Store Public Settings
export interface StoreSettings {
  store_name: string;
  store_email?: string;
  store_phone: string;
  store_address?: string;
  default_vat_rate_bp?: number;
  vat_on_shipping?: boolean;
  cod_enabled: boolean;
  bank_transfer_enabled: boolean;
  bank_transfer_instructions?: string | null;
  low_stock_threshold?: number;
  order_payment_timeout_minutes?: number;
  logo_url?: string | null;
  favicon_url?: string | null;
}
