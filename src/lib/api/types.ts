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
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  product_slug: string;
  image: string | null;
  unit_price: number; // in poisha
  quantity: number;
  subtotal: number; // in poisha
  options?: Record<string, string>;
}

export interface ApiCart {
  token?: string;
  items: ApiCartItem[];
  item_count: number;
  subtotal: number; // in poisha
  discount_total: number; // in poisha
  vat_total: number; // in poisha
  shipping_total: number; // in poisha
  grand_total: number; // in poisha
  coupon: {
    code: string;
    discount_amount: number; // in poisha
  } | null;
}

// 6. Checkout & Orders
export interface ShippingLocation {
  id: number;
  name: string;
  parent_id?: number | null;
}

export interface ShippingMethod {
  id: number;
  name: string;
  rate: number; // in poisha
  estimated_days?: string;
}

export interface CheckoutPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  location_id?: number;
  shipping_method_id: number;
  payment_method: "cod" | "sslcommerz" | "bank_transfer";
  notes?: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number; // in poisha
  subtotal: number; // in poisha
}

export interface Order {
  id: number;
  order_number: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed";
  payment_method: string;
  items: OrderItem[];
  subtotal: number; // in poisha
  discount_total: number; // in poisha
  vat_total: number; // in poisha
  shipping_total: number; // in poisha
  grand_total: number; // in poisha
  shipping_address: Record<string, any>;
  created_at: string;
}

// 7. Store Public Settings
export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  cod_enabled: boolean;
  bank_transfer_enabled: boolean;
  bank_transfer_instructions: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}
