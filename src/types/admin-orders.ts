/**
 * Back-office order, shipment and courier shapes, as returned by the API (see api.md and COURIERS.md).
 * Money is integer poisha; weights are grams unless the field name says otherwise.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "on_hold"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "partially_paid"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

export type PaymentMethod = "cod" | "bank_transfer" | "sslcommerz";

export type OrderSource = "cart" | "buy_now";

export type CourierKey = "steadfast" | "pathao" | "redx";

/** The shop's own word for where a parcel is. */
export type ShipmentState = "booked" | "in_transit" | "delivered" | "partly_delivered" | "returned" | "cancelled";

export interface Shipment {
  id: number;
  courier: CourierKey;
  courier_label: string;
  is_sandbox: boolean;
  consignment_id: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  state: ShipmentState;
  /** The courier's own status word, e.g. `Assigned_for_Delivery`. */
  courier_status: string | null;
  cod_amount: number;
  weight_grams: number | null;
  /** Poisha; null until the courier reports it. */
  delivery_charge: number | null;
  delivery_area: { city_id?: number; zone_id?: number; area_id?: number } | null;
  note: string | null;
  booked_by: { id: number; name: string } | null;
  synced_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  area: string | null;
  district: string | null;
  division: string | null;
  postcode: string | null;
  district_id: number | null;
  division_id: number | null;
}

export interface AdminOrderRow {
  id: number;
  number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  source: OrderSource;
  customer: { id: number | null; is_guest: boolean; name: string; phone: string };
  district: string | null;
  item_count: number;
  grand_total: number;
  amount_paid?: number;
  amount_due?: number;
  shipment: Shipment | null;
  placed_at: string;
}

export interface AdminOrderItem {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  name: string;
  label: string | null;
  sku: string | null;
  image: string | null;
  quantity: number;
  unit_price: number;
  unit_cost?: number | null;
  price_source?: string;
  discount: number;
  vat_rate_bp?: number;
  vat: number;
  line_total: number;
}

export interface AdminOrderPayment {
  id?: number;
  method?: string;
  status?: string;
  amount?: number;
  reference?: string | null;
  note?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export interface AdminOrderDetail {
  id: number;
  number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_method_label: string;
  source: OrderSource;
  customer: {
    id: number | null;
    is_guest: boolean;
    name: string;
    phone: string;
    email: string | null;
    account_type?: string;
    group?: string;
  };
  shipping_address: OrderAddress | null;
  billing_address: OrderAddress | null;
  delivery: { zone_id: number | null; zone: string | null; days_min: number | null; days_max: number | null; weight_grams: number | null } | null;
  items: AdminOrderItem[];
  totals: {
    subtotal: number;
    discount: number;
    vat: number;
    shipping: number;
    shipping_vat?: number;
    grand_total: number;
    amount_paid?: number;
    amount_due?: number;
    cost?: number;
  };
  coupon_code: string | null;
  currency: string;
  customer_note: string | null;
  payments: AdminOrderPayment[];
  shipment: Shipment | null;
  allowed_transitions: { status: OrderStatus; permission: string }[];
  payment_expires_at: string | null;
  stock_released_at: string | null;
  ip_address: string | null;
  customer_ip: string | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  history: { from: OrderStatus | null; to: OrderStatus; note: string | null; by: string | null; at: string }[];
}

export interface OrdersSummary {
  range: { from: string | null; to: string | null };
  total_orders: number;
  by_status: Partial<Record<OrderStatus, number>>;
  by_payment_status: Partial<Record<PaymentStatus, number>>;
  sales: { orders: number; amount: number; average: number };
}

/* ------------------------------------------------------------------ */
/* Couriers                                                           */
/* ------------------------------------------------------------------ */

export interface CourierCredential {
  key: string;
  label: string;
  is_secret: boolean;
  is_set: boolean;
  /** Masked (`••••3f9a`) for secrets, in full for plain values. */
  preview: string | null;
}

export interface CourierOption {
  key: string;
  label: string;
  is_required: boolean;
  value: number | string | null;
}

export interface CourierAccount {
  courier: CourierKey;
  label: string;
  is_enabled: boolean;
  is_sandbox: boolean;
  supports_sandbox: boolean;
  is_configured: boolean;
  credentials: CourierCredential[];
  options: CourierOption[];
  webhook: { url: string; secret: string } | null;
  updated_at: string | null;
}

export interface CourierUpdatePayload {
  is_enabled?: boolean;
  is_sandbox?: boolean;
  /** Write-only: send only keys the owner typed; missing or empty keeps the saved one. */
  credentials?: Record<string, string>;
  options?: Record<string, number | string | null>;
}

export interface CourierStore {
  id: number;
  name: string;
  address?: string | null;
}

export type CourierAreaField = "city_id" | "zone_id" | "area_id";

export interface AvailableCourier {
  courier: CourierKey;
  label: string;
  is_sandbox: boolean;
  area_fields: CourierAreaField[];
}

export interface CourierArea {
  id: number;
  name: string;
  post_code?: string | null;
  district?: string | null;
}

export interface ShipmentBookingPayload {
  courier: CourierKey;
  city_id?: number;
  zone_id?: number;
  area_id?: number;
  weight_kg?: number;
  /** Poisha. */
  cod_amount?: number;
  note?: string;
}

export interface ShipmentScanPayload extends Partial<ShipmentBookingPayload> {
  number: string;
}

export type ShipmentScanResult =
  | { result: "shipped"; order: AdminOrderDetail }
  | { result: "needs_area"; missing: CourierAreaField[]; order: AdminOrderDetail };

/* ------------------------------------------------------------------ */
/* Fraud protection                                                   */
/* ------------------------------------------------------------------ */

export type ContactRuleType = "phone" | "ip";
export type ContactRuleKind = "blocked" | "trusted";

export interface ContactRule {
  id: number;
  type: ContactRuleType;
  value: string;
  rule: ContactRuleKind;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

/** One courier's parcels for a number, as the fraud-check provider counts them. */
export interface FraudProviderCourier {
  name: string;
  total: number;
  delivered: number;
  returned: number;
}

export interface FraudCheckResult {
  phone: string;
  rule: ContactRule | { rule: ContactRuleKind; reason?: string | null } | null;
  shop: {
    orders: number;
    delivered: number;
    returned: number;
    cancelled: number;
    in_progress: number;
    finished: number;
    /** Percent (0–100), null until an order has finished. */
    success_rate: number | null;
  };
  checkout: {
    courier_protection: boolean;
    min_success_rate: number;
    min_parcels: number;
    would_block: boolean;
  };
  provider: {
    connected: boolean;
    checked: boolean;
    /** The rest is present once the provider has answered (`checked: true`). */
    name?: string;
    checked_at?: string;
    total?: number;
    delivered?: number;
    returned?: number;
    /** Percent (0–100), null when the number has no parcels. */
    success_rate?: number | null;
    /** The provider's own wording ("Low Risk"); not every provider sends one. */
    risk?: string | null;
    couriers?: FraudProviderCourier[];
  };
  order?: { id: number; number: string; ip_address: string | null; customer_ip: string | null };
}

export interface FraudProviderCredential extends CourierCredential {
  default?: string | null;
}

export interface FraudProvider {
  provider: string;
  label: string;
  is_enabled: boolean;
  is_configured: boolean;
  credentials: FraudProviderCredential[];
  updated_at: string | null;
}

/* ------------------------------------------------------------------ */
/* Business (wholesale) applications                                  */
/* ------------------------------------------------------------------ */

export type BusinessApplicationStatus = "new" | "contacted" | "approved" | "rejected";

export interface BusinessApplicationDocument {
  id: number;
  type: string;
  label: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
}

export interface BusinessApplication {
  id: number;
  status: BusinessApplicationStatus;
  business: {
    name: string;
    type: string;
    type_label: string;
    trade_license_number: string;
    bin_tin: string | null;
    address: string;
    district_id: number | null;
    district: string | null;
    interested_in: string | null;
  };
  contact: {
    name: string;
    designation: string | null;
    phone: string;
    email: string | null;
    alternate_phone: string | null;
  };
  message: string | null;
  documents_count?: number;
  documents?: BusinessApplicationDocument[];
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  customer_id: number | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Incomplete orders (abandoned carts & buy-now drafts)               */
/* ------------------------------------------------------------------ */

export type IncompleteOrderStatus = "incomplete" | "recovered" | "dismissed";

export interface IncompleteOrderItem {
  variant_id: number;
  product_id: number | null;
  name: string;
  label: string | null;
  sku: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface IncompleteOrder {
  id: number;
  source: OrderSource;
  status: IncompleteOrderStatus;
  contact: {
    name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  items: IncompleteOrderItem[];
  item_count: number;
  subtotal: number;
  note: string | null;
  staff_note: string | null;
  recovered_order: {
    id: number;
    number: string;
  } | null;
  last_activity_at: string;
  created_at: string;
}
