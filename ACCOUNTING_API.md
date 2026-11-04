# Accounting page: API guide for the frontend

This guide is for building the back office **Accounting** page. It covers what
the page shows, how every number is calculated, each endpoint with examples,
and how to turn the responses into cards, charts and tables.

`API.md` has the generated reference for the same endpoints: every field, rule
and a captured response. This guide explains how to use them together.

---

## Contents

1. [How the page fits together](#1-how-the-page-fits-together)
2. [The basics: auth, permissions, money, dates](#2-the-basics)
3. [The period: preset, from/to, basis](#3-the-period)
4. [What each figure means](#4-what-each-figure-means)
5. [Summary: the cards](#5-summary-the-cards)
6. [Timeline: the charts](#6-timeline-the-charts)
7. [Breakdown: by product, category, payment method...](#7-breakdown)
8. [Cash: collected, owed, refunded](#8-cash)
9. [Stock: bought and on the shelf](#9-stock)
10. [Profit and loss statement, and downloading it](#10-profit-and-loss)
11. [Expenses](#11-expenses)
12. [Expense categories](#12-expense-categories)
13. [Errors](#13-errors)
14. [Recipes: loading, formatting, arrows, warnings](#14-recipes)
15. [Things to know](#15-things-to-know)

---

## 1. How the page fits together

The page is made of independent parts, and **each part has its own endpoint**.
When the page opens, call them all at the same time. When the user changes a
filter on one part (for example the chart's grouping), reload only that part.

| Part of the page | Endpoint |
|---|---|
| Period picker (Today, This week, This month, This year, custom) | none: it sets the parameters for the others |
| Row of cards: sales, costs, profit, margins, averages | `GET /api/v1/admin/accounting/summary` |
| Main chart: revenue vs cost vs profit over time | `GET /api/v1/admin/accounting/timeline` |
| "Top products", "By category", "By payment method" pies and tables | `GET /api/v1/admin/accounting/breakdown` |
| Cash panel: collected, still owed, refunds | `GET /api/v1/admin/accounting/cash` |
| Stock panel: bought this period, value on the shelf | `GET /api/v1/admin/accounting/stock` |
| Profit & loss tab, with Excel / CSV / PDF download | `GET /api/v1/admin/accounting/profit-and-loss` |
| Expenses tab: list, add, edit, delete | `/api/v1/admin/accounting/expenses` |
| Expense categories (settings or a side panel) | `/api/v1/admin/accounting/expense-categories` |

A suggested layout:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Today] [This week] [This month] [This year] [Custom ▾]   Count: [Delivered ▾] │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬────────────┤
│ Revenue  │ Cost of  │ Gross    │ Expenses │ Net      │ Orders   │ Avg order  │
│ ৳1,41,000│ goods    │ profit   │ ৳35,000  │ profit   │ 2        │ ৳797.50    │
│ ▲ 252.5% │ ৳60,000  │ ৳81,000  │          │ ৳40,000  │          │            │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────────┤
│ ⚠ ৳50,000 of sales (35.7%) had no cost price - profit is overstated.         │
├───────────────────────────────────────────────────────────────────────────┤
│ Revenue / cost / profit chart                    [Day] [Week] [Month] [Year]│
├─────────────────────────────────┬─────────────────────────────────────────┤
│ Top products (table)            │ Sales by payment method (pie)           │
├─────────────────────────────────┼─────────────────────────────────────────┤
│ Cash: collected / owed          │ Stock: bought / on the shelf            │
├─────────────────────────────────┴─────────────────────────────────────────┤
│ Tabs:  [Profit & loss]  [Expenses]                                         │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The basics

**Base URL:** every path here starts with `/api/v1/admin/accounting`.

**Auth:** the usual staff bearer token: `Authorization: Bearer <token>` and
`Accept: application/json`.

**Permissions:** the page has its own permissions, shown as "Accounting" in
the role editor:

| Permission | Allows |
|---|---|
| `accounting.view` | Everything that reads: all the figures, the P&L, the expense list and the categories |
| `accounting.create` | Entering expenses, adding categories |
| `accounting.update` | Correcting expenses, renaming categories |
| `accounting.delete` | Deleting expenses and categories |

`dashboard.view` or `reports.view` is **not** enough: profit and cost figures
are for the people the owner chooses. The signed-in user's permissions are in
`GET /api/v1/me` → `data.permissions`. Use it to:
- hide the Accounting menu item without `accounting.view`
- hide the "Add expense" button without `accounting.create`
- hide edit buttons without `accounting.update`
- hide delete buttons without `accounting.delete`

The super admin has every permission.

**Money is in poisha**, as everywhere else in the API: `100` means ৳1.
`141000` is ৳1,410.00. Divide by 100 to show taka. When **sending** an expense
amount, multiply what the user typed by 100.

**Percentages** (`*_percent`) are ready to show, rounded to one decimal place:
`57.4` means 57.4%. They are `null` when there is nothing to divide by (for
example a margin with no revenue). Show "-" for `null`, never 0%.

**Dates** are `YYYY-MM-DD`, both in requests and in responses.

---

## 3. The period

Every figure endpoint (`summary`, `timeline`, `breakdown`, `cash`, `stock`,
`profit-and-loss`) takes the same three things.

### Which days: `preset`, or `from` and `to`

Use `preset` for the quick buttons; the server works out the dates, so the
buttons always agree with the server's calendar:

| `preset` | Covers |
|---|---|
| `today` | Today |
| `yesterday` | Yesterday |
| `this_week` | From the start of this week (Saturday) to today |
| `last_week` | The whole previous week, Saturday to Friday |
| `last_7_days` | Today and the 6 days before |
| `this_month` | The 1st of this month to today |
| `last_month` | The whole previous month |
| `last_30_days` | Today and the 29 days before |
| `this_year` | 1 January to today |
| `last_year` | The whole previous year |
| `all_time` | The day of the first order to today |

For a custom range, send `from` and `to` instead, for example
`?from=2026-10-01&to=2026-10-31`. Both ends are included. `preset` wins if
both are sent. With neither, the period is the **last 30 days**.

Every response echoes the period it used. Show it under the picker, so the user
can see what "this week" meant:

```json
"period": { "from": "2026-10-01", "to": "2026-10-31", "days": 31, "basis": "delivered", "preset": null }
```

### When an order counts as a sale: `basis`

| `basis` | An order counts... | Use it for |
|---|---|---|
| `delivered` **(default)** | on the day it was **delivered** | Profit and accounting: with cash on delivery many parcels come back, and an order that never arrived earned nothing |
| `placed` | on the day it was **ordered** | The sales pipeline: what customers ordered, including what is still on its way |

Whichever is used, **cancelled, returned and refunded orders are never sales**.

Put a small "Count sales when: Delivered / Ordered" switch on the page, and
send its value as `basis` to every endpoint. The numbers differ: an order
placed on 30 October and delivered on 2 November is an October sale with
`placed` and a November sale with `delivered`.

Expenses always count on the day they were spent, whatever the basis.

---

## 4. What each figure means

The same definitions apply on every part of the page.

| Figure | Means |
|---|---|
| **Gross sales** | The goods at their selling price, before discounts. VAT is not included (prices in this shop exclude VAT) |
| **Discounts** | Coupon and other discounts given |
| **Net sales** | Gross sales − discounts |
| **Delivery income** | Delivery charges customers paid |
| **Refunds** | Money refunded on orders that still count as sales (partial refunds). A fully refunded order is not a sale at all, so it is left out rather than subtracted |
| **Revenue** | Net sales + delivery income − refunds. **The shop's income.** |
| **VAT collected** | VAT customers paid. It is owed to the government, so it is **never** part of revenue or profit |
| **Customers paid** | Everything customers were billed: revenue + VAT (+ refunds). For "average order value" |
| **Cost of goods** | What the items sold cost the shop: each product's cost price **at the moment it was sold** |
| **Gross profit** | Revenue − cost of goods |
| **Gross margin %** | Gross profit ÷ revenue |
| **Courier charges** | What couriers charged for the parcels they carried, when booked through the courier integration |
| **Expenses** | Everything entered under Expenses (rent, salaries, marketing...) for the period |
| **Operating costs** | Courier charges + expenses |
| **Net profit** | Gross profit − courier charges − expenses. **What the shop actually made.** |
| **Net margin %** | Net profit ÷ revenue |
| **Average order value** | Customers paid ÷ orders |
| **Average profit per order** | Gross profit ÷ orders |
| **Average net profit per order** | Net profit ÷ orders |
| **Items sold** | Units sold |

**Missing cost prices.** If a product had no cost price when it was sold, its
cost counts as 0, which makes profit look higher than it really is. Each
response that shows profit says how much of the period's sales this affects
(see [the warning recipe](#a-warning-when-cost-prices-are-missing)). The fix
is to fill in cost prices on products; orders placed after that are correct.

---

## 5. Summary: the cards

```
GET /api/v1/admin/accounting/summary?preset=this_month&basis=delivered
```

Takes only the [period](#3-the-period).

```json
{
  "data": {
    "period":          { "from": "2026-10-01", "to": "2026-10-31", "days": 31, "basis": "delivered", "preset": null },
    "previous_period": { "from": "2026-08-31", "to": "2026-09-30", "days": 31, "basis": "delivered", "preset": null },
    "figures": {
      "orders":                       { "value": 2,      "previous": 1,     "change": 1,      "change_percent": 100.0 },
      "items_sold":                   { "value": 3,      "previous": 1,     "change": 2,      "change_percent": 200.0 },
      "gross_sales":                  { "value": 150000, "previous": 40000, "change": 110000, "change_percent": 275.0 },
      "discounts":                    { "value": 10000,  "previous": 0,     "change": 10000,  "change_percent": null },
      "net_sales":                    { "value": 140000, "previous": 40000, "change": 100000, "change_percent": 250.0 },
      "delivery_income":              { "value": 6000,   "previous": 0,     "change": 6000,   "change_percent": null },
      "refunds":                      { "value": 5000,   "previous": 0,     "change": 5000,   "change_percent": null },
      "revenue":                      { "value": 141000, "previous": 40000, "change": 101000, "change_percent": 252.5 },
      "vat_collected":                { "value": 13500,  "previous": 0,     "change": 13500,  "change_percent": null },
      "customers_paid":               { "value": 159500, "previous": 40000, "change": 119500, "change_percent": 298.8 },
      "cost_of_goods":                { "value": 60000,  "previous": 20000, "change": 40000,  "change_percent": 200.0 },
      "gross_profit":                 { "value": 81000,  "previous": 20000, "change": 61000,  "change_percent": 305.0 },
      "gross_margin_percent":         { "value": 57.4,   "previous": 50,    "change": 7.4,    "change_percent": null },
      "courier_charges":              { "value": 6000,   "previous": 0,     "change": 6000,   "change_percent": null },
      "expenses":                     { "value": 35000,  "previous": 1000,  "change": 34000,  "change_percent": 3400.0 },
      "operating_costs":              { "value": 41000,  "previous": 1000,  "change": 40000,  "change_percent": 4000.0 },
      "net_profit":                   { "value": 40000,  "previous": 19000, "change": 21000,  "change_percent": 110.5 },
      "net_margin_percent":           { "value": 28.4,   "previous": 47.5,  "change": -19.1,  "change_percent": null },
      "average_order_value":          { "value": 79750,  "previous": 40000, "change": 39750,  "change_percent": 99.4 },
      "average_profit_per_order":     { "value": 40500,  "previous": 20000, "change": 20500,  "change_percent": 102.5 },
      "average_net_profit_per_order": { "value": 20000,  "previous": 19000, "change": 1000,   "change_percent": 5.3 }
    },
    "missing_costs": { "lines": 1, "sales": 50000, "share_percent": 35.7 }
  }
}
```

Every figure has four parts:

| Field | Means |
|---|---|
| `value` | This period |
| `previous` | The comparison period (`previous_period`) |
| `change` | `value − previous`, in the figure's own unit (poisha, orders, or percentage **points** for margins) |
| `change_percent` | The change as a percentage of `previous`. `null` when `previous` was 0 (no percentage of nothing), and always `null` for margins, whose change is already in points |

**What it is compared with:**

| Period | Compared with |
|---|---|
| `this_month` | The same days of last month (1–15 Nov vs 1–15 Oct) |
| `last_month` | The whole month before |
| `this_year`, `last_year` | The same days of the year before |
| Any other preset or custom range | The same number of days immediately before |
| `all_time` | Nothing: `previous_period` and every `previous` are `null` |

**Suggested cards:** Revenue, Cost of goods, Gross profit (with gross margin %
under it), Expenses, Net profit (with net margin %), Orders, Average order value.
A second row or a "More" toggle can show Gross sales, Discounts, Delivery
income, Refunds, VAT collected, Courier charges, Items sold and the per-order
averages.

---

## 6. Timeline: the charts

```
GET /api/v1/admin/accounting/timeline?preset=this_year&group=month
```

| Parameter | Values |
|---|---|
| the [period](#3-the-period) | as everywhere |
| `group` | `day`, `week`, `month` or `year`. Left out, it follows the length of the period: **days** up to 62 days, **weeks** up to 366 days, **months** beyond |

Limits, so a chart stays readable: `day` covers at most 366 days, `week` 3
years, `month` 10 years. Past that the answer is `422` with an error on `group`;
offer a longer grouping instead.

```json
{
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-31", "days": 31, "basis": "delivered", "preset": null },
    "group": "week",
    "points": [
      { "period": "2026-09-26", "label": "26 Sep - 2 Oct 2026", "from": "2026-10-01", "to": "2026-10-02",
        "orders": 0, "net_sales": 0, "revenue": 0, "cost_of_goods": 0, "gross_profit": 0,
        "courier_charges": 0, "expenses": 30000, "net_profit": -30000 },
      { "period": "2026-10-03", "label": "3 Oct - 9 Oct 2026", "from": "2026-10-03", "to": "2026-10-09",
        "orders": 1, "net_sales": 90000, "revenue": 96000, "cost_of_goods": 60000, "gross_profit": 36000,
        "courier_charges": 6000, "expenses": 0, "net_profit": 30000 }
    ],
    "totals": { "orders": 2, "net_sales": 140000, "revenue": 141000, "cost_of_goods": 60000,
                "gross_profit": 81000, "courier_charges": 6000, "expenses": 35000, "net_profit": 40000 }
  }
}
```

- **Every bucket is there, even an empty one** (all zeros), so lines do not
  jump across gaps. Draw the points in order.
- `period` is the bucket's start date and stays unique, so use it as the
  key. `label` is ready to put on the x-axis.
- `from` and `to` are the days the bucket actually covers. The first and last
  can be cut short by the period: in the example, the week of 26 Sep only
  counts 1–2 Oct.
- Weeks start on **Saturday**.
- `totals` adds up the points. It matches the summary for the same period.
- `net_profit` can be negative (a week with rent but no sales). Let the chart's
  y-axis go below zero.

**Chart suggestions:**
- **Line or area chart:** `revenue`, `cost_of_goods` and `net_profit` over
  time. The classic "are we making money" chart.
- **Grouped bar chart per bucket:** `revenue` against `cost_of_goods +
  courier_charges + expenses`.
- **Bar chart:** `orders` per bucket.
- **Buttons [Day] [Week] [Month] [Year]:** change `group` and reload only the
  chart.

---

## 7. Breakdown

```
GET /api/v1/admin/accounting/breakdown?preset=this_month&by=product&sort=profit&limit=10
```

| Parameter | Values |
|---|---|
| the [period](#3-the-period) | as everywhere |
| `by` **(required)** | `product`, `category`, `payment_method`, `source` (Cart / Buy Now), `district`, `expense_category` |
| `sort` | `sales` (default), `profit`, `cost`, `quantity`, `orders`. Largest first |
| `limit` | 1–100, default 10. Rows past the limit are added up in `others` |

### By product, category, payment method, source or district

```json
{
  "data": {
    "period": { "...": "..." },
    "by": "product",
    "measure": "goods_sales",
    "sort": "profit",
    "rows": [
      { "key": 12, "label": "Fire Blanket", "orders": 1, "quantity": 1, "sales": 50000, "cost": 0,
        "profit": 50000, "margin_percent": 100.0, "share_percent": 35.7 }
    ],
    "others": { "rows": 1, "quantity": 2, "sales": 90000, "cost": 60000, "profit": 30000,
                "margin_percent": 33.3, "share_percent": 64.3 },
    "totals": { "orders": 2, "quantity": 3, "sales": 140000, "cost": 60000, "profit": 80000 }
  }
}
```

| Field | Means |
|---|---|
| `key` | The product, category or district id; the payment method (`cod`, `bank_transfer`, `sslcommerz`); the source (`cart`, `buy_now`). Can be `null` (a product since deleted, an order with no district) |
| `label` | Ready to show |
| `sales`, `cost`, `profit` | See `measure`, below |
| `margin_percent` | Profit ÷ sales |
| `share_percent` | This row's sales ÷ all sales: the pie slice |
| `others` | Everything past `limit`, added up (`rows` says how many it stands for), or `null` when nothing is left over. Draw it as an "Others" slice, so the pie still adds up to 100% |
| `totals` | The whole period |

**`measure` says what `sales` means:**
- `goods_sales` (by `product` and `category`): the goods only, after
  discount and without VAT. Delivery charges belong to no product, so they
  are not here.
- `revenue` (by `payment_method`, `source`, `district`): the order's full
  revenue, delivery included and refunds taken off. These rows add up to the
  summary's revenue and gross profit.

`category` is the category the product is in **now**. Products without one are
"Uncategorised".

### By expense category

```
GET /api/v1/admin/accounting/breakdown?preset=this_month&by=expense_category
```

```json
{
  "data": {
    "by": "expense_category",
    "measure": "expenses",
    "rows": [
      { "key": 1, "label": "Rent", "count": 1, "amount": 30000, "share_percent": 85.7 },
      { "key": 3, "label": "Marketing", "count": 1, "amount": 5000, "share_percent": 14.3 }
    ],
    "others": null,
    "totals": { "count": 2, "amount": 35000 }
  }
}
```

`sort` does not apply here; rows are always largest amount first.

**Chart suggestions:**
- **Table** "Most profitable products" (`by=product&sort=profit`), with
  columns Product, Qty, Sales, Cost, Profit, Margin.
- **Pie or donut**: sales by payment method, by category, Cart vs Buy Now;
  expenses by category.
- **Horizontal bar chart**: sales by district (top 10).

---

## 8. Cash

```
GET /api/v1/admin/accounting/cash?preset=this_month
```

```json
{
  "data": {
    "period": { "...": "..." },
    "sales": {
      "billed": 159500,
      "collected": 159500,
      "due": 0,
      "by_payment_method": [
        { "method": "cod", "label": "Cash on delivery", "orders": 1, "billed": 109500, "collected": 109500, "due": 0 },
        { "method": "sslcommerz", "label": "Online payment", "orders": 1, "billed": 50000, "collected": 50000, "due": 0 }
      ]
    },
    "outstanding": {
      "not_shipped":  { "orders": 0, "due": 0 },
      "with_courier": { "orders": 1, "due": 20000 },
      "delivered":    { "orders": 0, "due": 0 },
      "total": 20000
    },
    "refunds_paid": { "count": 1, "amount": 5000 },
    "online_payments_received": { "count": 1, "amount": 50000 }
  }
}
```

| Part | Means |
|---|---|
| `sales` | For the period's sales: what customers were billed (VAT included), how much of it has been collected, and what is still due, per payment method. A partial payment counts as what was received so far |
| `outstanding` | **Right now, whatever the period**: money still owed on every order that is still going. `not_shipped`: pending to packed, and on hold. `with_courier`: shipped, the cash the rider should bring back. `delivered`: delivered but not marked paid, which needs chasing |
| `refunds_paid` | Refunds completed during the period |
| `online_payments_received` | Online (SSLCommerz) payments confirmed during the period |

**Suggestions:** a panel with "Collected ৳X of ৳Y (Z%)" as a progress bar, a
stacked bar for collected vs due per payment method, and three tiles for
outstanding. Make "Delivered but unpaid" stand out, since it is the money most
likely to be lost.

---

## 9. Stock

```
GET /api/v1/admin/accounting/stock?preset=this_month
```

```json
{
  "data": {
    "period": { "...": "..." },
    "purchases": { "entries": 1, "units": 4, "cost": 80000 },
    "on_hand": {
      "variants": 2,
      "units": 7,
      "cost_value": 50000,
      "retail_value": 124000,
      "potential_profit": 74000,
      "variants_without_cost": 1
    }
  }
}
```

| Part | Means |
|---|---|
| `purchases` | Stock received in the period (Inventory → Purchases): entries, units and what they cost |
| `on_hand` | **Right now**: what is on the shelf. `cost_value` is stock × cost price; `retail_value` is stock × the current selling price (the sale price when there is one); `potential_profit` is the difference |
| `variants_without_cost` | Variants in stock with no cost price, which count as costing 0 in `cost_value` |

Buying stock is **not** an expense in the profit figures. It becomes cost of
goods when the stock is sold. That is why it has its own panel and does not
appear in net profit.

---

## 10. Profit and loss

```
GET /api/v1/admin/accounting/profit-and-loss?preset=last_month
```

```json
{
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-31", "...": "..." },
    "previous_period": { "from": "2026-09-01", "to": "2026-09-30", "...": "..." },
    "lines": [
      { "key": "gross_sales",       "label": "Gross sales",                 "kind": "amount",    "amount": 150000, "previous": 40000 },
      { "key": "discounts",         "label": "Less: discounts",             "kind": "deduction", "amount": 10000,  "previous": 0 },
      { "key": "net_sales",         "label": "Net sales",                   "kind": "subtotal",  "amount": 140000, "previous": 40000 },
      { "key": "delivery_income",   "label": "Delivery charges collected",  "kind": "amount",    "amount": 6000,   "previous": 0 },
      { "key": "refunds",           "label": "Less: refunds",               "kind": "deduction", "amount": 5000,   "previous": 0 },
      { "key": "revenue",           "label": "Revenue",                     "kind": "subtotal",  "amount": 141000, "previous": 40000 },
      { "key": "cost_of_goods",     "label": "Less: cost of goods sold",    "kind": "deduction", "amount": 60000,  "previous": 20000 },
      { "key": "gross_profit",      "label": "Gross profit",                "kind": "subtotal",  "amount": 81000,  "previous": 20000 },
      { "key": "courier_charges",   "label": "Less: courier charges",       "kind": "deduction", "amount": 6000,   "previous": 0 },
      { "key": "expense:Marketing", "label": "Less: Marketing",             "kind": "deduction", "amount": 5000,   "previous": 0 },
      { "key": "expense:Rent",      "label": "Less: Rent",                  "kind": "deduction", "amount": 30000,  "previous": 1000 },
      { "key": "operating_costs",   "label": "Total operating costs",       "kind": "subtotal",  "amount": 41000,  "previous": 1000 },
      { "key": "net_profit",        "label": "Net profit",                  "kind": "total",     "amount": 40000,  "previous": 19000 },
      { "key": "vat_collected",     "label": "VAT collected (owed to the government, not income)", "kind": "memo", "amount": 13500, "previous": 0 }
    ],
    "gross_margin_percent": 57.4,
    "net_margin_percent": 28.4,
    "missing_costs": { "lines": 1, "sales": 50000 }
  }
}
```

Render the lines **in the order given**, as a two- or three-column statement
(Line, This period, Previous period). `kind` says how to style each:

| `kind` | Style |
|---|---|
| `amount` | Normal |
| `deduction` | Indented; the amount is positive, the label says "Less:". Show it as `(৳100.00)` or `−৳100.00` |
| `subtotal` | Bold, with a line above |
| `total` | Bold and larger, double line above. Net profit can be negative: show it in red |
| `memo` | Grey, set apart below the statement: it is information, not part of the sum |

There is one `expense:<category>` line per category that had spending in
either period. `previous` is `null` for `all_time`; hide that column then.

### Downloading it

Add `format`: `xlsx`, `csv` or `pdf`. The file comes back in the response
itself, with no queue:

```
GET /api/v1/admin/accounting/profit-and-loss?preset=last_month&format=xlsx
→ 200, Content-Disposition: attachment; filename=profit-and-loss-2026-10-01-to-2026-10-31.xlsx
```

**Amounts in the file are in taka, not poisha**, because a person opens it.

The request needs the bearer token, so a plain `<a href>` will not work.
Fetch it and save the blob:

```ts
async function downloadProfitAndLoss(params: URLSearchParams, format: 'xlsx' | 'csv' | 'pdf') {
  params.set('format', format);
  const response = await fetch(`${API}/api/v1/admin/accounting/profit-and-loss?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await response.json();

  const name = /filename="?([^"]+)"?/.exec(response.headers.get('Content-Disposition') ?? '')?.[1]
    ?? `profit-and-loss.${format}`;
  const url = URL.createObjectURL(await response.blob());
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}
```

If the frontend runs on another domain, `Content-Disposition` must be exposed
by CORS to be readable. When it is not, the fallback name above is used.

---

## 11. Expenses

Expenses are what the shop spends that is not stock: rent, salaries, marketing,
packaging, utilities. They are what turns gross profit into net profit.

> **Do not enter courier charges for parcels booked through a courier.** They
> are already counted from the booking, and entering them again would count
> them twice. Courier costs for parcels sent some other way are fine to enter
> (for example under "Transport").

### The fields

| Field | Required | Rules |
|---|---|---|
| `expense_category_id` | Yes | One of the categories (not a deleted one) |
| `amount` | Yes | Integer **poisha**, at least 1. ৳25,000 is `2500000` |
| `spent_on` | Yes | `YYYY-MM-DD`, today or earlier. The day the money went out; this is the day it counts in the figures |
| `description` | Yes | Up to 255 characters: what it was ("Shop rent, November") |
| `paid_via` | No | Up to 50 characters, free text: "Cash", "bKash", "Bank transfer" |
| `reference` | No | Up to 100 characters: a bill, receipt or cheque number |
| `note` | No | Up to 2000 characters |

### List: `GET /expenses`

```
GET /api/v1/admin/accounting/expenses?from=2026-10-01&to=2026-10-31&category_id=1&q=rent&page=1&per_page=25
```

All filters are optional:
- `from` and `to` are on `spent_on`.
- `category_id` picks one category.
- `q` searches the description, reference and note.

The list is newest first, paginated like every list (`per_page` 1–100, default
25).

```json
{
  "data": [
    {
      "id": 7,
      "category": { "id": 1, "name": "Rent", "deleted": false },
      "amount": 2500000,
      "spent_on": "2026-10-31",
      "description": "Shop rent, November",
      "paid_via": "Bank transfer",
      "reference": "RENT-11",
      "note": null,
      "recorded_by": { "id": 1, "name": "Owner" },
      "created_at": "2026-11-01T10:00:00.000000Z",
      "updated_at": "2026-11-01T10:00:00.000000Z"
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "last_page": 1, "per_page": 25, "total": 1, "total_amount": 2500000 }
}
```

`meta.total_amount` adds up **everything the filters match**, not just this
page. Show it as "Total: ৳25,000.00" above or below the table.

### One: `GET /expenses/{id}`

The same object, under `data`.

### Enter one: `POST /expenses` (needs `accounting.create`)

```json
POST /api/v1/admin/accounting/expenses
{
  "expense_category_id": 1,
  "amount": 2500000,
  "spent_on": "2026-10-31",
  "description": "Shop rent, November",
  "paid_via": "Bank transfer",
  "reference": "RENT-11"
}
```

The answer is `201` with the expense. `recorded_by` is whoever's token made
the request.

### Correct one: `PUT /expenses/{id}` (needs `accounting.update`)

Send only what changed; the rules are the same as when entering one.

```json
PUT /api/v1/admin/accounting/expenses/7
{ "amount": 2600000 }
```

### Delete one: `DELETE /expenses/{id}` (needs `accounting.delete`)

The answer is `204`. The expense disappears from the list and from every
figure. It is kept in the database (deletes are soft), and the deletion is in
the activity log. Ask "Delete this expense?" before sending.

Entering, correcting and deleting are all recorded in the activity log, with
before and after values. They are under `GET /api/v1/admin/activity-log/expense/{id}`.

### After a change

The figures are not cached. After adding, editing or deleting an expense,
reload `summary`, `timeline`, the `expense_category` breakdown and
`profit-and-loss`, and the new numbers show at once.

---

## 12. Expense categories

The shop starts with seven: **Rent, Salaries, Marketing, Packaging, Utilities,
Transport, Other**. The owner can rename them and add more.

### List: `GET /expense-categories`

Alphabetical, paginated (`per_page` up to 100, so one request fills a
dropdown). `q` searches the name.

```json
{
  "data": [
    { "id": 3, "name": "Marketing", "description": null, "expenses_count": 4, "expenses_total": 1250000,
      "created_at": "...", "updated_at": "..." }
  ],
  "links": { "...": "..." },
  "meta": { "total": 7, "...": "..." }
}
```

`expenses_count` and `expenses_total` (poisha) are for all time.

### Add one: `POST /expense-categories` (needs `accounting.create`)

```json
{ "name": "Internet", "description": "Broadband and mobile bills" }
```

`name` is required, at most 64 characters, and must be unique among the
categories that exist. `description` is optional, at most 255 characters.
The answer is `201`.

### Rename one: `PUT /expense-categories/{id}` (needs `accounting.update`)

```json
{ "name": "Internet & phone" }
```

Expenses already entered under it show the new name.

### Delete one: `DELETE /expense-categories/{id}` (needs `accounting.delete`)

The answer is `204`. The category leaves the list and can no longer be chosen
for new expenses. **Expenses already under it are not touched**: they keep
counting, and they show the category with `"deleted": true`. Show it as
"Rent (deleted)". Its name becomes free to use again.

---

## 13. Errors

Errors have the API's usual shape:

```json
{
  "message": "The amount must be more than zero. It is in poisha: ৳1 is 100.",
  "code": "VALIDATION_FAILED",
  "request_id": "6f0c...",
  "errors": { "amount": ["The amount must be more than zero. It is in poisha: ৳1 is 100."] }
}
```

| Status | `code` | When | What to do |
|---|---|---|---|
| `401` | `UNAUTHENTICATED` | Token missing or expired | Send to sign-in |
| `403` | `FORBIDDEN` | The user lacks the permission | Hide what they cannot use (see [permissions](#2-the-basics)) |
| `404` | `NOT_FOUND` | An expense or category that does not exist or was deleted | Reload the list |
| `422` | `VALIDATION_FAILED` | A bad parameter or field. `errors` is keyed by field | Show each message under its field |
| `429` | `TOO_MANY_REQUESTS` | Too many requests | Wait and retry |

The 422s you are most likely to meet:

| Field | Message (shortened) |
|---|---|
| `from` | The start of the period must not be after its end |
| `group` | That is too long a period to show by day... choose a longer grouping |
| `by` | Required on `breakdown` |
| `spent_on` | ...the date cannot be in the future |
| `expense_category_id` | Choose one of the expense categories |
| `name` (category) | Already taken |

---

## 14. Recipes

### Loading the page

```ts
const params = new URLSearchParams({ preset: 'this_month', basis: 'delivered' });

const get = (path: string, extra: Record<string, string> = {}) =>
  api.get(`/api/v1/admin/accounting/${path}?${new URLSearchParams({ ...Object.fromEntries(params), ...extra })}`);

const [summary, timeline, products, payments, cash, stock] = await Promise.all([
  get('summary'),
  get('timeline'),                                   // grouping chosen by the server
  get('breakdown', { by: 'product', sort: 'profit', limit: '10' }),
  get('breakdown', { by: 'payment_method' }),
  get('cash'),
  get('stock'),
]);
```

Load the P&L and expenses tabs when they are opened, not up front.

### Showing money

```ts
const taka = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 });
const money = (poisha: number) => taka.format(poisha / 100);   // money(141000) → "BDT 1,410.00"

// If you want the ৳ sign and lakh grouping (1,41,000.00):
const bdt = (poisha: number) =>
  '৳' + (poisha / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
```

When **sending** an expense: `amount: Math.round(Number(input) * 100)`.

### The comparison arrows

```ts
type Figure = { value: number | null; previous: number | null; change: number | null; change_percent: number | null };

// For costs, going up is bad.
const COSTS = new Set(['discounts', 'refunds', 'cost_of_goods', 'courier_charges', 'expenses', 'operating_costs']);

function trend(key: string, f: Figure) {
  if (f.previous === null || f.change === null) return null;          // all_time: no arrow
  const up = f.change > 0;
  const good = f.change === 0 ? null : COSTS.has(key) ? !up : up;

  const text = key.endsWith('_percent')
    ? `${up ? '+' : ''}${f.change.toFixed(1)} pts`                    // margins: points
    : f.change_percent === null
      ? 'new'                                                         // previous was 0
      : `${up ? '+' : ''}${f.change_percent.toFixed(1)}%`;

  return { arrow: f.change === 0 ? '→' : up ? '▲' : '▼', colour: good === null ? 'grey' : good ? 'green' : 'red', text };
}
```

Use a tooltip such as "vs 1 Oct – 15 Oct 2026", built from
`previous_period.from` and `previous_period.to`.

### A warning when cost prices are missing

```ts
const missing = summary.data.missing_costs;   // { lines, sales, share_percent }
if (missing.lines > 0) {
  showWarning(`${bdt(missing.sales)} of sales (${missing.share_percent ?? 0}%) had no cost price, ` +
              `so profit is shown higher than it really is. Add cost prices to your products.`);
}
```

The stock panel's `on_hand.variants_without_cost` can point to the same fix:
"N products in stock have no cost price".

### Mapping to a chart library

The timeline drops straight into Recharts, Chart.js or ApexCharts:

```ts
// Recharts
<LineChart data={timeline.data.points}>
  <XAxis dataKey="label" />
  <YAxis tickFormatter={(v) => bdt(v)} />
  <Line dataKey="revenue" name="Revenue" />
  <Line dataKey="cost_of_goods" name="Cost of goods" />
  <Line dataKey="net_profit" name="Net profit" />
</LineChart>

// Chart.js
const labels = points.map((p) => p.label);
const datasets = ['revenue', 'cost_of_goods', 'net_profit'].map((key) => ({
  label: key, data: points.map((p) => p[key] / 100),
}));
```

A pie from a breakdown, with the "Others" slice:

```ts
const slices = breakdown.data.rows.map((r) => ({ name: r.label, value: r.sales }));
if (breakdown.data.others) slices.push({ name: `Others (${breakdown.data.others.rows})`, value: breakdown.data.others.sales });
// For by=expense_category use r.amount / others.amount instead of sales.
```

---

## 15. Things to know

- **Days follow the server's clock, which is UTC.** Bangladesh is 6 hours
  ahead, so an order at 3 AM Dhaka time counts on the previous day. This
  matches the dashboard and the reports. If the owner wants days to follow
  Dhaka time, that is a server setting to change everywhere at once, not just
  on this page.
- **Profit is only as good as the cost prices.** See [missing cost
  prices](#4-what-each-figure-means).
- **Courier charges appear only for parcels booked through the courier
  integration**, and only once the courier has reported its charge.
- **Changing a price or a cost today does not change past figures.** Every
  order keeps the price, discount, VAT and cost it was sold with.
- **VAT is shown but never counted as income.**
- **Stock purchases are not expenses.** They become cost of goods when sold.
- **Nothing is cached.** Figures are worked out on every request, so they are
  always current, including straight after an expense is entered.
