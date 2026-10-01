# Architecture Audit & Implementation Progress

## 1. Overview & Strategy Alignment

Following the architecture audit of `/home/dtid/Projects/pharmacy` and the API specification in [`api_documation.md`](file:///home/dtid/fronted/api_documation.md), the codebase has been structured with:
- Dedicated Route Groups: `(user)` storefront and `(admin)` back office management.
- Pure Server-Side Calling (`serverGet`, `serverPost`, `serverPut`, `serverDelete`) using Next.js 16 `"use server"` Server Actions.
- Production-grade Axios-like HTTP Fetch Client in [`src/lib/api-client/`](file:///home/dtid/fronted/src/lib/api-client/).
- Central Type-Safe Endpoints Registry across all modules.
- Dynamic JWT Bearer token and guest `X-Cart-Token` interceptors.
- Live integer poisha money formatting (৳1.00 = 100 poisha).
- **Zero mock data**: all mock catalogs removed and replaced with live endpoints from `http://13.140.181.253/api/v1`.

---

## 2. Architecture & Directory Structure

```
src/
├── app/
│   ├── (admin)/
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── categories.ts
│   │   │   ├── customers.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── orders.ts
│   │   │   └── products.ts
│   │   ├── admin/
│   │   │   ├── categories/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── Sidebar.tsx
│   │   └── layout.tsx
│   ├── (user)/
│   │   ├── (private)/
│   │   │   └── account/page.tsx
│   │   ├── (public)/
│   │   │   ├── blogs/page.tsx
│   │   │   ├── brand/[slug]/page.tsx
│   │   │   ├── brands/page.tsx
│   │   │   ├── category/[slug]/page.tsx
│   │   │   ├── category/[slug]/[subSlug]/page.tsx
│   │   │   ├── deals/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── _components/products-view.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── track-order/page.tsx
│   │   │   └── page.tsx
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── brands.ts
│   │   │   ├── cart.ts
│   │   │   ├── categories.ts
│   │   │   ├── orders.ts
│   │   │   ├── products.ts
│   │   │   └── settings.ts
│   │   └── layout.tsx
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── api-client/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   ├── error.ts
│   │   ├── index.ts
│   │   ├── interceptors.ts
│   │   ├── logger.ts
│   │   ├── server.ts
│   │   ├── status-handler.ts
│   │   └── types.ts
│   └── utils/
│       ├── category-mapper.ts
│       ├── money.ts
│       └── product-mapper.ts
```

---

## 3. Server-Side Data Fetching Highlights

### Storefront Home Page ([`src/app/(user)/(public)/page.tsx`](file:///home/dtid/fronted/src/app/(user)/(public)/page.tsx))
- Async Server Component executing parallel fetches:
  - `getHomeSectionsAction()` -> `GET /api/v1/home`
  - `getCategoriesAction()` -> `GET /api/v1/categories` (revalidate: 60s)
  - `getProductsAction({ per_page: 24 })` -> `GET /api/v1/products`
- Feeds live data into Hero Section, Top Categories grid, Flash Deals, and New Arrivals.

### Products Catalog ([`src/app/(user)/(public)/products/page.tsx`](file:///home/dtid/fronted/src/app/(user)/(public)/products/page.tsx))
- Pure Server Component consuming `await searchParams`.
- Constructs URL query parameters (`category`, `q`, `price_min`, `price_max`, `in_stock`, `sort`, `page`).
- Pre-fetches matching items on the server and streams to interactive client component [`ProductsView`](file:///home/dtid/fronted/src/app/(user)/(public)/products/_components/products-view.tsx).
- Dynamic SEO title generation based on active search/category.

### Admin Portal ([`src/app/(admin)/admin/`](file:///home/dtid/fronted/src/app/(admin)/admin/))
- Fully decoupled admin layout with collapsible dark sidebar, topbar search, and staff profile widget.
- **Categories Management Module** ([`src/app/(admin)/admin/categories/page.tsx`](file:///home/dtid/fronted/src/app/(admin)/admin/categories/page.tsx)):
  - Category Hierarchy & Listing: `GET /api/v1/admin/categories` displaying depth, product counts, VAT basis points, and visual media assets.
  - Create Category: `POST /api/v1/admin/categories` with slug generation, parent selection, SEO metadata (`seo_title`, `seo_description`, `seo_keywords`), and icon/banner uploads (`icon_image_id`, `banner_image_id`).
  - View Category Detail: `GET /api/v1/admin/categories/{category}` with full resource shape.
  - Edit Category: `PUT /api/v1/admin/categories/{category}` for live updates to names, SEO, VAT and media.
  - Move Category: `PUT /api/v1/admin/categories/{category}/move` to re-parent categories and re-order sort positions.
  - Delete Category: `DELETE /api/v1/admin/categories/{category}` with safety verification.
- **Banners & Promos Management Module** ([`src/app/(admin)/admin/banners/page.tsx`](file:///home/dtid/fronted/src/app/(admin)/admin/banners/page.tsx)):
  - Visual Banner Roster: `GET /api/v1/admin/banners` displaying visual cards with type badges (`slider`, `hero`, `promo`), position indicators, status, schedule windows, and desktop/mobile media previews.
  - Create Banner: `POST /api/v1/admin/banners` supporting type selection, title, subtitle, CTA button label, destination link URL, position ordering, starts/ends ISO datetime scheduling, and image uploads via `uploadAdminMediaAction` (`image_id`, `mobile_image_id`).
  - Edit Banner: `PUT /api/v1/admin/banners/{banner}` enabling full updates to media assets, scheduling timestamps, and link destinations.
  - Delete Banner: `DELETE /api/v1/admin/banners/{banner}` with interactive confirmation modal.
  - Live Viewport Preview Modal: Real-time simulation of desktop (21:9 hero canvas) and mobile (9:16 portrait viewport) renderings before publishing.
  - Fast search by title/subtitle/type, with type filters (Slider, Hero, Promo) and status filters (All, Live Now, Active, Inactive).

- **Audit & Activity Log Module** ([`src/app/(admin)/admin/activity-log/page.tsx`](file:///home/dtid/fronted/src/app/(admin)/admin/activity-log/page.tsx)):
  - Global Activity Trail: `GET /api/v1/admin/activity-log` sorted newest first with rich filtering by channel (`log`), event type (`event`), actor (`causer_id`), entity target (`subject_type`, `subject_id`), date windows (`from`, `to`), and freeform search (`q`).
  - Single Record Audit History: `GET /api/v1/admin/activity-log/{type}/{id}` displaying full chronological lifecycles for any individual record (orders, products, reviews, categories) with timeline stepper.
  - Side-by-side JSON diff inspection modal showing previous (`old`) vs subsequent (`new`) states with request context (IP, user agent, request ID).
  - Navigation integrated into Admin Sidebar under Operations (`/admin/activity-log`).

- **Inventory & Stock Control Module** ([`src/app/(admin)/admin/inventory/page.tsx`](file:///home/dtid/fronted/src/app/(admin)/admin/inventory/page.tsx)):
  - KPI Dashboard Cards: Units on hand, total tracked variants, cost valuation, low stock alerts, and depleted out-of-stock items (`GET /api/v1/admin/inventory/summary`).
  - Variant Stock Listing: Lowest stock first sorting, SKU search, stock status filter pills, category filter, and threshold indicators (`GET /api/v1/admin/inventory`).
  - Live Stocktake Adjustments: Set absolute counts or add increments with validation, real-time projection preview, and 500-character audit note with `409 INSUFFICIENT_STOCK` error handling (`POST /api/v1/admin/inventory/adjustments`).
  - Stock Movements & History Audit Trail: Chronological logs tracking sales, purchases, adjustments, customer returns, delta changes, and balance-after values with user attribution (`GET /api/v1/admin/inventory/movements`).

### Customer Order History ([`src/app/(user)/(private)/account/page.tsx`](file:///home/dtid/fronted/src/app/(user)/(private)/account/page.tsx) & `/orders`)
- Direct endpoint integration: `GET /api/v1/me/orders` with bearer authentication.
- Full support for `OrderSummaryResource` specification:
  - Order numbers, placement timestamp, grand totals in integer poisha (`formatPoisha`).
  - All 9 backend order lifecycle statuses: `pending`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded`.
  - Item preview cards with product thumbnail image, variant label, and item quantity.
  - Interactive status filter pills: All, Pending, Confirmed, Processing, Packed, Shipped, Delivered, Cancelled, Returned, Refunded.
  - Direct actions: View full order details, download invoice PDF, live order tracking, and modal cancellation for eligible orders (`can_cancel: true`).
  - Dedicated `/orders` entry point routing directly to customer orders history.

### Customer Single Order View ([`src/app/(user)/(private)/orders/[number]/page.tsx`](file:///home/dtid/fronted/src/app/(user)/(private)/orders/[number]/page.tsx))
- Direct endpoint integration: `GET /api/v1/me/orders/{number}` (`GET_ORDER` endpoint).
- Matches full payload response:
  - Header: Order `#`, lifecycle status badge, placed date, source, payment method label & status.
  - Payment expiry alert if unpaid with `payment_expires_at`.
  - Interactive chronological timeline stepper with notes and timestamps.
  - Complete line items table: Product image, name, variant label, SKU, unit price, quantity, discount, VAT rate (`vat_rate_bp`), line total.
  - Financial breakdown: Subtotal, coupon discount with `coupon_code` badge, VAT, delivery fee, grand total in BDT (`formatPoisha`).
  - Delivery logistics: Zone name and estimated business days window (`days_min` - `days_max`).
  - Contact & addresses: Customer name, phone, email, formatted shipping destination, billing address.
  - Order note / special delivery instructions.
  - **Order Cancellation**: `POST /api/v1/me/orders/{number}/cancel` with `{ reason: string }`. Strictly enforced to orders before packing begins; returns updated order object or descriptive rejection message when packing has started.



