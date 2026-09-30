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
- Real-time catalog management for Products, Categories, Orders, and Customers.
