# Shino-Bangla eCommerce — Complete API Documentation

> **Base URL:** `http://localhost:8000/api/v1`
> **API Version:** v1 (stable — breaking changes go to v2, never here)
> **Authentication:** Laravel Sanctum Bearer tokens
> **Content-Type:** `application/json` (except file uploads which use `multipart/form-data`)

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [System & Health](#2-system--health)
3. [Authentication](#3-authentication)
4. [Profile & Account](#4-profile--account)
5. [Public Catalog](#5-public-catalog)
6. [Cart](#6-cart)
7. [Buy Now (Guest Checkout)](#7-buy-now-guest-checkout)
8. [Checkout](#8-checkout)
9. [Orders (Customer)](#9-orders-customer)
10. [Reviews (Customer)](#10-reviews-customer)
11. [Wishlist](#11-wishlist)
12. [Recently Viewed](#12-recently-viewed)
13. [Addresses](#13-addresses)
14. [Shipping & Locations](#14-shipping--locations)
15. [Payments — SSLCommerz](#15-payments--sslcommerz)
16. [Roles & Permissions (Admin)](#16-roles--permissions-admin)
17. [Staff Management (Admin)](#17-staff-management-admin)
18. [Admin — Settings](#18-admin--settings)
19. [Admin — Media](#19-admin--media)
20. [Admin — Catalogue: Brands](#20-admin--catalogue-brands)
21. [Admin — Catalogue: Categories](#21-admin--catalogue-categories)
22. [Admin — Catalogue: Option Types](#22-admin--catalogue-option-types)
23. [Admin — Catalogue: Products](#23-admin--catalogue-products)
24. [Admin — Inventory](#24-admin--inventory)
25. [Admin — Shipping Zones](#25-admin--shipping-zones)
26. [Admin — Coupons](#26-admin--coupons)
27. [Admin — Flash Sales](#27-admin--flash-sales)
28. [Admin — Orders](#28-admin--orders)
29. [Admin — Reviews](#29-admin--reviews)
30. [Admin — Home Sections](#30-admin--home-sections)
31. [Admin — Banners](#31-admin--banners)
32. [Admin — Pages](#32-admin--pages)
33. [Admin — FAQs](#33-admin--faqs)
34. [Admin — Contact Messages](#34-admin--contact-messages)
35. [Admin — Newsletter](#35-admin--newsletter)
36. [Admin — Dashboard & Reports](#36-admin--dashboard--reports)
37. [Admin — Activity Log](#37-admin--activity-log)
38. [Admin — Customers](#38-admin--customers)
39. [Error Codes Reference](#39-error-codes-reference)
40. [Permissions Reference](#40-permissions-reference)

---

## 1. Global Conventions

### Authentication Header
```
Authorization: Bearer <token>
```
All protected endpoints require this. The token is returned on login / OTP verify.

### Money: Integer Poisha
- **ALL prices are in integer poisha** (1 BDT = 100 poisha).
- `230500` = ৳2,305.00 → display as `(value / 100).toFixed(2)`
- Send amounts in request payloads as integers in poisha.

### VAT / Discount Rates: Basis Points
- `1500` = 15%, `1000` = 10%, `500` = 5%
- Display as `(value / 100)%`

### Phone Numbers
- Accepted formats: `01712345678`, `+8801712345678`, `8801712345678`, or Bangla digits.
- Always returned normalized as `+8801712345678`.

### Pagination (standard for all list endpoints)
```json
{
  "data": [ "..." ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 24,
    "from": 1,
    "to": 24,
    "total": 240
  }
}
```

### Standard Success (single resource)
```json
{ "data": { "id": 1, "..." : "..." } }
```

### Empty Success (DELETE / simple action)
`HTTP 204 No Content` — empty body.

### Standard Error Envelope
```json
{
  "message": "Human-readable description",
  "code": "MACHINE_READABLE_CODE",
  "request_id": "9d3752e2-04fc-4e6a-bc91-231908d08479",
  "errors": {
    "field": ["Validation message"]
  }
}
```

### Guest Cart Flow
1. Guest calls `POST /cart/items` → response contains `data.token`.
2. Store that as `X-Cart-Token` in `localStorage`.
3. Send `X-Cart-Token: <token>` header on all subsequent cart calls.
4. After login, call `POST /cart/claim` with **both** `Authorization` and `X-Cart-Token` headers.

### Idempotent Checkout
Send `Idempotency-Key: <uuid>` header on `POST /checkout` to prevent duplicate orders on network retry.

### Caching
Public storefront routes (`/categories`, `/products`, `/brands`, `/home`, etc.) carry public cache headers. Authenticated responses carry `Cache-Control: no-store, private`.

---

## 2. System & Health

### GET /health

Liveness check. Always public — a monitor that requires credentials stops working the moment they expire.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |
| **Rate Limit** | None |

**Response `200 OK`:**
```json
{ "status": "ok" }
```

---

### GET /settings

Public store configuration — name, contact info, logo URL, available payment methods. Cacheable by browsers and CDN for 5 minutes.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |
| **Cache** | `public, max-age=300, s-maxage=600` |

**Response `200 OK`:**
```json
{
  "data": {
    "store_name": "Shino Bangla",
    "store_email": "info@example.com",
    "store_phone": "+8801700000000",
    "logo_url": "https://cdn.example.com/logo.png",
    "favicon_url": "https://cdn.example.com/favicon.ico",
    "currency": "BDT",
    "payment_methods": ["cod", "sslcommerz"],
    "social_links": { "facebook": "https://facebook.com/...", "instagram": null }
  }
}
```

---

## 3. Authentication

All auth routes live under `/auth`. Each public endpoint has its own tight rate limit.

### POST /auth/register

Register a new shopper. Returns `202` — the account is **not** usable yet. A 6-digit OTP is sent to the email or phone. Verify it with `POST /auth/otp/verify` to receive the first token.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:register` |

**Request Body:**
```json
{
  "name": "Rahim Uddin",
  "login": "01712345678",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | 1–255 chars |
| `login` | string | YES | Email address OR Bangladeshi mobile number |
| `password` | string | YES | Meets password complexity rules |
| `password_confirmation` | string | YES | Must match `password` |

**Response `202 Accepted`:**
```json
{
  "message": "We have sent you a code to verify your account.",
  "data": {
    "login": "017***5678",
    "channel": "sms",
    "ttl_minutes": 10
  }
}
```

---

### POST /auth/otp/verify

Submit the 6-digit OTP sent during registration. On success, marks the account as verified and **returns the bearer token**.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:otp-verify` (5 wrong tries voids the code) |

**Request Body:**
```json
{
  "login": "01712345678",
  "code": "123456",
  "device_name": "Chrome on Windows"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `login` | string | YES | Same email/phone used at registration |
| `code` | string | YES | Exactly 6 digits |
| `device_name` | string | NO | Label for the token (shown in token list) |

**Response `200 OK`:**
```json
{
  "data": {
    "token": {
      "token": "1|abcdefghijklm...",
      "token_type": "Bearer",
      "expires_at": "2026-10-08T09:04:42+00:00",
      "abilities": ["*"]
    },
    "user": {
      "id": 42,
      "name": "Rahim Uddin",
      "email": null,
      "email_verified": false,
      "phone": "+8801712345678",
      "phone_verified": true,
      "avatar_url": null,
      "has_password": true,
      "google_linked": false,
      "is_active": true,
      "roles": ["customer"],
      "permissions": [],
      "last_login_at": "2026-10-01T09:04:42+00:00",
      "created_at": "2026-10-01T09:04:42+00:00",
      "updated_at": "2026-10-01T09:04:42+00:00"
    }
  }
}
```

**Error codes:**

| Code | HTTP | Meaning |
|---|---|---|
| `OTP_INVALID` | 422 | Wrong code entered |
| `OTP_EXPIRED` | 422 | Code has expired |
| `OTP_ATTEMPTS_EXCEEDED` | 422 | 5 wrong tries — code voided, resend required |
| `ACCOUNT_INACTIVE` | 403 | Account has been deactivated |

---

### POST /auth/otp/resend

Request a new OTP code. Works for account verification (`purpose=verify`) or password reset (`purpose=password_reset`). Always answers `202` whether or not the account exists.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:otp-send` |

**Request Body:**
```json
{
  "login": "01712345678",
  "purpose": "verify"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `login` | string | YES | Email or mobile |
| `purpose` | string | NO | `verify` (default) or `password_reset` |

**Response `202 Accepted`:**
```json
{
  "message": "If an account needs it, a new code is on its way.",
  "data": { "login": "017***5678", "channel": "sms", "ttl_minutes": 10 }
}
```

**Error:** `429 OTP_COOLDOWN` with `Retry-After` header if a code was sent moments ago.

---

### POST /auth/login

Exchange email/phone + password for a bearer token.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:login` |

**Request Body:**
```json
{
  "login": "01712345678",
  "password": "SecurePass123!",
  "device_name": "My Android"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `login` | string | YES | Email or mobile number |
| `password` | string | YES | Account password |
| `device_name` | string | NO | Shown in token management list |

**Response `200 OK`:** Same shape as `POST /auth/otp/verify`.

**Error codes:**

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Wrong credentials (same message for unknown account vs wrong password — prevents enumeration) |
| `ACCOUNT_INACTIVE` | 403 | Account deactivated |
| `ACCOUNT_NOT_VERIFIED` | 403 | Password correct but account unverified — new OTP sent |

---

### POST /auth/google

Sign in or register via Google OAuth ID token.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:google` |

**Request Body:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1Ni...",
  "device_name": "Chrome"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_token` | string | YES | Google ID token from OAuth popup |
| `device_name` | string | NO | Label for token |

**Response `200 OK`:** Same shape as login.

---

### POST /auth/forgot-password

Send a 6-digit reset code. Always answers `202` — whether or not the account exists (enumeration prevention).

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:password-reset` |

**Request Body:**
```json
{ "login": "01712345678" }
```

**Response `202 Accepted`:** Same shape as OTP resend.

---

### POST /auth/reset-password

Submit the 6-digit reset code and set a new password.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:otp-verify` |

**Request Body:**
```json
{
  "login": "01712345678",
  "code": "654321",
  "password": "NewPass456!",
  "password_confirmation": "NewPass456!"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `login` | string | YES | Email or mobile |
| `code` | string | YES | 6-digit reset code |
| `password` | string | YES | New password |
| `password_confirmation` | string | YES | Must match `password` |

**Response `200 OK`:** `{ "message": "Password reset successfully." }`

---

### POST /auth/logout

Revoke the current token.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |

**Response `204 No Content`**

---

### POST /auth/logout-all

Revoke **all** tokens for this account (sign out every device).

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |

**Response `204 No Content`**

---

### PUT /auth/password

Change the authenticated user's password.

| | |
|---|---|
| **Method** | `PUT` |
| **Auth** | Bearer required |

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "password": "NewPass456!",
  "password_confirmation": "NewPass456!"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `current_password` | string | YES (if has password) | Skipped for Google-only accounts |
| `password` | string | YES | New password |
| `password_confirmation` | string | YES | Must match |

**Response `200 OK`:** `{ "message": "Password updated." }`

---

### GET /auth/tokens

List all active tokens for the authenticated account.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Chrome on Windows",
      "abilities": ["*"],
      "last_used_at": "2026-10-01T08:00:00+00:00",
      "expires_at": "2026-10-08T09:04:42+00:00",
      "created_at": "2026-10-01T09:04:42+00:00"
    }
  ]
}
```

---

### DELETE /auth/tokens/{token}

Revoke a specific token by its numeric ID (sign out one device).

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | Bearer required |
| **URL Param** | `{token}` — numeric token ID from `GET /auth/tokens` |

**Response `204 No Content`**

---

## 4. Profile & Account

### GET /me

Get the authenticated user's full profile including roles and permissions.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

**Response `200 OK`:**
```json
{
  "data": {
    "id": 42,
    "name": "Rahim Uddin",
    "email": "rahim@example.com",
    "email_verified": true,
    "email_verified_at": "2026-09-01T10:00:00+00:00",
    "phone": "+8801712345678",
    "phone_verified": true,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": true,
    "is_staff": false,
    "roles": ["customer"],
    "permissions": [],
    "last_login_at": "2026-10-01T09:00:00+00:00",
    "created_at": "2026-09-01T10:00:00+00:00",
    "updated_at": "2026-10-01T09:00:00+00:00"
  }
}
```

---

### PUT /me

Update the authenticated user's display name or avatar.

| | |
|---|---|
| **Method** | `PUT` |
| **Auth** | Bearer required |

**Request Body:**
```json
{
  "name": "Rahim Uddin",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | NO | 1–255 chars |
| `avatar_url` | string/null | NO | URL to avatar image |

**Response `200 OK`:** Updated user object.

---

### POST /me/contact

Request a contact change (new email or phone). A verification code is sent to the **new** address. The account does NOT switch until `POST /me/contact/verify` is called.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |
| **Rate Limit** | `throttle:otp-send` |

**Request Body:**
```json
{ "login": "new@example.com" }
```

**Response `202 Accepted`:** OTP sent confirmation.

---

### POST /me/contact/verify

Confirm the contact change with the 6-digit code sent to the new address.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |
| **Rate Limit** | `throttle:otp-verify` |

**Request Body:**
```json
{
  "login": "new@example.com",
  "code": "123456"
}
```

| Field | Type | Required |
|---|---|---|
| `login` | string | YES |
| `code` | string | YES — 6 digits |

**Response `200 OK`:** Updated user object.

---

## 5. Public Catalog

All catalog routes use `throttle:catalog` and are publicly cacheable (`max-age=60, s-maxage=300`).

### GET /categories

All active categories as a tree for navigation menus.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:**

| Param | Type | Notes |
|---|---|---|
| `parent_id` | integer | Filter to children of this category |
| `flat` | boolean | Return flat list instead of tree |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "parent_id": null,
      "description": "...",
      "is_active": true,
      "icon_url": "https://...",
      "banner_url": "https://...",
      "children": []
    }
  ]
}
```

---

### GET /categories/{slug}

Single category by slug with SEO metadata.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:** Single category resource with `children` array.

---

### GET /brands

List all active brands.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:** `page`, `per_page`

**Response `200 OK`:** Paginated brand list.
```json
{
  "data": [
    {
      "id": 1, "name": "Samsung", "slug": "samsung",
      "description": "...", "logo_url": "https://...",
      "banner_url": "https://...", "seo_title": "...", "seo_description": "..."
    }
  ],
  "links": {}, "meta": {}
}
```

---

### GET /brands/{slug}

Single brand by slug.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

---

### GET /products

Paginated product listing with filtering, sorting, and search.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:**

| Param | Type | Notes |
|---|---|---|
| `q` | string | Full-text search |
| `category` | string | Category slug |
| `brand` | string | Brand slug |
| `min_price` | integer | Min price in poisha |
| `max_price` | integer | Max price in poisha |
| `sort` | string | `price_asc`, `price_desc`, `newest`, `popular`, `rating` |
| `in_stock` | boolean | Only show in-stock |
| `on_sale` | boolean | Only show discounted |
| `featured` | boolean | Only featured |
| `page` | integer | Page number |
| `per_page` | integer | Items per page (default 24) |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 101, "name": "Samsung Galaxy A54", "slug": "samsung-galaxy-a54",
      "short_description": "...", "thumbnail_url": "https://...",
      "brand": { "id": 1, "name": "Samsung", "slug": "samsung" },
      "category": { "id": 3, "name": "Phones", "slug": "phones" },
      "price": 4500000, "compare_at_price": 5000000, "is_on_sale": true,
      "rating_average": 4.5, "rating_count": 120,
      "in_stock": true, "is_featured": false, "is_new_arrival": true
    }
  ],
  "links": {}, "meta": {}
}
```

---

### GET /products/facets

Aggregated filter options for the current product query (price range, brands, categories).

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:** Same as `GET /products`.

**Response `200 OK`:**
```json
{
  "data": {
    "price": { "min": 100000, "max": 50000000 },
    "brands": [{ "id": 1, "name": "Samsung", "count": 45 }],
    "categories": [{ "id": 3, "name": "Phones", "count": 120 }]
  }
}
```

---

### GET /products/suggest

Autocomplete suggestions as the user types in the search bar.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:** `q` (required — search term)

**Response `200 OK`:**
```json
{
  "data": [
    { "type": "product", "id": 101, "name": "Samsung Galaxy A54", "slug": "samsung-galaxy-a54", "thumbnail_url": "https://..." },
    { "type": "category", "id": 3, "name": "Phones", "slug": "phones" }
  ]
}
```

---

### GET /products/{slug}

Full product detail: variants, images, option types, ratings.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:**
```json
{
  "data": {
    "id": 101, "name": "Samsung Galaxy A54", "slug": "samsung-galaxy-a54",
    "description": "<p>Full HTML description...</p>",
    "short_description": "...",
    "brand": { "id": 1, "name": "Samsung", "slug": "samsung" },
    "category": { "id": 3, "name": "Phones", "slug": "phones" },
    "images": [{ "id": 1, "url": "https://...", "alt": "Front view" }],
    "variants": [
      {
        "id": 201, "sku": "SAM-A54-BLK-128",
        "options": { "Color": "Black", "Storage": "128GB" },
        "price": 4500000, "compare_at_price": 5000000, "sale_price": null,
        "stock": 50, "in_stock": true, "weight_grams": 202
      }
    ],
    "option_types": [
      { "name": "Color", "values": ["Black", "Blue", "White"] },
      { "name": "Storage", "values": ["128GB", "256GB"] }
    ],
    "rating_average": 4.5, "rating_count": 120,
    "is_featured": false, "is_new_arrival": true, "is_best_seller": false,
    "seo_title": "...", "seo_description": "..."
  }
}
```

---

### GET /products/{slug}/related

Curated + algorithmic related products for the "You may also like" section.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:** Array of product summary objects.

---

### GET /products/{slug}/reviews

Approved customer reviews for a product.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:** `page`, `sort` (`newest`/`oldest`/`rating_high`/`rating_low`), `rating` (1–5)

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 5, "user": { "id": 42, "name": "Rahim U." },
      "rating": 5, "title": "Great phone!",
      "body": "Excellent value for money...",
      "photos": [{ "url": "https://..." }],
      "is_verified_purchase": true, "created_at": "2026-09-15T10:00:00+00:00"
    }
  ],
  "links": {}, "meta": {}
}
```

---

### GET /home

Full home page — all active sections in one call (banners, featured products, flash sales, etc.). Cached server-side.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:**
```json
{
  "data": {
    "banners": [],
    "sections": [
      { "id": 1, "type": "featured_products", "title": "Featured Products", "subtitle": null, "items": [] }
    ]
  }
}
```

---

### GET /pages

List all active static pages.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:** Array of `{ id, title, slug, is_active }`.

---

### GET /pages/{slug}

Full content of a single static page.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:**
```json
{
  "data": {
    "id": 1, "title": "About Us", "slug": "about-us",
    "content": "<p>...</p>", "seo_title": "...", "seo_description": "...", "is_active": true
  }
}
```

---

### GET /faqs

All active FAQ entries, grouped.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:**
```json
{
  "data": [
    { "id": 1, "question": "How do I track my order?", "answer": "...", "group": "Orders", "position": 1 }
  ]
}
```

---

### GET /sitemap

Slugs for the frontend to build `sitemap.xml`. Query one `type` at a time.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:** `type` (required: `products`/`categories`/`brands`/`pages`), `page`

**Response `200 OK`:** Paginated list of `{ slug, updated_at }`.

---

### POST /contact

Submit the contact form. Includes honeypot field for bot protection.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional (logged-in info pre-filled) |
| **Rate Limit** | `throttle:contact` |

**Request Body:**
```json
{
  "name": "Rahim Uddin",
  "email": "rahim@example.com",
  "phone": "01712345678",
  "subject": "Order inquiry",
  "message": "I have a question about...",
  "honeypot": ""
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | |
| `email` | string | YES | |
| `phone` | string | NO | |
| `subject` | string | YES | |
| `message` | string | YES | |
| `honeypot` | string | NO | Must be empty — bot trap |

**Response `201 Created`:** `{ "message": "Your message has been sent." }`

---

### POST /newsletter/subscribe

Subscribe an email to the mailing list.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:contact` |

**Request Body:** `{ "email": "rahim@example.com" }`

**Response `200 OK`:** `{ "message": "Subscribed successfully." }`

---

### POST /newsletter/unsubscribe

Unsubscribe from the mailing list.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |

**Request Body:** `{ "email": "rahim@example.com", "token": "unsubscribe-token" }`

**Response `200 OK`:** `{ "message": "Unsubscribed." }`

---

### POST /track/view

Record a product page view (anonymous analytics). Counted after response, stored as a one-day hash — privacy-preserving.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Rate Limit** | `throttle:track` |

**Request Body:** `{ "type": "product", "id": 101 }`

**Response `204 No Content`**

---

## 6. Cart

Cart routes accept both guests (`X-Cart-Token` header) and authenticated users.

### GET /cart

Get current cart contents including line items, totals, coupon, and saved-for-later items.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Optional — `X-Cart-Token` for guests |

**Query Parameters:** `location_id` (integer — district ID for shipping estimate)

**Response `200 OK`:**
```json
{
  "data": {
    "token": "guest-cart-token-xyz",
    "items": [
      {
        "id": 1, "variant_id": 201,
        "product": { "id": 101, "name": "Samsung Galaxy A54", "slug": "...", "thumbnail_url": "..." },
        "variant": { "id": 201, "sku": "SAM-A54-BLK-128", "options": { "Color": "Black" } },
        "quantity": 2, "unit_price": 4500000, "subtotal": 9000000, "is_saved_for_later": false
      }
    ],
    "saved_for_later": [],
    "coupon": { "code": "WELCOME10", "discount": 450000 },
    "totals": { "subtotal": 9000000, "discount": 450000, "shipping": 10000, "tax": 0, "total": 8560000 }
  }
}
```

> `data.token` is the guest cart token. It is returned on the first `POST /cart/items` for a new guest.

---

### POST /cart/items

Add an item to the cart. For a new guest, the response includes `data.token` — store it as `X-Cart-Token`.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional |

**Request Body:**
```json
{ "variant_id": 201, "quantity": 2 }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `variant_id` | integer | YES | Must exist and not be deleted |
| `quantity` | integer | NO | Default 1, max 10,000 |

**Response `201 Created`:**
```json
{
  "data": {
    "token": "guest-cart-token-xyz",
    "item": { "id": 1, "variant_id": 201, "quantity": 2 },
    "cart_count": 2
  }
}
```

---

### PATCH /cart/items/{item}

Update quantity of a cart item.

| | |
|---|---|
| **Method** | `PATCH` |
| **Auth** | Optional |
| **URL Param** | `{item}` — cart item ID |

**Request Body:** `{ "quantity": 3 }`

**Response `200 OK`:** Updated cart item.

---

### DELETE /cart/items/{item}

Remove an item from the cart.

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | Optional |

**Response `204 No Content`**

---

### POST /cart/items/{item}/save-for-later

Move a cart item to the "saved for later" list.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional |

**Response `200 OK`:** Updated cart.

---

### POST /cart/items/{item}/move-to-cart

Move a saved-for-later item back into the active cart.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional |

**Response `200 OK`:** Updated cart.

---

### PUT /cart/coupon

Apply a coupon code to the cart.

| | |
|---|---|
| **Method** | `PUT` |
| **Auth** | Optional |

**Request Body:** `{ "coupon_code": "WELCOME10" }` (case-insensitive, max 32 chars)

**Response `200 OK`:** Updated cart with applied coupon.

**Error codes:** `COUPON_INVALID`, `COUPON_USAGE_LIMIT`, `COUPON_MIN_PURCHASE`

---

### DELETE /cart/coupon

Remove the applied coupon from the cart.

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | Optional |

**Response `200 OK`:** Updated cart without coupon.

---

### POST /cart/claim

Merge a guest cart into the authenticated user's cart after login. Send **both** `Authorization: Bearer <token>` AND `X-Cart-Token: <guest_token>`.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer + `X-Cart-Token` both required |

**Response `200 OK`:** Merged cart.

---

## 7. Buy Now (Guest Checkout)

Buy Now allows any visitor to order one product directly from the product page without an account. Guests must provide a **mobile number**.

### POST /buy-now/quote

Get a price quote before placing a Buy Now order.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional |

**Request Body:**
```json
{
  "variant_id": 201,
  "quantity": 1,
  "district_id": 15,
  "coupon_code": "WELCOME10"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `variant_id` | integer | YES | |
| `quantity` | integer | YES | 1–10,000 |
| `district_id` | integer | NO | For shipping estimate |
| `coupon_code` | string | NO | Case-insensitive |

**Response `200 OK`:**
```json
{
  "data": { "subtotal": 4500000, "discount": 450000, "shipping": 10000, "total": 4060000 }
}
```

---

### POST /buy-now

Place a Buy Now order. Guests must provide `name` and `phone`. Signed-in customers can use `address_id`.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional |
| **Rate Limit** | `throttle:guest-order` |

**Request Body (Guest):**
```json
{
  "variant_id": 201,
  "quantity": 1,
  "name": "Rahim Uddin",
  "phone": "01712345678",
  "email": "rahim@example.com",
  "address": {
    "name": "Rahim Uddin",
    "phone": "01712345678",
    "line1": "House 5, Road 3",
    "line2": "Dhanmondi",
    "area": "Dhanmondi",
    "district_id": 15,
    "postcode": "1205"
  },
  "billing_address": null,
  "coupon_code": "WELCOME10",
  "payment_method": "sslcommerz",
  "note": "Please pack carefully."
}
```

**Request Body (Signed-in):**
```json
{ "variant_id": 201, "quantity": 2, "address_id": 5, "payment_method": "cod" }
```

**Top-level fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `variant_id` | integer | YES | |
| `quantity` | integer | YES | 1–10,000 |
| `name` | string | YES (guest) | Buyer name |
| `phone` | string | YES (guest) | Bangladeshi mobile — order identity for guests |
| `email` | string | NO | |
| `address_id` | integer | YES (signed-in, if no `address`) | Saved address ID |
| `address` | object | YES (if no `address_id`) | See address fields below |
| `billing_address` | object | NO | Defaults to delivery address |
| `coupon_code` | string | NO | |
| `payment_method` | string | YES | `cod` or `sslcommerz` |
| `note` | string | NO | Max 1000 chars |

**Address object fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | Recipient name |
| `phone` | string | YES | Bangladeshi mobile |
| `line1` | string | YES | Street / house |
| `line2` | string | NO | Apartment / floor |
| `area` | string | NO | Neighbourhood |
| `district_id` | integer | YES | From `GET /locations` |
| `postcode` | string | NO | Max 16 chars |

**Response `201 Created`:**
```json
{
  "data": {
    "order_number": "ORD-20261001-001",
    "total": 4060000,
    "payment_method": "sslcommerz",
    "payment_url": "https://sandbox.sslcommerz.com/gwprocess/v3/...",
    "status": "pending"
  }
}
```

> If `payment_method` is `sslcommerz`, redirect the browser to `payment_url` immediately.

---

## 8. Checkout

Checkout requires authentication. The guest cart must be claimed first via `POST /cart/claim`.

### POST /checkout/quote

Preview order totals for the current cart at a given address/district.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |

**Request Body:**
```json
{ "address_id": 5, "district_id": 15 }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `address_id` | integer | NO | Saved address for shipping estimate |
| `district_id` | integer | NO | Alternative to `address_id` |

**Response `200 OK`:**
```json
{
  "data": { "subtotal": 9000000, "discount": 900000, "shipping": 10000, "tax": 0, "total": 8110000 }
}
```

---

### POST /checkout

Place the cart as an order.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |
| **Header** | `Idempotency-Key: <uuid>` (strongly recommended — prevents duplicate orders on retry) |

**Request Body:**
```json
{
  "address_id": 5,
  "billing_address_id": null,
  "address": {
    "name": "Rahim Uddin",
    "phone": "01712345678",
    "line1": "House 5, Road 3",
    "district_id": 15
  },
  "billing_address": null,
  "payment_method": "sslcommerz",
  "note": "Ring doorbell twice."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `address_id` | integer | YES (if no `address`) | Saved address book ID |
| `billing_address_id` | integer | NO | Saved billing address |
| `address` | object | YES (if no `address_id`) | Full address object |
| `billing_address` | object | NO | Billing address; defaults to delivery |
| `payment_method` | string | YES | `cod` or `sslcommerz` |
| `note` | string | NO | Max 1000 chars |

**Response `201 Created`:**
```json
{
  "data": {
    "order_number": "ORD-20261001-002",
    "total": 8110000,
    "payment_method": "sslcommerz",
    "payment_url": "https://sandbox.sslcommerz.com/gwprocess/v3/...",
    "status": "pending"
  }
}
```

**Error codes:** `INSUFFICIENT_STOCK` (409), `CART_EMPTY` (422), `COUPON_INVALID` (422)

---

## 9. Orders (Customer)

### GET /orders/track

Track an order **without signing in** using order number + mobile. Wrong pair answers identically to an unknown order.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |
| **Rate Limit** | `throttle:order-track` |

**Query Parameters:** `number` (required, order number), `phone` (required, Bangladeshi mobile)

**Response `200 OK`:**
```json
{
  "data": {
    "order_number": "ORD-20261001-001",
    "status": "shipped",
    "placed_at": "2026-10-01T09:00:00+00:00",
    "items": [{ "name": "Samsung Galaxy A54", "quantity": 1, "unit_price": 4500000 }],
    "timeline": [
      { "status": "pending", "note": null, "created_at": "..." },
      { "status": "confirmed", "note": null, "created_at": "..." },
      { "status": "shipped", "note": "Dispatched via Pathao Courier", "created_at": "..." }
    ],
    "totals": { "subtotal": 4500000, "shipping": 10000, "total": 4510000 }
  }
}
```

---

### POST /orders/{number}/pay

Initiate or retry payment for an already-placed order. Guests prove ownership with the phone number.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Optional |
| **Rate Limit** | `throttle:payment-start` |

**Request Body (guest only):**
```json
{ "phone": "01712345678" }
```

**Response `200 OK`:**
```json
{ "data": { "payment_url": "https://sandbox.sslcommerz.com/gwprocess/v3/..." } }
```

---

### GET /me/orders

List the authenticated customer's own orders.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

**Query Parameters:** `page`, `status`

**Response `200 OK`:** Paginated list of order summaries.

---

### GET /me/orders/{number}

Full detail of a specific order.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

**Response `200 OK`:** Full order with items, timeline, totals, and shipping address.

---

### POST /me/orders/{number}/cancel

Customer cancels their own order (only allowed while `pending` or `confirmed`).

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |

**Request Body:** `{ "reason": "Changed my mind" }` (`reason` optional, max 500 chars)

**Response `200 OK`:** Updated order.

---

### GET /me/orders/{number}/invoice

Download the order invoice as PDF.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

**Response:** `application/pdf` file download.

---

## 10. Reviews (Customer)

### GET /me/reviewable-items

List delivered order items the user can review.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

---

### GET /me/reviews

List all reviews written by the authenticated user.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Bearer required |

---

### POST /me/reviews

Submit a review for a delivered product.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |

**Request Body:**
```json
{
  "order_item_id": 55,
  "rating": 5,
  "title": "Excellent phone!",
  "body": "Very happy with my purchase...",
  "photo_ids": [10, 11]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `order_item_id` | integer | YES | Must be a delivered item belonging to the user |
| `rating` | integer | YES | 1–5 |
| `title` | string | NO | Max 255 chars |
| `body` | string | NO | Max 5000 chars |
| `photo_ids` | array | NO | IDs from `POST /me/reviews/photos` |

**Response `201 Created`:** Review object (hidden until admin approval).

---

### PUT /me/reviews/{review}

Edit an existing review (only before approval).

| | |
|---|---|
| **Method** | `PUT` |
| **Auth** | Bearer required |

**Request Body:** Same as POST, all optional.

---

### DELETE /me/reviews/{review}

Delete a review.

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | Bearer required |

**Response `204 No Content`**

---

### POST /me/reviews/photos

Upload a review photo. Returns an ID to include in `POST /me/reviews`.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |
| **Content-Type** | `multipart/form-data` |
| **Rate Limit** | `throttle:review-photo` |

**Request Body:** `file: <image (jpg/png/webp)>`

**Response `201 Created`:** `{ "data": { "id": 10, "url": "https://..." } }`

---

## 11. Wishlist

### GET /me/wishlist

| **Method** | `GET` | **Auth** | Bearer required |
|---|---|---|---|

**Response `200 OK`:** Paginated list of wishlisted products.

---

### POST /me/wishlist

| **Method** | `POST` | **Auth** | Bearer required |
|---|---|---|---|

**Request Body:** `{ "product_id": 101 }`

**Response `201 Created`:** Wishlist item.

---

### DELETE /me/wishlist/{product}

| **Method** | `DELETE` | **Auth** | Bearer required |
|---|---|---|---|

**Response `204 No Content`**

---

## 12. Recently Viewed

### GET /me/recently-viewed

| **Method** | `GET` | **Auth** | Bearer required |
|---|---|---|---|

**Response `200 OK`:** List of recently viewed products.

---

### POST /me/recently-viewed

| **Method** | `POST` | **Auth** | Bearer required |
|---|---|---|---|

**Request Body:** `{ "product_id": 101 }`

**Response `204 No Content`**

---

## 13. Addresses

### GET /me/addresses

| **Method** | `GET` | **Auth** | Bearer required |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 5, "label": "Home", "name": "Rahim Uddin", "phone": "+8801712345678",
      "line1": "House 5, Road 3", "line2": null, "area": "Dhanmondi",
      "district_id": 15, "district": { "id": 15, "name": "Dhaka" },
      "division_id": 1, "division": { "id": 1, "name": "Dhaka" },
      "postcode": "1205", "is_default_shipping": true, "is_default_billing": false
    }
  ]
}
```

---

### POST /me/addresses

Create a new saved address.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Bearer required |

**Request Body:**
```json
{
  "label": "Home",
  "name": "Rahim Uddin",
  "phone": "01712345678",
  "division_id": 1,
  "district_id": 15,
  "area": "Dhanmondi",
  "line1": "House 5, Road 3",
  "line2": "Flat 4A",
  "postcode": "1205",
  "is_default_shipping": true,
  "is_default_billing": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `label` | string | NO | e.g. "Home", "Office" — max 32 chars |
| `name` | string | YES | Recipient name |
| `phone` | string | YES | Bangladeshi mobile |
| `division_id` | integer | NO | Division ID |
| `district_id` | integer | YES | District ID from `GET /locations` |
| `area` | string | NO | Neighbourhood |
| `line1` | string | YES | Street / house |
| `line2` | string | NO | Floor / apartment |
| `postcode` | string | NO | Max 16 chars |
| `is_default_shipping` | boolean | NO | |
| `is_default_billing` | boolean | NO | |

**Response `201 Created`:** New address object.

---

### PUT /me/addresses/{address}

Update a saved address.

| | |
|---|---|
| **Method** | `PUT` |
| **Auth** | Bearer required |

**Request Body:** Same fields as POST, all optional.

**Response `200 OK`:** Updated address.

---

### DELETE /me/addresses/{address}

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | Bearer required |

**Response `204 No Content`**

---

## 14. Shipping & Locations

### GET /locations

Location hierarchy (divisions and districts) for address forms.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Query Parameters:** `parent_id` (integer), `level` (`division` or `district`)

**Response `200 OK`:**
```json
{
  "data": [
    { "id": 1, "name": "Dhaka Division", "level": "division", "parent_id": null },
    { "id": 15, "name": "Dhaka", "level": "district", "parent_id": 1 }
  ]
}
```

---

### GET /shipping/zones

Active shipping zones with their rates for the shipping calculator.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1, "name": "Dhaka City", "is_default": false, "rate_basis": "flat",
      "rates": [{ "range_from": 0, "range_to": null, "charge": 6000 }],
      "free_above": 300000, "delivery_days_min": 1, "delivery_days_max": 3
    }
  ]
}
```

---

## 15. Payments — SSLCommerz

These are **browser-redirect targets** from the SSLCommerz gateway — NOT called by frontend JavaScript directly.

### POST /payments/sslcommerz/success

Gateway callback when payment succeeds. Verifies with SSLCommerz, marks order paid. Redirects browser to frontend success page.

| **Method** | `POST` | **Auth** | None |
|---|---|---|---|

---

### POST /payments/sslcommerz/fail

Gateway callback when payment fails. Redirects to frontend failure page.

| **Method** | `POST` | **Auth** | None |
|---|---|---|---|

---

### POST /payments/sslcommerz/cancel

Gateway callback when customer cancels. Redirects to frontend cancel page.

| **Method** | `POST` | **Auth** | None |
|---|---|---|---|

---

### POST /payments/sslcommerz/ipn

Instant Payment Notification — SSLCommerz server calls this directly. Guarantees order settlement even if the browser redirect never happens.

| **Method** | `POST` | **Auth** | None (server-to-server) |
|---|---|---|---|

**Response `200 OK`:** `{ "status": "ok" }`

---

## 16. Roles & Permissions (Admin)

Requires `auth:sanctum`, `active`, and `permission:roles.*` middleware.

### GET /permissions

List all available permission names for the role editor checkbox list.

| **Method** | `GET` | **Auth** | Bearer + `permission:roles.view` |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": [{ "name": "orders.view", "description": "View orders", "group": "Orders" }]
}
```

---

### GET /roles

| **Method** | `GET` | **Auth** | Bearer + `permission:roles.view` |
|---|---|---|---|

**Response `200 OK`:** Paginated role list.

---

### GET /roles/{role}

| **Method** | `GET` | **Auth** | Bearer + `permission:roles.view` |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": { "id": 2, "name": "Order Manager", "permissions": ["orders.view", "orders.update"], "created_at": "..." }
}
```

---

### POST /roles

Create a new custom role.

| **Method** | `POST` | **Auth** | Bearer + `permission:roles.create` |
|---|---|---|---|

**Request Body:**
```json
{ "name": "Order Manager", "permissions": ["orders.view", "orders.update"] }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | 1–125 chars, unique, cannot be a system role name |
| `permissions` | array | YES | May be empty `[]` — permission names |

**Response `201 Created`:** New role.

---

### PUT /roles/{role}

| **Method** | `PUT` | **Auth** | Bearer + `permission:roles.update` |
|---|---|---|---|

**Request Body:** Same as POST.

---

### DELETE /roles/{role}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:roles.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 17. Staff Management (Admin)

### GET /staff

| **Method** | `GET` | **Auth** | Bearer + `permission:staff.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q` (search name/email)

---

### GET /staff/{staff}

| **Method** | `GET` | **Auth** | Bearer + `permission:staff.view` |
|---|---|---|---|

---

### POST /staff

Create a new staff account. Administrator sets the password — no invitation email. Account is immediately usable.

| **Method** | `POST` | **Auth** | Bearer + `permission:staff.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "name": "Karim Ali",
  "email": "karim@store.com",
  "password": "InitialPass123!",
  "role": "Order Manager",
  "is_active": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | |
| `email` | string | YES | Unique, RFC-valid email |
| `password` | string | YES | Meets password complexity |
| `role` | string | YES | Role name (not "customer") |
| `is_active` | boolean | NO | Default true |

**Response `201 Created`:** User resource.

---

### PUT /staff/{staff}

Update staff details. Changing role requires additionally having `roles.assign`.

| **Method** | `PUT` | **Auth** | Bearer + `permission:staff.update` |
|---|---|---|---|

**Request Body:** Same as POST, all optional.

---

### DELETE /staff/{staff}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:staff.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 18. Admin — Settings

### GET /admin/settings

| **Method** | `GET` | **Auth** | Bearer + `permission:settings.view` |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": {
    "store_name": "Shino Bangla", "store_email": "info@example.com",
    "store_phone": "+8801700000000", "currency": "BDT",
    "timezone": "Asia/Dhaka", "order_prefix": "ORD",
    "low_stock_threshold": 5, "payment_methods": ["cod", "sslcommerz"]
  }
}
```

---

### PUT /admin/settings

Send only the settings keys being changed.

| **Method** | `PUT` | **Auth** | Bearer + `permission:settings.update` |
|---|---|---|---|

**Request Body (partial):**
```json
{ "store_name": "Shino Bangla Store", "low_stock_threshold": 10 }
```

**Response `200 OK`:** Full updated settings.

---

### POST /admin/settings/assets/{asset}

Upload a file-based setting (logo, favicon, og_image).

| **Method** | `POST` | **Auth** | Bearer + `permission:settings.update` | **Content-Type** | `multipart/form-data` |
|---|---|---|---|---|---|

**URL Param** `{asset}`: `logo`, `favicon`, or `og_image`

**Request Body:** `file: <image (jpg/png/webp)>`

**Response `200 OK`:** `{ "data": { "url": "https://..." } }`

---

## 19. Admin — Media

### POST /admin/media

Upload an image. Returns an `id` to reference in other requests (products, brands, banners, categories).

| **Method** | `POST` | **Auth** | Bearer + `permission:media.upload` | **Content-Type** | `multipart/form-data` |
|---|---|---|---|---|---|

**Request Body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | YES | JPEG, PNG, or WebP only. No SVG (script risk). No GIF (first-frame only). Max size from config. |
| `alt` | string | NO | Alt text, max 255 chars |

**Response `201 Created`:**
```json
{
  "data": {
    "id": 99, "url": "https://cdn.example.com/media/99.webp",
    "alt": "A product photo", "width": 800, "height": 600, "size_bytes": 45000
  }
}
```

---

### DELETE /admin/media/{media}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:media.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 20. Admin — Catalogue: Brands

### GET /admin/brands

| **Method** | `GET` | **Auth** | Bearer + `permission:brands.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q`, `is_active`

---

### GET /admin/brands/{brand}

| **Method** | `GET` | **Auth** | Bearer + `permission:brands.view` |
|---|---|---|---|

---

### POST /admin/brands

Upload logo/banner via `POST /admin/media` first, then pass the returned IDs.

| **Method** | `POST` | **Auth** | Bearer + `permission:brands.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "name": "Samsung", "slug": "samsung",
  "description": "Global electronics brand",
  "is_active": true, "sort_order": 0,
  "seo_title": "Samsung Products", "seo_description": "Browse Samsung...", "seo_keywords": "samsung, electronics",
  "logo_image_id": 99, "banner_image_id": 100
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | 1–255 chars |
| `slug` | string | NO | Auto-generated if omitted |
| `description` | string | NO | Max 5000 chars |
| `is_active` | boolean | NO | |
| `sort_order` | integer | NO | 0–65535 |
| `seo_title` | string | NO | Max 255 |
| `seo_description` | string | NO | Max 500 |
| `seo_keywords` | string | NO | Max 500 |
| `logo_image_id` | integer | NO | Media ID |
| `banner_image_id` | integer | NO | Media ID |

**Response `201 Created`:** New brand.

---

### PUT /admin/brands/{brand}

| **Method** | `PUT` | **Auth** | Bearer + `permission:brands.update` |
|---|---|---|---|

**Request Body:** Same as POST, all optional.

---

### DELETE /admin/brands/{brand}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:brands.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 21. Admin — Catalogue: Categories

### GET /admin/categories

| **Method** | `GET` | **Auth** | Bearer + `permission:categories.view` |
|---|---|---|---|

---

### GET /admin/categories/{category}

| **Method** | `GET` | **Auth** | Bearer + `permission:categories.view` |
|---|---|---|---|

---

### POST /admin/categories

| **Method** | `POST` | **Auth** | Bearer + `permission:categories.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "name": "Mobile Phones", "slug": "mobile-phones", "parent_id": 1,
  "description": "All smartphones", "vat_rate_bp": 0,
  "is_active": true, "seo_title": "...", "seo_description": "...", "seo_keywords": "...",
  "icon_image_id": 10, "banner_image_id": 11
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | 1–255 chars |
| `slug` | string | NO | Auto-generated |
| `parent_id` | integer/null | NO | null = top-level category |
| `description` | string | NO | Max 5000 |
| `vat_rate_bp` | integer/null | NO | null = inherit from parent; 0–10000 basis points |
| `is_active` | boolean | NO | |
| `seo_title` | string | NO | Max 255 |
| `seo_description` | string | NO | Max 500 |
| `seo_keywords` | string | NO | Max 500 |
| `icon_image_id` | integer | NO | Media ID |
| `banner_image_id` | integer | NO | Media ID |

---

### PUT /admin/categories/{category}

| **Method** | `PUT` | **Auth** | Bearer + `permission:categories.update` |
|---|---|---|---|

---

### PUT /admin/categories/{category}/move

Move a category to a different parent.

| **Method** | `PUT` | **Auth** | Bearer + `permission:categories.update` |
|---|---|---|---|

**Request Body:** `{ "parent_id": 5, "position": 2 }`

---

### DELETE /admin/categories/{category}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:categories.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 22. Admin — Catalogue: Option Types

Option types define variant dimensions (e.g., "Color", "Size", "Storage").

### GET /admin/option-types

| **Method** | `GET` | **Auth** | Bearer + `permission:products.view` |
|---|---|---|---|

---

### POST /admin/option-types

| **Method** | `POST` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Request Body:** `{ "name": "Color" }` (unique, max 64 chars)

**Response `201 Created`:** `{ "data": { "id": 1, "name": "Color" } }`

---

### PUT /admin/option-types/{optionType}

| **Method** | `PUT` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Request Body:** `{ "name": "Colour" }`

---

### DELETE /admin/option-types/{optionType}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Response `204 No Content`**

---

## 23. Admin — Catalogue: Products

### GET /admin/products

| **Method** | `GET` | **Auth** | Bearer + `permission:products.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q`, `category_id`, `brand_id`, `status`, `in_stock`

---

### GET /admin/products/{product}

| **Method** | `GET` | **Auth** | Bearer + `permission:products.view` |
|---|---|---|---|

---

### POST /admin/products

Create a new product with variants.

| **Method** | `POST` | **Auth** | Bearer + `permission:products.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "name": "Samsung Galaxy A54",
  "slug": "samsung-galaxy-a54",
  "category_id": 3,
  "brand_id": 1,
  "description": "<p>Full description...</p>",
  "short_description": "Great mid-range phone",
  "status": "active",
  "is_featured": false,
  "is_new_arrival": true,
  "is_best_seller": false,
  "is_trending": false,
  "weight_grams": 202,
  "seo_title": "Samsung Galaxy A54 Price in Bangladesh",
  "seo_description": "...",
  "seo_keywords": "...",
  "image_ids": [99, 100, 101],
  "variants": [
    {
      "sku": "SAM-A54-BLK-128",
      "options": { "Color": "Black", "Storage": "128GB" },
      "price": 4500000,
      "compare_at_price": 5000000,
      "cost_price": 3800000,
      "stock": 50,
      "weight_grams": 202,
      "is_default": true
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | |
| `category_id` | integer | YES | |
| `status` | string | YES | `draft`, `active`, `hidden`, `archived` |
| `variants` | array | YES | At least 1 on create |
| `variants[].sku` | string | YES | Unique |
| `variants[].price` | integer | YES | In poisha |
| `variants[].stock` | integer | YES | Starting stock |
| `variants[].options` | object | NO | `{ "OptionType": "value" }` |
| `variants[].compare_at_price` | integer | NO | Original price |
| `variants[].cost_price` | integer | NO | Internal cost |
| `slug` | string | NO | Auto-generated |
| `brand_id` | integer | NO | |
| `image_ids` | array | NO | Ordered media IDs |
| `is_featured` | boolean | NO | |
| `is_new_arrival` | boolean | NO | |
| `is_best_seller` | boolean | NO | |
| `is_trending` | boolean | NO | |

---

### PUT /admin/products/{product}

| **Method** | `PUT` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Request Body:** Same as POST, all optional.

---

### PATCH /admin/products/{product}/status

Quickly change product status without sending the full product.

| **Method** | `PATCH` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Request Body:** `{ "status": "active" }` — values: `draft`, `active`, `hidden`, `archived`

---

### POST /admin/products/{product}/duplicate

Create a draft copy of an existing product.

| **Method** | `POST` | **Auth** | Bearer + `permission:products.create` |
|---|---|---|---|

**Response `201 Created`:** New product (draft).

---

### PUT /admin/products/{product}/links

Set related, cross-sell, and upsell product links. Each list **replaces** the existing one entirely.

| **Method** | `PUT` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Request Body:**
```json
{ "related": [102, 103], "cross_sell": [105], "upsell": [107] }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `related` | array | NO | Up to 50 product IDs |
| `cross_sell` | array | NO | Up to 50 |
| `upsell` | array | NO | Up to 50 |

---

### DELETE /admin/products/{product}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:products.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

### POST /admin/products/bulk

Apply one action to up to 500 products at once.

| **Method** | `POST` | **Auth** | Bearer + `permission:products.update` |
|---|---|---|---|

**Request Body:**
```json
{ "action": "status", "ids": [101, 102, 103], "status": "active" }
```

**Actions table:**

| `action` | Additional Fields | Notes |
|---|---|---|
| `status` | `status` | `draft`/`active`/`hidden`/`archived` |
| `flag` | `flag`, `value` | `flag` = `featured`/`trending`/`new_arrival`/`best_seller`; `value` = boolean |
| `price` | `mode`, `value` | `mode` = `set`/`increase_percent`/`decrease_percent`/`increase_amount`/`decrease_amount`; `value` in poisha or basis points (percentages) |
| `stock` | `mode`, `value` | `mode` = `set`/`add`; `value` = quantity |
| `delete` | _(none)_ | Soft deletes all |

**Response `200 OK`:** `{ "affected": 3 }`

---

### POST /admin/products/images/bulk

Upload multiple product images at once, matched to products by SKU filename (up to 20 per request).

| **Method** | `POST` | **Auth** | Bearer + `permission:products.update` + `permission:media.upload` | **Content-Type** | `multipart/form-data` |
|---|---|---|---|---|---|

**Request Body:** `files[SKU]: <image file>` — filename must match a variant SKU.

---

### GET /admin/products/export

Export full product catalogue as Excel/CSV.

| **Method** | `GET` | **Auth** | Bearer + `permission:products.export` |
|---|---|---|---|

**Response:** File download.

---

### POST /admin/product-imports

Import products from a CSV or Excel file (background job).

| **Method** | `POST` | **Auth** | Bearer + `permission:products.import` | **Content-Type** | `multipart/form-data` |
|---|---|---|---|---|---|

**Request Body:** `file: <CSV/Excel — max 20MB, up to 20,000 rows>`

**Response `202 Accepted`:** `{ "data": { "import_id": 5, "status": "queued" } }`

---

### GET /admin/product-imports/template

Download the import template file.

| **Method** | `GET` | **Auth** | Bearer + `permission:products.import` |
|---|---|---|---|

---

### GET /admin/product-imports/{productImport}

Check the status of a product import job.

| **Method** | `GET` | **Auth** | Bearer + `permission:products.import` |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": {
    "id": 5, "status": "completed",
    "total_rows": 150, "imported": 148, "failed": 2,
    "errors": [{ "row": 45, "message": "SKU already exists" }]
  }
}
```

---

## 24. Admin — Inventory

### GET /admin/inventory

Paginated list of all product variants with stock levels.

| **Method** | `GET` | **Auth** | Bearer + `permission:inventory.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q`, `low_stock` (boolean), `out_of_stock` (boolean)

---

### GET /admin/inventory/summary

Aggregate inventory statistics.

| **Method** | `GET` | **Auth** | Bearer + `permission:inventory.view` |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": {
    "total_skus": 540, "total_stock_value": 125000000000,
    "low_stock_count": 12, "out_of_stock_count": 5
  }
}
```

---

### GET /admin/inventory/movements

Paginated stock movement history.

| **Method** | `GET` | **Auth** | Bearer + `permission:inventory.view` |
|---|---|---|---|

**Query Parameters:** `page`, `variant_id`, `type` (sale/adjustment/purchase), `from`, `to`

---

### POST /admin/inventory/adjustments

Manually adjust stock — set exact quantity (stocktake) or add/subtract (damage/loss).

| **Method** | `POST` | **Auth** | Bearer + `permission:inventory.adjust` |
|---|---|---|---|

**Request Body:**
```json
{
  "variant_id": 201,
  "mode": "set",
  "quantity": 45,
  "note": "Stocktake 2026-10-01"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `variant_id` | integer | YES | |
| `mode` | string | YES | `set` = exact quantity; `add` = delta (can be negative) |
| `quantity` | integer | YES | For `set`: min 0. For `add`: -1,000,000 to 1,000,000 |
| `note` | string | YES | Reason — stored in movement history, max 500 chars |

---

### GET /admin/inventory/purchases

List all stock purchase receipts.

| **Method** | `GET` | **Auth** | Bearer + `permission:inventory.view` |
|---|---|---|---|

---

### GET /admin/inventory/purchases/{purchase}

Single purchase receipt detail.

| **Method** | `GET` | **Auth** | Bearer + `permission:inventory.view` |
|---|---|---|---|

---

### POST /admin/inventory/purchases

Record a new stock purchase (received goods from supplier).

| **Method** | `POST` | **Auth** | Bearer + `permission:inventory.receive` |
|---|---|---|---|

**Request Body:**
```json
{
  "reference_no": "PO-2026-001",
  "supplier_name": "ABC Trading",
  "received_on": "2026-10-01",
  "note": "Batch shipment",
  "update_cost_price": true,
  "items": [
    { "variant_id": 201, "quantity": 100, "unit_cost": 3800000 }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `reference_no` | string | NO | Max 64 chars |
| `supplier_name` | string | NO | Max 255 chars |
| `received_on` | date | YES | Cannot be in the future |
| `note` | string | NO | Max 1000 chars |
| `update_cost_price` | boolean | NO | If true, updates each variant's cost price |
| `items` | array | YES | 1–200 items |
| `items[].variant_id` | integer | YES | |
| `items[].quantity` | integer | YES | 1–1,000,000 |
| `items[].unit_cost` | integer/null | NO | Cost in poisha |

**Response `201 Created`:** Purchase receipt.

---

## 25. Admin — Shipping Zones

### GET /admin/shipping-zones

| **Method** | `GET` | **Auth** | Bearer + `permission:shipping.view` |
|---|---|---|---|

---

### GET /admin/shipping-zones/{shippingZone}

| **Method** | `GET` | **Auth** | Bearer + `permission:shipping.view` |
|---|---|---|---|

---

### POST /admin/shipping-zones

Create a shipping zone with rate bands.

| **Method** | `POST` | **Auth** | Bearer + `permission:shipping.update` |
|---|---|---|---|

**Request Body:**
```json
{
  "name": "Dhaka City",
  "type": "district",
  "rate_basis": "flat",
  "free_above": 300000,
  "delivery_days_min": 1,
  "delivery_days_max": 2,
  "is_default": false,
  "is_active": true,
  "sort_order": 0,
  "location_ids": [15, 16],
  "rates": [
    { "range_from": 0, "range_to": null, "charge": 6000, "per_extra_kg": null }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | YES | Max 255 |
| `type` | string | NO | `district` or `nationwide` |
| `rate_basis` | string | NO | `flat`, `weight`, `order_value` |
| `free_above` | integer/null | NO | Cart total (poisha) for free shipping |
| `delivery_days_min` | integer/null | NO | 0–365 |
| `delivery_days_max` | integer/null | NO | >= min |
| `is_default` | boolean | NO | One zone can be catch-all default |
| `is_active` | boolean | NO | |
| `location_ids` | array | NO | District IDs (max 100) |
| `rates` | array | YES | 1–50 bands |
| `rates[].range_from` | integer | YES | grams / poisha / 0 for flat |
| `rates[].range_to` | integer/null | NO | null = unbounded |
| `rates[].charge` | integer | YES | Shipping charge in poisha |
| `rates[].per_extra_kg` | integer/null | NO | Extra per kg (weight basis) |

---

### PUT /admin/shipping-zones/{shippingZone}

| **Method** | `PUT` | **Auth** | Bearer + `permission:shipping.update` |
|---|---|---|---|

**Request Body:** Same as POST, all optional.

---

### DELETE /admin/shipping-zones/{shippingZone}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:shipping.update` |
|---|---|---|---|

**Response `204 No Content`**

---

## 26. Admin — Coupons

### GET /admin/coupons

| **Method** | `GET` | **Auth** | Bearer + `permission:discounts.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q`, `is_active`, `type`

---

### GET /admin/coupons/{coupon}

| **Method** | `GET` | **Auth** | Bearer + `permission:discounts.view` |
|---|---|---|---|

---

### POST /admin/coupons

| **Method** | `POST` | **Auth** | Bearer + `permission:discounts.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "code": "WELCOME10",
  "type": "percentage",
  "value": 1000,
  "min_purchase": 100000,
  "max_discount": 50000,
  "starts_at": "2026-10-01T00:00:00",
  "expires_at": "2026-12-31T23:59:59",
  "usage_limit": 500,
  "per_user_limit": 1,
  "is_active": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string | YES | 3–32 chars, alphanumeric/._-, auto-uppercased, unique |
| `type` | string | YES | `percentage` or `fixed` |
| `value` | integer | YES | Basis points for `percentage` (1000=10%, max 10000); poisha for `fixed` |
| `min_purchase` | integer/null | NO | Minimum cart total in poisha |
| `max_discount` | integer/null | NO | Cap on percentage discount |
| `starts_at` | datetime/null | NO | |
| `expires_at` | datetime/null | NO | Must be after `starts_at` |
| `usage_limit` | integer/null | NO | 1–1,000,000 |
| `per_user_limit` | integer/null | NO | 1–1,000 |
| `is_active` | boolean | NO | |

---

### PUT /admin/coupons/{coupon}

| **Method** | `PUT` | **Auth** | Bearer + `permission:discounts.update` |
|---|---|---|---|

---

### DELETE /admin/coupons/{coupon}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:discounts.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 27. Admin — Flash Sales

### GET /admin/flash-sales

| **Method** | `GET` | **Auth** | Bearer + `permission:discounts.view` |
|---|---|---|---|

---

### GET /admin/flash-sales/{flashSale}

| **Method** | `GET` | **Auth** | Bearer + `permission:discounts.view` |
|---|---|---|---|

---

### POST /admin/flash-sales

| **Method** | `POST` | **Auth** | Bearer + `permission:discounts.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "title": "Eid Special Flash Sale",
  "starts_at": "2026-10-10T00:00:00",
  "ends_at": "2026-10-12T23:59:59",
  "is_active": true,
  "items": [
    { "variant_id": 201, "sale_price": 3800000 },
    { "variant_id": 202, "sale_price": 2500000 }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | YES | Max 255 |
| `starts_at` | datetime | YES | |
| `ends_at` | datetime | YES | Must be after `starts_at` |
| `is_active` | boolean | NO | |
| `items` | array | YES | 1–500 items |
| `items[].variant_id` | integer | YES | No duplicates |
| `items[].sale_price` | integer | YES | In poisha |

---

### PUT /admin/flash-sales/{flashSale}

| **Method** | `PUT` | **Auth** | Bearer + `permission:discounts.update` |
|---|---|---|---|

**Note:** `items` fully replaces the item list if provided.

---

### DELETE /admin/flash-sales/{flashSale}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:discounts.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 28. Admin — Orders

### GET /admin/orders

| **Method** | `GET` | **Auth** | Bearer + `permission:orders.view` |
|---|---|---|---|

**Query Parameters:** `page`, `status`, `payment_status`, `q` (search order number/customer), `from`, `to`

---

### GET /admin/orders/{order}

| **Method** | `GET` | **Auth** | Bearer + `permission:orders.view` |
|---|---|---|---|

---

### POST /admin/orders/{order}/status

Move an order to the next status.

| **Method** | `POST` | **Auth** | Bearer + `permission:orders.view` |
|---|---|---|---|

**Request Body:**
```json
{ "status": "shipped", "note": "Dispatched via Pathao, tracking: XYZ123" }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | YES | `pending`/`confirmed`/`processing`/`shipped`/`delivered`/`cancelled`/`refunded` |
| `note` | string | NO | Added to order timeline, max 500 chars |

**Order Status Flow:**
```
pending → confirmed → processing → shipped → delivered
   ↘                                              ↘
 cancelled                                    refunded
```

---

### POST /admin/orders/{order}/payment

Mark an order as paid (cash / bank transfer taken outside the website).

| **Method** | `POST` | **Auth** | Bearer + `permission:orders.update` |
|---|---|---|---|

**Request Body:** `{ "note": "Cash received in store" }` (optional, max 500 chars)

---

### GET /admin/orders/{order}/invoice

Download the order invoice as PDF.

| **Method** | `GET` | **Auth** | Bearer + `permission:orders.view` |
|---|---|---|---|

**Response:** `application/pdf` file download.

---

### GET /admin/orders/{order}/refunds

List all refunds for an order.

| **Method** | `GET` | **Auth** | Bearer + `permission:orders.view` |
|---|---|---|---|

---

### POST /admin/orders/{order}/refunds

Issue a refund for an order.

| **Method** | `POST` | **Auth** | Bearer + `permission:orders.refund` |
|---|---|---|---|

**Request Body:**
```json
{ "amount": 450000, "reason": "Item arrived damaged" }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `amount` | integer | NO | Refund in poisha. Omit to refund remaining balance |
| `reason` | string | YES | Max 500 chars |

**Response `201 Created`:** Refund object.

---

## 29. Admin — Reviews

### GET /admin/reviews

| **Method** | `GET` | **Auth** | Bearer + `permission:reviews.view` |
|---|---|---|---|

**Query Parameters:** `page`, `status` (`pending`/`approved`/`rejected`/`hidden`), `product_id`

---

### GET /admin/reviews/{review}

| **Method** | `GET` | **Auth** | Bearer + `permission:reviews.view` |
|---|---|---|---|

---

### POST /admin/reviews/{review}/approve

Approve a review (makes it visible on storefront).

| **Method** | `POST` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

---

### POST /admin/reviews/{review}/reject

Reject a review.

| **Method** | `POST` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

**Request Body:** `{ "reason": "Contains inappropriate language" }` (optional, max 500 chars)

---

### POST /admin/reviews/{review}/hide

Temporarily hide an approved review.

| **Method** | `POST` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

---

### DELETE /admin/reviews/{review}/hide

Unhide a hidden review.

| **Method** | `DELETE` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

---

### POST /admin/reviews/{review}/feature

Feature a review (highlighted on product page).

| **Method** | `POST` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

---

### DELETE /admin/reviews/{review}/feature

Unfeature a review.

| **Method** | `DELETE` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

---

### PUT /admin/reviews/{review}

Edit review content.

| **Method** | `PUT` | **Auth** | Bearer + `permission:reviews.moderate` |
|---|---|---|---|

**Request Body:** `{ "title": "...", "body": "..." }`

---

### DELETE /admin/reviews/{review}

Permanently delete a review.

| **Method** | `DELETE` | **Auth** | Bearer + `permission:reviews.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 30. Admin — Home Sections

### GET /admin/home-sections

| **Method** | `GET` | **Auth** | Bearer + `permission:storefront.view` |
|---|---|---|---|

---

### GET /admin/home-sections/types

Available home section types.

| **Method** | `GET` | **Auth** | Bearer + `permission:storefront.view` |
|---|---|---|---|

**Response `200 OK`:** Array of `{ type, label, description, needs_category }`.

---

### GET /admin/home-sections/{homeSection}

| **Method** | `GET` | **Auth** | Bearer + `permission:storefront.view` |
|---|---|---|---|

---

### POST /admin/home-sections

| **Method** | `POST` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

**Request Body:**
```json
{
  "type": "featured_products",
  "title": "Our Top Picks",
  "subtitle": "Hand-selected just for you",
  "is_active": true,
  "position": 2,
  "starts_at": null,
  "ends_at": null,
  "settings": {
    "limit": 12,
    "category_id": null,
    "mode": "best_selling"
  },
  "item_ids": []
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | YES | Section type from `GET /admin/home-sections/types` |
| `title` | string | NO | Max 255 |
| `subtitle` | string | NO | Max 500 |
| `is_active` | boolean | NO | |
| `position` | integer | NO | 0–1000 |
| `starts_at` | datetime/null | NO | |
| `ends_at` | datetime/null | NO | |
| `settings.limit` | integer | NO | 1–48 items to show |
| `settings.category_id` | integer | NO | Required for category-based sections |
| `settings.mode` | string | NO | `latest`/`best_selling`/`popular`/`rating`/`discounted` |
| `item_ids` | array | NO | Hand-picked IDs for manual sections (max 48) |

---

### PUT /admin/home-sections/reorder

Set display order of all sections in one call.

| **Method** | `PUT` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

**Request Body:** `{ "ids": [3, 1, 5, 2, 4] }`

---

### PUT /admin/home-sections/{homeSection}

| **Method** | `PUT` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

---

### DELETE /admin/home-sections/{homeSection}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

**Response `204 No Content`**

---

## 31. Admin — Banners

### GET /admin/banners

| **Method** | `GET` | **Auth** | Bearer + `permission:storefront.view` |
|---|---|---|---|

---

### POST /admin/banners

Upload image via `POST /admin/media` first, then pass the `image_id`.

| **Method** | `POST` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

**Request Body:**
```json
{
  "type": "hero",
  "title": "Eid Special Collection",
  "subtitle": "Up to 50% off",
  "button_label": "Shop Now",
  "link_url": "https://example.com/eid-sale",
  "is_active": true,
  "position": 1,
  "starts_at": "2026-10-01T00:00:00",
  "ends_at": "2026-10-15T23:59:59",
  "image_id": 99,
  "mobile_image_id": 100
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `image_id` | integer | YES | Media ID of desktop image |
| `type` | string | NO | Banner type |
| `title` | string | NO | Max 255 |
| `subtitle` | string | NO | Max 500 |
| `button_label` | string | NO | Max 64 |
| `link_url` | string | NO | Valid URL, max 2048 |
| `is_active` | boolean | NO | |
| `position` | integer | NO | 0–1000 |
| `starts_at` | datetime/null | NO | |
| `ends_at` | datetime/null | NO | |
| `mobile_image_id` | integer | NO | Mobile-optimised image |

---

### PUT /admin/banners/{banner}

| **Method** | `PUT` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

---

### DELETE /admin/banners/{banner}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:storefront.update` |
|---|---|---|---|

**Response `204 No Content`**

---

## 32. Admin — Pages

### GET /admin/pages

| **Method** | `GET` | **Auth** | Bearer + `permission:content.view` |
|---|---|---|---|

---

### GET /admin/pages/{page}

| **Method** | `GET` | **Auth** | Bearer + `permission:content.view` |
|---|---|---|---|

---

### POST /admin/pages

| **Method** | `POST` | **Auth** | Bearer + `permission:content.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "title": "Privacy Policy",
  "slug": "privacy-policy",
  "content": "<p>Your privacy matters...</p>",
  "is_active": true,
  "seo_title": "Privacy Policy | Shino Bangla",
  "seo_description": "Read our privacy policy..."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | YES | Max 255 |
| `slug` | string | NO | Auto-generated; unique, alphanumeric + dashes |
| `content` | string | NO | HTML, max 200,000 chars |
| `is_active` | boolean | NO | |
| `seo_title` | string | NO | Max 255 |
| `seo_description` | string | NO | Max 500 |

---

### PUT /admin/pages/{page}

| **Method** | `PUT` | **Auth** | Bearer + `permission:content.update` |
|---|---|---|---|

---

### DELETE /admin/pages/{page}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:content.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 33. Admin — FAQs

### GET /admin/faqs

| **Method** | `GET` | **Auth** | Bearer + `permission:content.view` |
|---|---|---|---|

---

### POST /admin/faqs

| **Method** | `POST` | **Auth** | Bearer + `permission:content.create` |
|---|---|---|---|

**Request Body:**
```json
{
  "question": "How do I track my order?",
  "answer": "You can track your order by...",
  "group": "Shipping",
  "is_active": true,
  "position": 1
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `question` | string | YES | Max 500 |
| `answer` | string | YES | Max 20,000 |
| `group` | string | NO | Category label, max 64 |
| `is_active` | boolean | NO | |
| `position` | integer | NO | 0–1000 |

---

### PUT /admin/faqs/{faq}

| **Method** | `PUT` | **Auth** | Bearer + `permission:content.update` |
|---|---|---|---|

---

### DELETE /admin/faqs/{faq}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:content.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 34. Admin — Contact Messages

### GET /admin/contact-messages

| **Method** | `GET` | **Auth** | Bearer + `permission:content.view` |
|---|---|---|---|

**Query Parameters:** `page`, `replied` (boolean)

---

### GET /admin/contact-messages/{contactMessage}

| **Method** | `GET` | **Auth** | Bearer + `permission:content.view` |
|---|---|---|---|

---

### POST /admin/contact-messages/{contactMessage}/replied

Mark a message as replied.

| **Method** | `POST` | **Auth** | Bearer + `permission:content.update` |
|---|---|---|---|

**Response `200 OK`:** Updated message with `replied_at` timestamp.

---

### DELETE /admin/contact-messages/{contactMessage}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:content.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 35. Admin — Newsletter

### GET /admin/newsletter/subscribers

| **Method** | `GET` | **Auth** | Bearer + `permission:marketing.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q`

---

### GET /admin/newsletter/campaigns

| **Method** | `GET` | **Auth** | Bearer + `permission:marketing.view` |
|---|---|---|---|

---

### GET /admin/newsletter/campaigns/{campaign}

| **Method** | `GET` | **Auth** | Bearer + `permission:marketing.view` |
|---|---|---|---|

---

### POST /admin/newsletter/campaigns

Create a new campaign. Omit `scheduled_at` to save as draft.

| **Method** | `POST` | **Auth** | Bearer + `permission:marketing.update` |
|---|---|---|---|

**Request Body:**
```json
{
  "subject": "Eid Mubarak! Up to 50% off",
  "body": "<html>Full email content...</html>",
  "scheduled_at": "2026-10-05T09:00:00"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `subject` | string | YES | Max 255 |
| `body` | string | YES | HTML, max 100,000 chars |
| `scheduled_at` | datetime/null | NO | Must be in the future |

---

### PUT /admin/newsletter/campaigns/{campaign}

| **Method** | `PUT` | **Auth** | Bearer + `permission:marketing.update` |
|---|---|---|---|

---

### POST /admin/newsletter/campaigns/{campaign}/send

Send a campaign immediately to all subscribers.

| **Method** | `POST` | **Auth** | Bearer + `permission:marketing.update` |
|---|---|---|---|

**Response `202 Accepted`:** `{ "message": "Campaign queued for sending." }`

---

### DELETE /admin/newsletter/campaigns/{campaign}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:marketing.update` |
|---|---|---|---|

**Response `204 No Content`**

---

## 36. Admin — Dashboard & Reports

### GET /admin/dashboard

| **Method** | `GET` | **Auth** | Bearer + `permission:dashboard.view` |
|---|---|---|---|

**Response `200 OK`:**
```json
{
  "data": {
    "today": { "orders": 14, "revenue": 5200000, "new_customers": 3 },
    "this_month": { "orders": 280, "revenue": 102000000 },
    "top_products": [],
    "recent_orders": []
  }
}
```

---

### GET /admin/reports

List all available report types.

| **Method** | `GET` | **Auth** | Bearer + `permission:reports.view` |
|---|---|---|---|

**Response `200 OK`:** Array of `{ type, name, description }`.

---

### GET /admin/reports/{type}

Get report data as JSON for charts/tables.

| **Method** | `GET` | **Auth** | Bearer + `permission:reports.view` |
|---|---|---|---|

**URL Param** `{type}`: `sales`, `products`, `customers`, `inventory`, etc.

**Query Parameters:** `from`, `to`, `status`, `group_by` (`day`/`week`/`month`)

---

### POST /admin/reports/{type}/exports

Request an async export of a report as a file.

| **Method** | `POST` | **Auth** | Bearer + `permission:reports.export` |
|---|---|---|---|

**Request Body:**
```json
{
  "format": "xlsx",
  "from": "2026-09-01",
  "to": "2026-09-30",
  "status": "delivered"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `format` | string | NO | `xlsx` (default), `csv`, `pdf` |
| `from` | date | NO | |
| `to` | date | NO | >= `from` |
| `status` | string | NO | Max 32 chars |

**Response `202 Accepted`:** `{ "data": { "export_id": 7, "status": "queued" } }`

---

### GET /admin/report-exports

List all requested exports with their status.

| **Method** | `GET` | **Auth** | Bearer + `permission:reports.export` |
|---|---|---|---|

---

### GET /admin/report-exports/{reportExport}/download

Download a completed report file.

| **Method** | `GET` | **Auth** | Bearer + `permission:reports.export` |
|---|---|---|---|

**Response:** File download (xlsx/csv/pdf).

---

## 37. Admin — Activity Log

### GET /admin/activity-log

Paginated audit trail of all actions on the platform.

| **Method** | `GET` | **Auth** | Bearer + `permission:activity-log.view` |
|---|---|---|---|

**Query Parameters:** `page`, `type`, `user_id`, `from`, `to`

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1001, "event": "order_status_changed",
      "description": "Order status changed to shipped",
      "causer": { "id": 3, "name": "Karim Ali" },
      "subject_type": "order", "subject_id": 55,
      "properties": { "from": "confirmed", "to": "shipped" },
      "created_at": "2026-10-01T10:00:00+00:00"
    }
  ],
  "links": {}, "meta": {}
}
```

---

### GET /admin/activity-log/{type}/{id}

All log entries for a specific resource.

| **Method** | `GET` | **Auth** | Bearer + `permission:activity-log.view` |
|---|---|---|---|

**URL Params:** `{type}` (e.g. `order`, `product`, `user`), `{id}` (numeric)

---

## 38. Admin — Customers

### GET /admin/customers

| **Method** | `GET` | **Auth** | Bearer + `permission:customers.view` |
|---|---|---|---|

**Query Parameters:** `page`, `q` (name/email/phone), `is_active`

---

### GET /admin/customers/{customer}

| **Method** | `GET` | **Auth** | Bearer + `permission:customers.view` |
|---|---|---|---|

---

### PUT /admin/customers/{customer}

Staff may update name and active status only. Email, phone, and password belong to the customer — staff cannot change those.

| **Method** | `PUT` | **Auth** | Bearer + `permission:customers.update` |
|---|---|---|---|

**Request Body:**
```json
{ "name": "Rahim Uddin Ahmed", "is_active": false }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | NO | Max 255 |
| `is_active` | boolean | NO | Deactivating blocks login |

---

### DELETE /admin/customers/{customer}

| **Method** | `DELETE` | **Auth** | Bearer + `permission:customers.delete` |
|---|---|---|---|

**Response `204 No Content`**

---

## 39. Error Codes Reference

All errors use the standard envelope: `{ message, code, request_id, errors? }`. Branch UI state on `code`.

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Request body failed validation |
| `UNAUTHENTICATED` | 401 | Missing or expired bearer token |
| `ACCOUNT_INACTIVE` | 403 | Account has been deactivated |
| `ACCOUNT_NOT_VERIFIED` | 403 | Correct password but OTP not verified yet |
| `FORBIDDEN` | 403 | Authenticated but missing required permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `OTP_INVALID` | 422 | Wrong OTP code entered |
| `OTP_EXPIRED` | 422 | Code has expired |
| `OTP_ATTEMPTS_EXCEEDED` | 422 | 5 wrong tries — code voided, request a new one |
| `OTP_COOLDOWN` | 429 | Code sent too recently — check `Retry-After` header |
| `COUPON_INVALID` | 422 | Coupon does not exist or is inactive |
| `COUPON_EXPIRED` | 422 | Coupon past its expiry date |
| `COUPON_USAGE_LIMIT` | 422 | Total uses exhausted |
| `COUPON_PER_USER_LIMIT` | 422 | This customer has used it too many times |
| `COUPON_MIN_PURCHASE` | 422 | Cart total below coupon minimum |
| `INSUFFICIENT_STOCK` | 409 | One or more items out of stock at checkout |
| `CART_EMPTY` | 422 | Cannot checkout with empty cart |
| `ORDER_NOT_FOUND` | 404 | Order number + phone pair doesn't match any order |
| `ORDER_CANNOT_CANCEL` | 422 | Order is in a state that cannot be cancelled |
| `ORDER_ALREADY_PAID` | 409 | Trying to pay an already-paid order |
| `PAYMENT_FAILED` | 422 | Gateway declined the payment |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests — check `Retry-After` header |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 40. Permissions Reference

| Permission | What it grants |
|---|---|
| `dashboard.view` | View dashboard metrics |
| `reports.view` | View report data |
| `reports.export` | Download report exports |
| `orders.view` | View orders |
| `orders.update` | Update order details, mark paid |
| `orders.refund` | Issue refunds |
| `products.view` | View products |
| `products.create` | Create products |
| `products.update` | Edit products, status, links, bulk actions |
| `products.delete` | Delete products |
| `products.export` | Export product catalogue |
| `products.import` | Import products from file |
| `categories.view` | View categories |
| `categories.create` | Create categories |
| `categories.update` | Edit/move categories |
| `categories.delete` | Delete categories |
| `brands.view` | View brands |
| `brands.create` | Create brands |
| `brands.update` | Edit brands |
| `brands.delete` | Delete brands |
| `inventory.view` | View stock and movement history |
| `inventory.adjust` | Manually adjust stock |
| `inventory.receive` | Record stock purchases |
| `shipping.view` | View shipping zones |
| `shipping.update` | Create/edit/delete zones |
| `discounts.view` | View coupons and flash sales |
| `discounts.create` | Create discounts |
| `discounts.update` | Edit discounts |
| `discounts.delete` | Delete discounts |
| `reviews.view` | View reviews moderation queue |
| `reviews.moderate` | Approve/reject/hide/feature reviews |
| `reviews.delete` | Permanently delete reviews |
| `customers.view` | View customer profiles |
| `customers.update` | Update customer name/status |
| `customers.delete` | Delete customer accounts |
| `staff.view` | View staff accounts |
| `staff.create` | Create staff accounts |
| `staff.update` | Edit staff details |
| `staff.delete` | Delete staff accounts |
| `roles.view` | View roles and permissions |
| `roles.create` | Create custom roles |
| `roles.update` | Edit roles |
| `roles.delete` | Delete roles |
| `roles.assign` | Assign/change a staff member's role |
| `settings.view` | View store settings |
| `settings.update` | Update store settings |
| `media.upload` | Upload media files |
| `media.delete` | Delete media files |
| `storefront.view` | View home sections and banners |
| `storefront.update` | Edit home sections and banners |
| `content.view` | View pages, FAQs, contact messages |
| `content.create` | Create pages and FAQs |
| `content.update` | Edit pages, FAQs, mark messages replied |
| `content.delete` | Delete pages, FAQs, messages |
| `marketing.view` | View newsletter subscribers and campaigns |
| `marketing.update` | Create/edit/send campaigns |
| `activity-log.view` | View audit trail |

---

*Generated from source — routes, controllers, request classes, and resources — on 2026-10-01.*
