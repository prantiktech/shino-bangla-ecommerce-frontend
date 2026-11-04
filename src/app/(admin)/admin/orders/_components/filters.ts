/** Order list filters and date range preset helpers. */
import type { OrderStatus } from "@/types/admin-orders";

export type OrderDatePreset =
  | ""
  | "today"
  | "yesterday"
  | "1_week"
  | "2_weeks"
  | "1_month"
  | "custom";

export interface OrderFilters {
  status: OrderStatus | "";
  q: string;
  product: string;
  payment_status: string;
  payment_method: string;
  courier: string;
  source: string;
  preset: OrderDatePreset;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: OrderFilters = {
  status: "",
  q: "",
  product: "",
  payment_status: "",
  payment_method: "",
  courier: "",
  source: "",
  preset: "",
  from: "",
  to: "",
};

export const ORDER_DATE_PRESETS: { value: OrderDatePreset; label: string }[] = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today's Orders" },
  { value: "yesterday", label: "Yesterday" },
  { value: "1_week", label: "1 Week" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
];

function formatYmd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function resolveOrderDateRange(preset: OrderDatePreset): {
  from: string;
  to: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today": {
      const ymd = formatYmd(today);
      return { from: ymd, to: ymd };
    }
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const ymd = formatYmd(y);
      return { from: ymd, to: ymd };
    }
    case "1_week": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { from: formatYmd(start), to: formatYmd(today) };
    }
    case "2_weeks": {
      const start = new Date(today);
      start.setDate(start.getDate() - 13);
      return { from: formatYmd(start), to: formatYmd(today) };
    }
    case "1_month": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { from: formatYmd(start), to: formatYmd(today) };
    }
    default:
      return { from: "", to: "" };
  }
}
