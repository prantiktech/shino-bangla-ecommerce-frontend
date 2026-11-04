/** Labels and badge colours for order, payment and parcel states, shared by every back-office screen. */
import type { BadgeTone } from "./ui";
import type {
  BusinessApplicationStatus,
  CourierKey,
  IncompleteOrderStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentState,
} from "@/types/admin-orders";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "on_hold",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "blue" },
  processing: { label: "Processing", tone: "purple" },
  packed: { label: "Packed", tone: "purple" },
  on_hold: { label: "On hold", tone: "slate" },
  shipped: { label: "Shipped", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
  returned: { label: "Returned", tone: "red" },
  refunded: { label: "Refunded", tone: "slate" },
};

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "unpaid",
  "pending",
  "partially_paid",
  "paid",
  "failed",
  "partially_refunded",
  "refunded",
];

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  unpaid: { label: "Unpaid", tone: "amber" },
  pending: { label: "Awaiting payment", tone: "amber" },
  partially_paid: { label: "Partially paid", tone: "blue" },
  paid: { label: "Paid", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  partially_refunded: { label: "Partly refunded", tone: "purple" },
  refunded: { label: "Refunded", tone: "slate" },
};

export const INCOMPLETE_ORDER_STATUS_META: Record<IncompleteOrderStatus, { label: string; tone: BadgeTone }> = {
  incomplete: { label: "Incomplete", tone: "amber" },
  recovered: { label: "Recovered", tone: "green" },
  dismissed: { label: "Dismissed", tone: "slate" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
  sslcommerz: "Online (SSLCommerz)",
};

export const COURIERS: { key: CourierKey; label: string }[] = [
  { key: "steadfast", label: "Steadfast" },
  { key: "pathao", label: "Pathao Courier" },
  { key: "redx", label: "RedX" },
];

export const SHIPMENT_STATE_META: Record<ShipmentState, { label: string; tone: BadgeTone; hint: string }> = {
  booked: { label: "Booked", tone: "slate", hint: "Waiting for the courier to pick it up" },
  in_transit: { label: "On the way", tone: "blue", hint: "With the courier" },
  delivered: { label: "Delivered", tone: "green", hint: "Handed to the customer" },
  partly_delivered: { label: "Partly delivered", tone: "amber", hint: "Check what came back and the cash collected" },
  returned: { label: "Returned", tone: "red", hint: "Coming back to the shop" },
  cancelled: { label: "Cancelled by courier", tone: "red", hint: "Cancelled before pickup: needs attention" },
};

export const BUSINESS_STATUS_META: Record<BusinessApplicationStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "orange" },
  contacted: { label: "Contacted", tone: "blue" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

/** Look up a label/tone pair, falling back gracefully for values the API adds later. */
export function metaFor<K extends string>(
  table: Record<K, { label: string; tone: BadgeTone }>,
  key: string | null | undefined
): { label: string; tone: BadgeTone } {
  if (key && key in table) return table[key as K];
  const label = (key ?? "—").replace(/_/g, " ");
  return { label: label.charAt(0).toUpperCase() + label.slice(1), tone: "slate" };
}

/** "5 minutes ago"-style relative time for sync stamps. */
export function timeAgo(value: string | null | undefined): string {
  if (!value) return "never";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** Bangladeshi mobile number in the form the API accepts (01XXXXXXXXX). */
export function isBdMobile(value: string): boolean {
  return /^01[3-9]\d{8}$/.test(value.replace(/[\s-]/g, "").replace(/^\+?88/, ""));
}

/** Normalise "+880 1712-345678" to "01712345678"; leaves other text untouched. */
export function normaliseBdMobile(value: string): string {
  const digits = value.replace(/[\s-]/g, "");
  return digits.replace(/^\+?88(?=01)/, "");
}
