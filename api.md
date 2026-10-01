# API reference

Every endpoint of the ecommerce API, with the fields it accepts, the rules each field must
pass, and a real request and response. The examples were captured on 2026-10-01 by running
the whole Postman collection against the demo data, so ids, numbers, dates and URLs will
differ on your server. Endpoints are grouped as in the README.

## Conventions

- **Base URL**: `https://<api domain>/api/v1`. Locally `http://localhost:8000/api/v1`.
- **Headers**: send `Accept: application/json` on every request and `Content-Type: application/json`
  with a JSON body. Uploads are `multipart/form-data`.
- **Signing in**: `Authorization: Bearer <token>`, using the token from login. "Auth: token" below
  means it is required; "optional" means the endpoint also works for visitors.
- **Visitor carts**: send `X-Cart-Token` (from the first `POST /cart/items`) on every cart call.
- **Money** is an integer number of poisha (`125000` = ৳1,250.00). **Rates** are basis points
  (`1500` = 15%).
- **Pagination**: list endpoints marked _paginated_ take `page` (from 1) and `per_page` (default 25,
  at most 100) and answer `{data, links, meta}`; `meta.last_page` and `links.next` say when to stop.
- **Errors** always look like `{message, code, request_id, errors?}`. Branch on `code`; `errors`
  appears on `422 VALIDATION_FAILED`, keyed by field. Every `code` is listed in the README.
- **Required** column: "Yes" must be sent; "No" may be left out; a condition says when it is needed.
  A nested field such as `address.line1` marked "Yes" is required whenever its parent is sent.
  On `PUT` and `PATCH`, send only the fields you are changing unless a field says otherwise.

## Contents

- **Signing in and your own account**
  - [`POST /api/v1/auth/register`](#post-auth-register)
  - [`POST /api/v1/auth/otp/verify`](#post-auth-otp-verify)
  - [`POST /api/v1/auth/otp/resend`](#post-auth-otp-resend)
  - [`POST /api/v1/auth/login`](#post-auth-login)
  - [`POST /api/v1/auth/google`](#post-auth-google)
  - [`POST /api/v1/auth/forgot-password`](#post-auth-forgot-password)
  - [`POST /api/v1/auth/reset-password`](#post-auth-reset-password)
  - [`POST /api/v1/auth/logout`](#post-auth-logout)
  - [`POST /api/v1/auth/logout-all`](#post-auth-logout-all)
  - [`PUT /api/v1/auth/password`](#put-auth-password)
  - [`GET /api/v1/auth/tokens`](#get-auth-tokens)
  - [`DELETE /api/v1/auth/tokens/{token}`](#delete-auth-tokens-token)
  - [`GET /api/v1/me`](#get-me)
  - [`PUT /api/v1/me`](#put-me)
  - [`POST /api/v1/me/contact`](#post-me-contact)
  - [`POST /api/v1/me/contact/verify`](#post-me-contact-verify)
- **Customer endpoints (the storefront) · The catalogue and store content**
  - [`GET /api/v1/health`](#get-health)
  - [`GET /api/v1/settings`](#get-settings)
  - [`GET /api/v1/home`](#get-home)
  - [`GET /api/v1/categories`](#get-categories)
  - [`GET /api/v1/categories/{slug}`](#get-categories-slug)
  - [`GET /api/v1/brands`](#get-brands)
  - [`GET /api/v1/brands/{slug}`](#get-brands-slug)
  - [`GET /api/v1/products`](#get-products)
  - [`GET /api/v1/products/facets`](#get-products-facets)
  - [`GET /api/v1/products/suggest`](#get-products-suggest)
  - [`GET /api/v1/products/{slug}`](#get-products-slug)
  - [`GET /api/v1/products/{slug}/related`](#get-products-slug-related)
  - [`GET /api/v1/products/{slug}/reviews`](#get-products-slug-reviews)
  - [`GET /api/v1/locations`](#get-locations)
  - [`GET /api/v1/shipping/zones`](#get-shipping-zones)
  - [`GET /api/v1/pages`](#get-pages)
  - [`GET /api/v1/pages/{slug}`](#get-pages-slug)
  - [`GET /api/v1/faqs`](#get-faqs)
  - [`GET /api/v1/sitemap`](#get-sitemap)
  - [`POST /api/v1/contact`](#post-contact)
  - [`POST /api/v1/newsletter/subscribe`](#post-newsletter-subscribe)
  - [`POST /api/v1/newsletter/unsubscribe`](#post-newsletter-unsubscribe)
  - [`POST /api/v1/track/view`](#post-track-view)
- **Customer endpoints (the storefront) · Cart, checkout and payment**
  - [`GET /api/v1/cart`](#get-cart)
  - [`POST /api/v1/cart/items`](#post-cart-items)
  - [`PATCH /api/v1/cart/items/{item}`](#patch-cart-items-item)
  - [`DELETE /api/v1/cart/items/{item}`](#delete-cart-items-item)
  - [`PUT /api/v1/cart/coupon`](#put-cart-coupon)
  - [`DELETE /api/v1/cart/coupon`](#delete-cart-coupon)
  - [`POST /api/v1/cart/claim`](#post-cart-claim)
  - [`POST /api/v1/checkout/quote`](#post-checkout-quote)
  - [`POST /api/v1/checkout`](#post-checkout)
  - [`POST /api/v1/buy-now/quote`](#post-buy-now-quote)
  - [`POST /api/v1/buy-now`](#post-buy-now)
  - [`GET /api/v1/orders/track`](#get-orders-track)
  - [`POST /api/v1/orders/{number}/pay`](#post-orders-number-pay)
  - [`POST /api/v1/payments/sslcommerz/success`](#post-payments-sslcommerz-success)
  - [`POST /api/v1/payments/sslcommerz/fail`](#post-payments-sslcommerz-fail)
  - [`POST /api/v1/payments/sslcommerz/cancel`](#post-payments-sslcommerz-cancel)
  - [`POST /api/v1/payments/sslcommerz/ipn`](#post-payments-sslcommerz-ipn)
- **Customer endpoints (the storefront) · The customer's account**
  - [`GET /api/v1/me/addresses`](#get-me-addresses)
  - [`POST /api/v1/me/addresses`](#post-me-addresses)
  - [`PUT /api/v1/me/addresses/{address}`](#put-me-addresses-address)
  - [`DELETE /api/v1/me/addresses/{address}`](#delete-me-addresses-address)
  - [`GET /api/v1/me/wishlist`](#get-me-wishlist)
  - [`POST /api/v1/me/wishlist`](#post-me-wishlist)
  - [`DELETE /api/v1/me/wishlist/{product}`](#delete-me-wishlist-product)
  - [`GET /api/v1/me/recently-viewed`](#get-me-recently-viewed)
  - [`POST /api/v1/me/recently-viewed`](#post-me-recently-viewed)
  - [`GET /api/v1/me/orders`](#get-me-orders)
  - [`GET /api/v1/me/orders/{number}`](#get-me-orders-number)
  - [`POST /api/v1/me/orders/{number}/cancel`](#post-me-orders-number-cancel)
  - [`GET /api/v1/me/orders/{number}/invoice`](#get-me-orders-number-invoice)
  - [`GET /api/v1/me/reviewable-items`](#get-me-reviewable-items)
  - [`GET /api/v1/me/reviews`](#get-me-reviews)
  - [`POST /api/v1/me/reviews`](#post-me-reviews)
  - [`POST /api/v1/me/reviews/photos`](#post-me-reviews-photos)
  - [`PUT /api/v1/me/reviews/{review}`](#put-me-reviews-review)
  - [`DELETE /api/v1/me/reviews/{review}`](#delete-me-reviews-review)
- **Admin endpoints (the back office) · Roles and staff**
  - [`GET /api/v1/permissions`](#get-permissions)
  - [`GET /api/v1/roles`](#get-roles)
  - [`GET /api/v1/roles/{role}`](#get-roles-role)
  - [`POST /api/v1/roles`](#post-roles)
  - [`PUT /api/v1/roles/{role}`](#put-roles-role)
  - [`DELETE /api/v1/roles/{role}`](#delete-roles-role)
  - [`GET /api/v1/staff`](#get-staff)
  - [`GET /api/v1/staff/{staff}`](#get-staff-staff)
  - [`POST /api/v1/staff`](#post-staff)
  - [`PUT /api/v1/staff/{staff}`](#put-staff-staff)
  - [`DELETE /api/v1/staff/{staff}`](#delete-staff-staff)
- **Admin endpoints (the back office) · Dashboard, reports and the activity log**
  - [`GET /api/v1/admin/dashboard`](#get-admin-dashboard)
  - [`GET /api/v1/admin/reports`](#get-admin-reports)
  - [`GET /api/v1/admin/reports/{type}`](#get-admin-reports-type)
  - [`POST /api/v1/admin/reports/{type}/exports`](#post-admin-reports-type-exports)
  - [`GET /api/v1/admin/report-exports`](#get-admin-report-exports)
  - [`GET /api/v1/admin/report-exports/{reportExport}/download`](#get-admin-report-exports-reportexport-download)
  - [`GET /api/v1/admin/activity-log`](#get-admin-activity-log)
  - [`GET /api/v1/admin/activity-log/{type}/{id}`](#get-admin-activity-log-type-id)
- **Admin endpoints (the back office) · Store settings and media**
  - [`GET /api/v1/admin/settings`](#get-admin-settings)
  - [`PUT /api/v1/admin/settings`](#put-admin-settings)
  - [`POST /api/v1/admin/settings/assets/{asset}`](#post-admin-settings-assets-asset)
  - [`POST /api/v1/admin/media`](#post-admin-media)
  - [`DELETE /api/v1/admin/media/{media}`](#delete-admin-media-media)
- **Admin endpoints (the back office) · Catalogue**
  - [`GET /api/v1/admin/brands`](#get-admin-brands)
  - [`GET /api/v1/admin/brands/{brand}`](#get-admin-brands-brand)
  - [`POST /api/v1/admin/brands`](#post-admin-brands)
  - [`PUT /api/v1/admin/brands/{brand}`](#put-admin-brands-brand)
  - [`DELETE /api/v1/admin/brands/{brand}`](#delete-admin-brands-brand)
  - [`GET /api/v1/admin/categories`](#get-admin-categories)
  - [`GET /api/v1/admin/categories/{category}`](#get-admin-categories-category)
  - [`POST /api/v1/admin/categories`](#post-admin-categories)
  - [`PUT /api/v1/admin/categories/{category}`](#put-admin-categories-category)
  - [`PUT /api/v1/admin/categories/{category}/move`](#put-admin-categories-category-move)
  - [`DELETE /api/v1/admin/categories/{category}`](#delete-admin-categories-category)
  - [`GET /api/v1/admin/option-types`](#get-admin-option-types)
  - [`POST /api/v1/admin/option-types`](#post-admin-option-types)
  - [`PUT /api/v1/admin/option-types/{optionType}`](#put-admin-option-types-optiontype)
  - [`DELETE /api/v1/admin/option-types/{optionType}`](#delete-admin-option-types-optiontype)
  - [`GET /api/v1/admin/products`](#get-admin-products)
  - [`GET /api/v1/admin/products/{product}`](#get-admin-products-product)
  - [`POST /api/v1/admin/products`](#post-admin-products)
  - [`PUT /api/v1/admin/products/{product}`](#put-admin-products-product)
  - [`PATCH /api/v1/admin/products/{product}/status`](#patch-admin-products-product-status)
  - [`POST /api/v1/admin/products/{product}/duplicate`](#post-admin-products-product-duplicate)
  - [`PUT /api/v1/admin/products/{product}/links`](#put-admin-products-product-links)
  - [`DELETE /api/v1/admin/products/{product}`](#delete-admin-products-product)
  - [`POST /api/v1/admin/products/bulk`](#post-admin-products-bulk)
  - [`POST /api/v1/admin/products/images/bulk`](#post-admin-products-images-bulk)
  - [`GET /api/v1/admin/products/export`](#get-admin-products-export)
  - [`POST /api/v1/admin/product-imports`](#post-admin-product-imports)
  - [`GET /api/v1/admin/product-imports/template`](#get-admin-product-imports-template)
  - [`GET /api/v1/admin/product-imports/{productImport}`](#get-admin-product-imports-productimport)
- **Admin endpoints (the back office) · Inventory**
  - [`GET /api/v1/admin/inventory`](#get-admin-inventory)
  - [`GET /api/v1/admin/inventory/summary`](#get-admin-inventory-summary)
  - [`GET /api/v1/admin/inventory/movements`](#get-admin-inventory-movements)
  - [`POST /api/v1/admin/inventory/adjustments`](#post-admin-inventory-adjustments)
  - [`GET /api/v1/admin/inventory/purchases`](#get-admin-inventory-purchases)
  - [`GET /api/v1/admin/inventory/purchases/{purchase}`](#get-admin-inventory-purchases-purchase)
  - [`POST /api/v1/admin/inventory/purchases`](#post-admin-inventory-purchases)
- **Admin endpoints (the back office) · Orders and customers**
  - [`GET /api/v1/admin/orders`](#get-admin-orders)
  - [`GET /api/v1/admin/orders/{order}`](#get-admin-orders-order)
  - [`POST /api/v1/admin/orders/{order}/status`](#post-admin-orders-order-status)
  - [`POST /api/v1/admin/orders/{order}/payment`](#post-admin-orders-order-payment)
  - [`GET /api/v1/admin/orders/{order}/invoice`](#get-admin-orders-order-invoice)
  - [`GET /api/v1/admin/orders/{order}/refunds`](#get-admin-orders-order-refunds)
  - [`POST /api/v1/admin/orders/{order}/refunds`](#post-admin-orders-order-refunds)
  - [`GET /api/v1/admin/customers`](#get-admin-customers)
  - [`GET /api/v1/admin/customers/{customer}`](#get-admin-customers-customer)
  - [`PUT /api/v1/admin/customers/{customer}`](#put-admin-customers-customer)
  - [`DELETE /api/v1/admin/customers/{customer}`](#delete-admin-customers-customer)
- **Admin endpoints (the back office) · Shipping and discounts**
  - [`GET /api/v1/admin/shipping-zones`](#get-admin-shipping-zones)
  - [`GET /api/v1/admin/shipping-zones/{shippingZone}`](#get-admin-shipping-zones-shippingzone)
  - [`POST /api/v1/admin/shipping-zones`](#post-admin-shipping-zones)
  - [`PUT /api/v1/admin/shipping-zones/{shippingZone}`](#put-admin-shipping-zones-shippingzone)
  - [`DELETE /api/v1/admin/shipping-zones/{shippingZone}`](#delete-admin-shipping-zones-shippingzone)
  - [`GET /api/v1/admin/coupons`](#get-admin-coupons)
  - [`GET /api/v1/admin/coupons/{coupon}`](#get-admin-coupons-coupon)
  - [`POST /api/v1/admin/coupons`](#post-admin-coupons)
  - [`PUT /api/v1/admin/coupons/{coupon}`](#put-admin-coupons-coupon)
  - [`DELETE /api/v1/admin/coupons/{coupon}`](#delete-admin-coupons-coupon)
  - [`GET /api/v1/admin/flash-sales`](#get-admin-flash-sales)
  - [`GET /api/v1/admin/flash-sales/{flashSale}`](#get-admin-flash-sales-flashsale)
  - [`POST /api/v1/admin/flash-sales`](#post-admin-flash-sales)
  - [`PUT /api/v1/admin/flash-sales/{flashSale}`](#put-admin-flash-sales-flashsale)
  - [`DELETE /api/v1/admin/flash-sales/{flashSale}`](#delete-admin-flash-sales-flashsale)
- **Admin endpoints (the back office) · Reviews**
  - [`GET /api/v1/admin/reviews`](#get-admin-reviews)
  - [`GET /api/v1/admin/reviews/{review}`](#get-admin-reviews-review)
  - [`POST /api/v1/admin/reviews/{review}/approve`](#post-admin-reviews-review-approve)
  - [`POST /api/v1/admin/reviews/{review}/reject`](#post-admin-reviews-review-reject)
  - [`POST /api/v1/admin/reviews/{review}/hide`](#post-admin-reviews-review-hide)
  - [`DELETE /api/v1/admin/reviews/{review}/hide`](#delete-admin-reviews-review-hide)
  - [`POST /api/v1/admin/reviews/{review}/feature`](#post-admin-reviews-review-feature)
  - [`DELETE /api/v1/admin/reviews/{review}/feature`](#delete-admin-reviews-review-feature)
  - [`PUT /api/v1/admin/reviews/{review}`](#put-admin-reviews-review)
  - [`DELETE /api/v1/admin/reviews/{review}`](#delete-admin-reviews-review)
- **Admin endpoints (the back office) · Home page and banners**
  - [`GET /api/v1/admin/home-sections`](#get-admin-home-sections)
  - [`GET /api/v1/admin/home-sections/types`](#get-admin-home-sections-types)
  - [`GET /api/v1/admin/home-sections/{homeSection}`](#get-admin-home-sections-homesection)
  - [`POST /api/v1/admin/home-sections`](#post-admin-home-sections)
  - [`PUT /api/v1/admin/home-sections/reorder`](#put-admin-home-sections-reorder)
  - [`PUT /api/v1/admin/home-sections/{homeSection}`](#put-admin-home-sections-homesection)
  - [`DELETE /api/v1/admin/home-sections/{homeSection}`](#delete-admin-home-sections-homesection)
  - [`GET /api/v1/admin/banners`](#get-admin-banners)
  - [`POST /api/v1/admin/banners`](#post-admin-banners)
  - [`PUT /api/v1/admin/banners/{banner}`](#put-admin-banners-banner)
  - [`DELETE /api/v1/admin/banners/{banner}`](#delete-admin-banners-banner)
- **Admin endpoints (the back office) · Pages, FAQs and the inbox**
  - [`GET /api/v1/admin/pages`](#get-admin-pages)
  - [`GET /api/v1/admin/pages/{page}`](#get-admin-pages-page)
  - [`POST /api/v1/admin/pages`](#post-admin-pages)
  - [`PUT /api/v1/admin/pages/{page}`](#put-admin-pages-page)
  - [`DELETE /api/v1/admin/pages/{page}`](#delete-admin-pages-page)
  - [`GET /api/v1/admin/faqs`](#get-admin-faqs)
  - [`POST /api/v1/admin/faqs`](#post-admin-faqs)
  - [`PUT /api/v1/admin/faqs/{faq}`](#put-admin-faqs-faq)
  - [`DELETE /api/v1/admin/faqs/{faq}`](#delete-admin-faqs-faq)
  - [`GET /api/v1/admin/contact-messages`](#get-admin-contact-messages)
  - [`GET /api/v1/admin/contact-messages/{contactMessage}`](#get-admin-contact-messages-contactmessage)
  - [`POST /api/v1/admin/contact-messages/{contactMessage}/replied`](#post-admin-contact-messages-contactmessage-replied)
  - [`DELETE /api/v1/admin/contact-messages/{contactMessage}`](#delete-admin-contact-messages-contactmessage)
- **Admin endpoints (the back office) · Newsletter**
  - [`GET /api/v1/admin/newsletter/subscribers`](#get-admin-newsletter-subscribers)
  - [`GET /api/v1/admin/newsletter/campaigns`](#get-admin-newsletter-campaigns)
  - [`GET /api/v1/admin/newsletter/campaigns/{campaign}`](#get-admin-newsletter-campaigns-campaign)
  - [`POST /api/v1/admin/newsletter/campaigns`](#post-admin-newsletter-campaigns)
  - [`PUT /api/v1/admin/newsletter/campaigns/{campaign}`](#put-admin-newsletter-campaigns-campaign)
  - [`DELETE /api/v1/admin/newsletter/campaigns/{campaign}`](#delete-admin-newsletter-campaigns-campaign)
  - [`POST /api/v1/admin/newsletter/campaigns/{campaign}/send`](#post-admin-newsletter-campaigns-campaign-send)


## Signing in and your own account

---

<a id="post-auth-register"></a>

### `POST /api/v1/auth/register`

Create a shopper account; sends a code (`202`).

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |
| `password` | Yes | String, send `password_confirmation` with the same value, 12+ characters with upper and lower case, a number and a symbol |

**Example**

```http
POST /api/v1/auth/register
```
```json
{
  "name": "New Shopper",
  "login": "01911111111",
  "password": "Demo-Password-1!",
  "password_confirmation": "Demo-Password-1!"
}
```

Response `202`
```json
{
  "message": "We have sent you a code to verify your account.",
  "data": {
    "verification": {
      "channel": "phone",
      "destination": "+88019*****111",
      "expires_in_minutes": 5
    }
  }
}
```

<sub>End of `POST /api/v1/auth/register` · [back to contents](#contents)</sub>

---

<a id="post-auth-otp-verify"></a>

### `POST /api/v1/auth/otp/verify`

Confirm the account with its code; returns a token.

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |
| `code` | Yes | String, 6 digits |
| `device_name` | No | String, up to 255 characters, may be `null` |

**Example**

```http
POST /api/v1/auth/otp/verify
```
```json
{
  "login": "01911111111",
  "code": "123456",
  "purpose": "verify"
}
```

Response `200`
```json
{
  "data": {
    "token": {
      "token": "2|ecom_iVxuYUuEfzHeZZ1Oko2wpE9SmZ6UjjwBakMaB9rk7988e3c9",
      "token_type": "Bearer",
      "expires_at": "2026-10-08T12:48:13+00:00",
      "abilities": [
        "*"
      ]
    },
    "user": {
      "id": 3,
      "name": "New Shopper",
      "email": null,
      "email_verified": false,
      "email_verified_at": null,
      "phone": "+8801911111111",
      "phone_verified": true,
      "avatar_url": null,
      "has_password": true,
      "google_linked": false,
      "is_active": true,
      "is_staff": false,
      "roles": [
        "customer"
      ],
      "permissions": [],
      "last_login_at": "2026-10-01T12:48:13+00:00",
      "created_at": "2026-10-01T12:48:13+00:00",
      "updated_at": "2026-10-01T12:48:13+00:00"
    }
  }
}
```

<sub>End of `POST /api/v1/auth/otp/verify` · [back to contents](#contents)</sub>

---

<a id="post-auth-otp-resend"></a>

### `POST /api/v1/auth/otp/resend`

Send a new code (`purpose`: `verify` or `password_reset`).

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |
| `purpose` | No | String, one of `verify`, `password_reset` |

**Example**

```http
POST /api/v1/auth/otp/resend
```
```json
{
  "login": "01911111111",
  "purpose": "verify"
}
```

Response `202`
```json
{
  "message": "If an account needs it, a new code is on its way.",
  "data": {
    "verification": {
      "channel": "phone",
      "destination": "+88019*****111",
      "expires_in_minutes": 5
    }
  }
}
```

<sub>End of `POST /api/v1/auth/otp/resend` · [back to contents](#contents)</sub>

---

<a id="post-auth-login"></a>

### `POST /api/v1/auth/login`

Exchange email or mobile number and password for a token.

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters |
| `password` | Yes | String |
| `device_name` | No | String, up to 255 characters, may be `null` |

**Example**

```http
POST /api/v1/auth/login
```
```json
{
  "login": "customer@example.com",
  "password": "Demo-Password-1!"
}
```

Response `200`
```json
{
  "data": {
    "token": {
      "token": "1|ecom_w3pSFcn2ditLzK76tUvujgjGtLMyJuvDhuRepnoL51035559",
      "token_type": "Bearer",
      "expires_at": "2026-10-08T12:48:12+00:00",
      "abilities": [
        "*"
      ]
    },
    "user": {
      "id": 2,
      "name": "Rafi Ahmed",
      "email": "customer@example.com",
      "email_verified": true,
      "email_verified_at": "2026-10-01T12:48:08+00:00",
      "phone": "+8801712345678",
      "phone_verified": true,
      "avatar_url": null,
      "has_password": true,
      "google_linked": false,
      "is_active": true,
      "is_staff": false,
      "roles": [
        "customer"
      ],
      "permissions": [],
      "last_login_at": "2026-10-01T12:48:12+00:00",
      "created_at": "2026-10-01T12:48:08+00:00",
      "updated_at": "2026-10-01T12:48:12+00:00"
    }
  }
}
```

<sub>End of `POST /api/v1/auth/login` · [back to contents](#contents)</sub>

---

<a id="post-auth-google"></a>

### `POST /api/v1/auth/google`

Sign in or up with a Google ID token.

Auth: none

Needs `GOOGLE_CLIENT_ID` on the server. Until it is set this answers `503 SERVICE_UNAVAILABLE`, as below; once set, the response is the same as `POST /auth/login`.

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `id_token` | Yes | String, up to 4096 characters |
| `device_name` | No | String, up to 255 characters, may be `null` |

**Example (not configured yet)**

```http
POST /api/v1/auth/google
```
```json
{
  "id_token": "the-id-token-from-google-identity-services"
}
```

Response `503`
```json
{
  "message": "Google sign-in is not configured.",
  "code": "SERVICE_UNAVAILABLE",
  "request_id": "a82d09dc-0220-49dd-aa95-e8a6cd828b95"
}
```

<sub>End of `POST /api/v1/auth/google` · [back to contents](#contents)</sub>

---

<a id="post-auth-forgot-password"></a>

### `POST /api/v1/auth/forgot-password`

Send a password reset code.

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |

**Example**

```http
POST /api/v1/auth/forgot-password
```
```json
{
  "login": "customer@example.com"
}
```

Response `202`
```json
{
  "message": "If that belongs to an account, a reset code is on its way.",
  "data": {
    "verification": {
      "channel": "email",
      "destination": "cu******@example.com",
      "expires_in_minutes": 5
    }
  }
}
```

<sub>End of `POST /api/v1/auth/forgot-password` · [back to contents](#contents)</sub>

---

<a id="post-auth-reset-password"></a>

### `POST /api/v1/auth/reset-password`

Set a new password with the code.

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |
| `code` | Yes | String, 6 digits |
| `password` | Yes | String, send `password_confirmation` with the same value, 12+ characters with upper and lower case, a number and a symbol |

**Example**

```http
POST /api/v1/auth/reset-password
```
```json
{
  "login": "customer@example.com",
  "code": "589685",
  "password": "New-Password-1!",
  "password_confirmation": "New-Password-1!"
}
```

Response `200`
```json
{
  "message": "Your password has been reset. Please sign in again."
}
```

<sub>End of `POST /api/v1/auth/reset-password` · [back to contents](#contents)</sub>

---

<a id="post-auth-logout"></a>

### `POST /api/v1/auth/logout`

Revoke the token in use.

Auth: token

**Example**

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `POST /api/v1/auth/logout` · [back to contents](#contents)</sub>

---

<a id="post-auth-logout-all"></a>

### `POST /api/v1/auth/logout-all`

Revoke every token.

Auth: token

**Example**

```http
POST /api/v1/auth/logout-all
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `POST /api/v1/auth/logout-all` · [back to contents](#contents)</sub>

---

<a id="put-auth-password"></a>

### `PUT /api/v1/auth/password`

Change own password, or set a first one after Google sign-up.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `current_password` | Yes, unless the account has no password yet (signed up with Google); then not allowed | String, the current password |
| `password` | Yes | String, send `password_confirmation` with the same value, different from `current_password`, 12+ characters with upper and lower case, a number and a symbol |

**Example**

```http
PUT /api/v1/auth/password
Authorization: Bearer <token>
```
```json
{
  "current_password": "New-Password-1!",
  "password": "Demo-Password-1!",
  "password_confirmation": "Demo-Password-1!"
}
```

Response `200`
```json
{
  "message": "Your password has been changed. Other devices have been signed out."
}
```

<sub>End of `PUT /api/v1/auth/password` · [back to contents](#contents)</sub>

---

<a id="get-auth-tokens"></a>

### `GET /api/v1/auth/tokens`

List signed-in devices.

Auth: token

**Example**

```http
GET /api/v1/auth/tokens
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 3,
      "name": "api",
      "abilities": [
        "*"
      ],
      "is_current": true,
      "last_used_at": "2026-10-01T12:48:16+00:00",
      "expires_at": "2026-10-08T12:48:15+00:00",
      "created_at": "2026-10-01T12:48:15+00:00"
    }
  ]
}
```

<sub>End of `GET /api/v1/auth/tokens` · [back to contents](#contents)</sub>

---

<a id="delete-auth-tokens-token"></a>

### `DELETE /api/v1/auth/tokens/{token}`

Revoke one device.

Auth: token

Path: `token`

**Example**

```http
DELETE /api/v1/auth/tokens/3
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/auth/tokens/{token}` · [back to contents](#contents)</sub>

---

<a id="get-me"></a>

### `GET /api/v1/me`

Profile, roles and permissions.

Auth: token

**Example**

```http
GET /api/v1/me
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Rafi Ahmed",
    "email": "customer@example.com",
    "email_verified": true,
    "email_verified_at": "2026-10-01T12:48:08+00:00",
    "phone": "+8801712345678",
    "phone_verified": true,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": true,
    "is_staff": false,
    "roles": [
      "customer"
    ],
    "permissions": [],
    "last_login_at": "2026-10-01T12:48:12+00:00",
    "created_at": "2026-10-01T12:48:08+00:00",
    "updated_at": "2026-10-01T12:48:12+00:00"
  }
}
```

<sub>End of `GET /api/v1/me` · [back to contents](#contents)</sub>

---

<a id="put-me"></a>

### `PUT /api/v1/me`

Update own name.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |

**Example**

```http
PUT /api/v1/me
Authorization: Bearer <token>
```
```json
{
  "name": "Rafi Ahmed"
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Rafi Ahmed",
    "email": "customer@example.com",
    "email_verified": true,
    "email_verified_at": "2026-10-01T12:48:08+00:00",
    "phone": "+8801712345678",
    "phone_verified": true,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": true,
    "is_staff": false,
    "roles": [
      "customer"
    ],
    "permissions": [],
    "last_login_at": "2026-10-01T12:48:12+00:00",
    "created_at": "2026-10-01T12:48:08+00:00",
    "updated_at": "2026-10-01T12:48:12+00:00"
  }
}
```

<sub>End of `PUT /api/v1/me` · [back to contents](#contents)</sub>

---

<a id="post-me-contact"></a>

### `POST /api/v1/me/contact`

Send a code to a new email or mobile number.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |

**Example**

```http
POST /api/v1/me/contact
Authorization: Bearer <token>
```
```json
{
  "login": "newaddress@example.com"
}
```

Response `202`
```json
{
  "message": "We have sent a code to confirm it.",
  "data": {
    "verification": {
      "channel": "email",
      "destination": "ne********@example.com",
      "expires_in_minutes": 5
    }
  }
}
```

<sub>End of `POST /api/v1/me/contact` · [back to contents](#contents)</sub>

---

<a id="post-me-contact-verify"></a>

### `POST /api/v1/me/contact/verify`

Switch to it with the code.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `login` | Yes | String, up to 255 characters, email address or mobile number (01XXXXXXXXX) |
| `code` | Yes | String, 6 digits |

**Example**

```http
POST /api/v1/me/contact/verify
Authorization: Bearer <token>
```
```json
{
  "login": "newaddress@example.com",
  "code": "069975"
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Rafi Ahmed",
    "email": "newaddress@example.com",
    "email_verified": true,
    "email_verified_at": "2026-10-01T12:48:16+00:00",
    "phone": "+8801712345678",
    "phone_verified": true,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": true,
    "is_staff": false,
    "roles": [
      "customer"
    ],
    "permissions": [],
    "last_login_at": "2026-10-01T12:48:15+00:00",
    "created_at": "2026-10-01T12:48:08+00:00",
    "updated_at": "2026-10-01T12:48:16+00:00"
  }
}
```

<sub>End of `POST /api/v1/me/contact/verify` · [back to contents](#contents)</sub>


## Customer endpoints (the storefront) · The catalogue and store content

---

<a id="get-health"></a>

### `GET /api/v1/health`

Liveness check, `{"status":"healthy"}`.

Auth: none

**Example**

```http
GET /api/v1/health
```

Response `200`
```json
{
  "status": "healthy"
}
```

<sub>End of `GET /api/v1/health` · [back to contents](#contents)</sub>

---

<a id="get-settings"></a>

### `GET /api/v1/settings`

Store name, contact details, logo, payment methods on offer (publicly cacheable).

Auth: none

**Example**

```http
GET /api/v1/settings
```

Response `200`
```json
{
  "data": {
    "store_name": "Demo Safety Store",
    "store_email": "shop@example.com",
    "store_phone": "+8801700000000",
    "store_address": "12/A Motijheel\nDhaka 1000",
    "cod_enabled": true,
    "bank_transfer_enabled": true,
    "bank_transfer_instructions": null,
    "logo_url": null,
    "favicon_url": null
  }
}
```

<sub>End of `GET /api/v1/settings` · [back to contents](#contents)</sub>

---

<a id="get-home"></a>

### `GET /api/v1/home`

The whole front page: every section, in order.

Auth: none

**Example**

```http
GET /api/v1/home
```

Response `200`
```json
{
  "data": {
    "sections": [
      {
        "id": 1,
        "type": "categories",
        "title": "Shop by category",
        "subtitle": null,
        "categories": [
          {
            "id": 1,
            "name": "Safety equipment",
            "slug": "safety-equipment",
            "icon": null,
            "product_count": 5
          }
        ]
      }
    ],
    "generated_at": "2026-10-01T12:48:12+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/home` · [back to contents](#contents)</sub>

---

<a id="get-categories"></a>

### `GET /api/v1/categories`

Category tree for menus, with product counts.

Auth: none

**Example**

```http
GET /api/v1/categories
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Safety equipment",
      "slug": "safety-equipment",
      "icon": null,
      "product_count": 5,
      "children": [
        {
          "id": 2,
          "name": "Fire extinguishers",
          "slug": "fire-extinguishers",
          "icon": null,
          "product_count": 3,
          "children": []
        }
      ]
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/categories` · [back to contents](#contents)</sub>

---

<a id="get-categories-slug"></a>

### `GET /api/v1/categories/{slug}`

Category page: breadcrumbs, subcategories, SEO, VAT rate.

Auth: none

Path: `slug`

**Example**

```http
GET /api/v1/categories/fire-extinguishers
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Fire extinguishers",
    "slug": "fire-extinguishers",
    "description": null,
    "icon": null,
    "banner": null,
    "product_count": 3,
    "vat_rate_bp": 1500,
    "breadcrumbs": [
      {
        "id": 1,
        "name": "Safety equipment",
        "slug": "safety-equipment"
      }
    ],
    "children": [],
    "seo": {
      "title": "Fire extinguishers",
      "description": null,
      "keywords": null
    }
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/categories/{slug}` · [back to contents](#contents)</sub>

---

<a id="get-brands"></a>

### `GET /api/v1/brands`

Active brands with logos and product counts.

Auth: none

**Example**

```http
GET /api/v1/brands
```

Response `200`
```json
{
  "data": []
}
```

<sub>End of `GET /api/v1/brands` · [back to contents](#contents)</sub>

---

<a id="get-brands-slug"></a>

### `GET /api/v1/brands/{slug}`

Brand page.

Auth: none

Path: `slug`

**Example**

```http
GET /api/v1/brands/firex
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Firex",
    "slug": "firex",
    "description": "Extinguishers and blankets.",
    "logo": null,
    "banner": null,
    "product_count": 0,
    "seo": {
      "title": "Firex",
      "description": "Extinguishers and blankets.",
      "keywords": null
    }
  }
}
```

<sub>End of `GET /api/v1/brands/{slug}` · [back to contents](#contents)</sub>

---

<a id="get-products"></a>

### `GET /api/v1/products`

Product cards, filtered, sorted, paged.

Auth: none · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `per_page` | integer | default 24, at most 48 |
| `page` | integer | |
| `option` | values | `option[{option type id}][]=5kg`, values as `/products/facets` returns them |
| `brand` | slug | repeat for several: `brand[]=a&brand[]=b`, or comma-separated |
| `q` | string | search text, Bangla or English |
| `sort` | string | one of `newest` (default), `relevance` (default when `q` is set), `price_asc`, `price_desc`, `popular`, `best_selling`, `rating`, `name` |
| `flag` | string | one of `featured`, `trending`, `new_arrival`, `best_seller`, `on_sale` |
| `category` | slug | includes its subcategories |
| `price_min` | integer | poisha, before VAT |
| `price_max` | integer | poisha, before VAT |
| `rating_min` | number | 0 to 5 |
| `in_stock` | boolean | `1` or `0` |

**Example**

```http
GET /api/v1/products?per_page=12
```

Response `200`
```json
{
  "data": [
    {
      "id": 8,
      "name": "Fire Safety Handbook",
      "slug": "fire-safety-handbook",
      "image": null,
      "brand": null,
      "price": {
        "min": 65000,
        "max": 65000,
        "compare_at": null,
        "discount_percent": null
      },
      "has_options": false,
      "in_stock": true,
      "rating": {
        "average": 0,
        "count": 0
      },
      "is_featured": false,
      "is_trending": false,
      "is_new_arrival": false,
      "is_best_seller": false
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/products?per_page=12&page=1",
    "last": "http://localhost:8000/api/v1/products?per_page=12&page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/products",
    "per_page": 12,
    "to": 8,
    "total": 8
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/products` · [back to contents](#contents)</sub>

---

<a id="get-products-facets"></a>

### `GET /api/v1/products/facets`

Filter counts for the same filters.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `option` | string | |
| `brand` | string | |
| `q` | string | search text |
| `sort` | string | |
| `flag` | string | |
| `category` | string | |
| `price_min` | integer | |
| `price_max` | integer | |
| `rating_min` | number | |
| `in_stock` | boolean | `1` or `0` |

**Example**

```http
GET /api/v1/products/facets
```

Response `200`
```json
{
  "data": {
    "brands": [],
    "price": {
      "min": 42000,
      "max": 425000
    },
    "options": [
      {
        "id": 1,
        "name": "Weight",
        "values": [
          {
            "value": "1kg",
            "label": "1 kg",
            "count": 1
          }
        ]
      }
    ],
    "ratings": [
      {
        "min": 4,
        "count": 0
      }
    ],
    "in_stock": 7
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/products/facets` · [back to contents](#contents)</sub>

---

<a id="get-products-suggest"></a>

### `GET /api/v1/products/suggest`

Live search: products, categories, brands.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string | search text |

**Example**

```http
GET /api/v1/products/suggest?q=fire
```

Response `200`
```json
{
  "data": {
    "products": [
      {
        "id": 8,
        "name": "Fire Safety Handbook",
        "slug": "fire-safety-handbook",
        "image": null,
        "price": 65000
      }
    ],
    "categories": [
      {
        "name": "Fire extinguishers",
        "slug": "fire-extinguishers"
      }
    ],
    "brands": []
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/products/suggest` · [back to contents](#contents)</sub>

---

<a id="get-products-slug"></a>

### `GET /api/v1/products/{slug}`

Product page, every variant priced.

Auth: none

Path: `slug`

**Example**

```http
GET /api/v1/products/abc-dry-powder-fire-extinguisher
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "name": "ABC Dry Powder Fire Extinguisher",
    "slug": "abc-dry-powder-fire-extinguisher",
    "short_description": "For wood, liquid and electrical fires. Refillable steel body.",
    "description": "<p>A general purpose extinguisher suitable for homes, shops and vehicles. Comes with a wall bracket and a pressure gauge.</p>",
    "specifications": [],
    "video_url": null,
    "brand": null,
    "category": {
      "id": 2,
      "name": "Fire extinguishers",
      "slug": "fire-extinguishers"
    },
    "breadcrumbs": [
      {
        "id": 1,
        "name": "Safety equipment",
        "slug": "safety-equipment"
      }
    ],
    "tags": [],
    "is_featured": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "main_image": null,
    "gallery": [],
    "option": {
      "id": 1,
      "name": "Weight"
    },
    "variants": [
      {
        "id": 1,
        "sku": "FE-ABC-1KG",
        "is_default": true,
        "value": "1kg",
        "label": "1 kg",
        "image": null,
        "price": 95000,
        "compare_at": null,
        "discount_percent": null,
        "in_stock": true,
        "low_stock": false,
        "min_qty": 1,
        "max_qty": null
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    },
    "vat_rate_bp": 1500,
    "links": {
      "related": [],
      "cross_sell": [],
      "upsell": []
    },
    "seo": {
      "title": "ABC Dry Powder Fire Extinguisher",
      "description": "For wood, liquid and electrical fires. Refillable steel body.",
      "keywords": null
    },
    "published_at": "2026-10-01T12:48:08+00:00",
    "updated_at": "2026-10-01T12:48:08+00:00",
    "price": {
      "min": 95000,
      "max": 349000
    },
    "in_stock": true
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/products/{slug}` · [back to contents](#contents)</sub>

---

<a id="get-products-slug-related"></a>

### `GET /api/v1/products/{slug}/related`

`type=related` (default), `cross_sell` or `upsell`.

Auth: none

Path: `slug`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `type` | one of `related`, `cross_sell`, `upsell` | |

**Example**

```http
GET /api/v1/products/abc-dry-powder-fire-extinguisher/related?type=related
```

Response `200`
```json
{
  "data": [
    {
      "id": 3,
      "name": "অগ্নি নির্বাপক যন্ত্র (পানি)",
      "slug": "ogni-nirwapk-zntr-pani",
      "image": null,
      "brand": null,
      "price": {
        "min": 275000,
        "max": 275000,
        "compare_at": null,
        "discount_percent": null
      },
      "has_options": false,
      "in_stock": true,
      "rating": {
        "average": 0,
        "count": 0
      },
      "is_featured": false,
      "is_trending": false,
      "is_new_arrival": false,
      "is_best_seller": false
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/products/{slug}/related` · [back to contents](#contents)</sub>

---

<a id="get-products-slug-reviews"></a>

### `GET /api/v1/products/{slug}/reviews`

Approved reviews, with the star breakdown.

Auth: none · _paginated_

Path: `slug`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `rating` | integer | |
| `with_photos` | boolean | `1` or `0` |

**Example**

```http
GET /api/v1/products/abc-dry-powder-fire-extinguisher/reviews
```

Response `200`
```json
{
  "data": [],
  "links": {
    "first": "http://localhost:8000/api/v1/products/abc-dry-powder-fire-extinguisher/reviews?page=1",
    "last": "http://localhost:8000/api/v1/products/abc-dry-powder-fire-extinguisher/reviews?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": null,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/products/abc-dry-powder-fire-extinguisher/reviews",
    "per_page": 25,
    "to": null,
    "total": 0,
    "summary": {
      "count": 0,
      "average": 0,
      "breakdown": {
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0
      }
    }
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/products/{slug}/reviews` · [back to contents](#contents)</sub>

---

<a id="get-locations"></a>

### `GET /api/v1/locations`

Divisions, or the districts of one (`parent_id`).

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `parent_id` | integer | |

**Example**

```http
GET /api/v1/locations
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "parent_id": null,
      "level": "division",
      "name": "Barishal",
      "name_bn": "বরিশাল"
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/locations` · [back to contents](#contents)</sub>

---

<a id="get-shipping-zones"></a>

### `GET /api/v1/shipping/zones`

Delivery zones, charges and estimated days.

Auth: none

**Example**

```http
GET /api/v1/shipping/zones
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Inside Dhaka",
      "type": "inside_city",
      "rate_basis": "flat",
      "free_above": 500000,
      "delivery_days_min": 1,
      "delivery_days_max": 2,
      "districts": [
        "Dhaka"
      ],
      "rates": [
        {
          "from": 0,
          "to": null,
          "charge": 6000,
          "per_extra_kg": null
        }
      ]
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/shipping/zones` · [back to contents](#contents)</sub>

---

<a id="get-pages"></a>

### `GET /api/v1/pages`

Published pages, for the footer.

Auth: none

**Example**

```http
GET /api/v1/pages
```

Response `200`
```json
{
  "data": [
    {
      "slug": "about-us",
      "title": "About us"
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/pages` · [back to contents](#contents)</sub>

---

<a id="get-pages-slug"></a>

### `GET /api/v1/pages/{slug}`

One page, with its HTML.

Auth: none

Path: `slug`

**Example**

```http
GET /api/v1/pages/about-us
```

Response `200`
```json
{
  "data": {
    "slug": "about-us",
    "title": "About us",
    "content": "<p>A demonstration shop, selling safety equipment and fasteners.</p>",
    "seo_title": null,
    "seo_description": null,
    "updated_at": "2026-10-01T12:48:08.000000Z"
  }
}
```

<sub>End of `GET /api/v1/pages/{slug}` · [back to contents](#contents)</sub>

---

<a id="get-faqs"></a>

### `GET /api/v1/faqs`

Published questions and answers.

Auth: none

**Example**

```http
GET /api/v1/faqs
```

Response `200`
```json
{
  "data": []
}
```

<sub>End of `GET /api/v1/faqs` · [back to contents](#contents)</sub>

---

<a id="get-sitemap"></a>

### `GET /api/v1/sitemap`

Slugs for sitemap.xml (`products`, `categories`, `brands`, `pages`).

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `type` | string | |

**Example**

```http
GET /api/v1/sitemap?type=products
```

Response `200`
```json
{
  "data": {
    "type": "products",
    "page": 1,
    "per_page": 1000,
    "total": 8,
    "has_more": false,
    "items": [
      {
        "slug": "abc-dry-powder-fire-extinguisher",
        "updated_at": "2026-10-01T12:48:08+00:00"
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/sitemap` · [back to contents](#contents)</sub>

---

<a id="post-contact"></a>

### `POST /api/v1/contact`

Send a message to the shop.

Auth: optional

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, up to 255 characters |
| `email` | Unless `phone` is sent | String, email address, up to 255 characters, may be `null` |
| `phone` | Unless `email` is sent | String, mobile number (01XXXXXXXXX), may be `null` |
| `subject` | No | String, up to 255 characters, may be `null` |
| `message` | Yes | String, up to 5000 characters |
| `website` | No: must be left out or empty | Spam trap: a hidden field people never fill in. Render it hidden; anything in it is refused with `422` |

**Example**

```http
POST /api/v1/contact
```
```json
{
  "name": "Curious Visitor",
  "phone": "01911112222",
  "subject": "Do you deliver to Khulna?",
  "message": "Asking before I order."
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "message": "Thank you. We will be in touch."
  }
}
```

<sub>End of `POST /api/v1/contact` · [back to contents](#contents)</sub>

---

<a id="post-newsletter-subscribe"></a>

### `POST /api/v1/newsletter/subscribe`

Join the mailing list.

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `email` | Yes | String, email address, up to 255 characters |
| `source` | No | One of `footer`, `popup`, `checkout` |
| `website` | No: must be left out or empty | Spam trap: a hidden field people never fill in. Render it hidden; anything in it is refused with `422` |

**Example**

```http
POST /api/v1/newsletter/subscribe
```
```json
{
  "email": "reader@example.com"
}
```

Response `202`
```json
{
  "data": {
    "message": "Thank you. You are on the list."
  }
}
```

<sub>End of `POST /api/v1/newsletter/subscribe` · [back to contents](#contents)</sub>

---

<a id="post-newsletter-unsubscribe"></a>

### `POST /api/v1/newsletter/unsubscribe`

Leave it, by the token in the email.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `token` | string | |

**Example**

```http
POST /api/v1/newsletter/unsubscribe
```
```json
{
  "token": "the-token-from-the-email-footer"
}
```

Response `200`
```json
{
  "data": {
    "message": "You will not hear from us again."
  }
}
```

<sub>End of `POST /api/v1/newsletter/unsubscribe` · [back to contents](#contents)</sub>

---

<a id="post-track-view"></a>

### `POST /api/v1/track/view`

Note a page or product view (counted after the response).

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `product_slug` | string | |

**Example**

```http
POST /api/v1/track/view
```
```json
{
  "product_slug": "abc-dry-powder-fire-extinguisher"
}
```

Response `204`, no body.

<sub>End of `POST /api/v1/track/view` · [back to contents](#contents)</sub>


## Customer endpoints (the storefront) · Cart, checkout and payment

---

<a id="get-cart"></a>

### `GET /api/v1/cart`

The cart (`X-Cart-Token` for visitors).

Auth: optional

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Example**

```http
GET /api/v1/cart?location_id=21
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [
      {
        "id": 1,
        "variant_id": 1,
        "quantity": 2,
        "saved_for_later": false,
        "product": {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher",
          "slug": "abc-dry-powder-fire-extinguisher",
          "image": null
        },
        "sku": "FE-ABC-1KG",
        "label": "1 kg",
        "unit_price": 95000,
        "compare_at": null,
        "line_subtotal": 190000,
        "discount": 0,
        "vat": 28500,
        "line_total": 218500,
        "price_changed": false,
        "price_when_added": 95000,
        "available": true,
        "stock": 40,
        "max_qty": null,
        "min_qty": 1
      }
    ],
    "saved_for_later": [],
    "coupon": null,
    "coupon_error": null,
    "totals": {
      "subtotal": 190000,
      "discount": 0,
      "vat": 28500,
      "shipping": 6000,
      "grand_total": 224500
    },
    "shipping": {
      "zone_id": 1,
      "zone_name": "Inside Dhaka",
      "charge": 6000,
      "free_applied": false,
      "delivery_days_min": 1,
      "delivery_days_max": 2
    },
    "weight_grams": 3200,
    "item_count": 2
  }
}
```

<sub>End of `GET /api/v1/cart` · [back to contents](#contents)</sub>

---

<a id="post-cart-items"></a>

### `POST /api/v1/cart/items`

Add an item; a visitor's first call returns a `token`.

Auth: optional

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `variant_id` | Yes | Integer, an existing `product_variants` id |
| `quantity` | No | Integer, at least 1, at most 10000 |

**Example**

```http
POST /api/v1/cart/items
Authorization: Bearer <token>
```
```json
{
  "variant_id": 1,
  "quantity": 2
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [
      {
        "id": 1,
        "variant_id": 1,
        "quantity": 2,
        "saved_for_later": false,
        "product": {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher",
          "slug": "abc-dry-powder-fire-extinguisher",
          "image": null
        },
        "sku": "FE-ABC-1KG",
        "label": "1 kg",
        "unit_price": 95000,
        "compare_at": null,
        "line_subtotal": 190000,
        "discount": 0,
        "vat": 28500,
        "line_total": 218500,
        "price_changed": false,
        "price_when_added": 95000,
        "available": true,
        "stock": 40,
        "max_qty": null,
        "min_qty": 1
      }
    ],
    "saved_for_later": [],
    "coupon": null,
    "coupon_error": null,
    "totals": {
      "subtotal": 190000,
      "discount": 0,
      "vat": 28500,
      "shipping": 12000,
      "grand_total": 230500
    },
    "shipping": {
      "zone_id": 2,
      "zone_name": "Outside Dhaka",
      "charge": 12000,
      "free_applied": false,
      "delivery_days_min": 3,
      "delivery_days_max": 5
    },
    "weight_grams": 3200,
    "item_count": 2
  }
}
```

<sub>End of `POST /api/v1/cart/items` · [back to contents](#contents)</sub>

---

<a id="patch-cart-items-item"></a>

### `PATCH /api/v1/cart/items/{item}`

Change a line's quantity.

Auth: optional

Path: `item`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `quantity` | Yes | Integer, at least 1, at most 10000 |

**Example**

```http
PATCH /api/v1/cart/items/1
Authorization: Bearer <token>
```
```json
{
  "quantity": 3
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [
      {
        "id": 1,
        "variant_id": 1,
        "quantity": 3,
        "saved_for_later": false,
        "product": {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher",
          "slug": "abc-dry-powder-fire-extinguisher",
          "image": null
        },
        "sku": "FE-ABC-1KG",
        "label": "1 kg",
        "unit_price": 95000,
        "compare_at": null,
        "line_subtotal": 285000,
        "discount": 0,
        "vat": 42750,
        "line_total": 327750,
        "price_changed": false,
        "price_when_added": 95000,
        "available": true,
        "stock": 40,
        "max_qty": null,
        "min_qty": 1
      }
    ],
    "saved_for_later": [],
    "coupon": null,
    "coupon_error": null,
    "totals": {
      "subtotal": 285000,
      "discount": 0,
      "vat": 42750,
      "shipping": 12000,
      "grand_total": 339750
    },
    "shipping": {
      "zone_id": 2,
      "zone_name": "Outside Dhaka",
      "charge": 12000,
      "free_applied": false,
      "delivery_days_min": 3,
      "delivery_days_max": 5
    },
    "weight_grams": 4800,
    "item_count": 3
  }
}
```

<sub>End of `PATCH /api/v1/cart/items/{item}` · [back to contents](#contents)</sub>

---

<a id="delete-cart-items-item"></a>

### `DELETE /api/v1/cart/items/{item}`

Remove a line.

Auth: optional

Path: `item`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Example**

```http
DELETE /api/v1/cart/items/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [],
    "saved_for_later": [],
    "coupon": null,
    "coupon_error": null,
    "totals": {
      "subtotal": 0,
      "discount": 0,
      "vat": 0,
      "shipping": 12000,
      "grand_total": 12000
    },
    "shipping": {
      "zone_id": 2,
      "zone_name": "Outside Dhaka",
      "charge": 12000,
      "free_applied": false,
      "delivery_days_min": 3,
      "delivery_days_max": 5
    },
    "weight_grams": 0,
    "item_count": 0
  }
}
```

<sub>End of `DELETE /api/v1/cart/items/{item}` · [back to contents](#contents)</sub>

---

<a id="put-cart-coupon"></a>

### `PUT /api/v1/cart/coupon`

Apply a coupon code.

Auth: optional

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `code` | Yes | String, up to 32 characters |

**Example**

```http
PUT /api/v1/cart/coupon
Authorization: Bearer <token>
```
```json
{
  "code": "DEMO10"
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [
      {
        "id": 1,
        "variant_id": 1,
        "quantity": 3,
        "saved_for_later": false,
        "product": {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher",
          "slug": "abc-dry-powder-fire-extinguisher",
          "image": null
        },
        "sku": "FE-ABC-1KG",
        "label": "1 kg",
        "unit_price": 95000,
        "compare_at": null,
        "line_subtotal": 285000,
        "discount": 28500,
        "vat": 38475,
        "line_total": 294975,
        "price_changed": false,
        "price_when_added": 95000,
        "available": true,
        "stock": 40,
        "max_qty": null,
        "min_qty": 1
      }
    ],
    "saved_for_later": [],
    "coupon": {
      "code": "DEMO10",
      "discount": 28500
    },
    "coupon_error": null,
    "totals": {
      "subtotal": 285000,
      "discount": 28500,
      "vat": 38475,
      "shipping": 12000,
      "grand_total": 306975
    },
    "shipping": {
      "zone_id": 2,
      "zone_name": "Outside Dhaka",
      "charge": 12000,
      "free_applied": false,
      "delivery_days_min": 3,
      "delivery_days_max": 5
    },
    "weight_grams": 4800,
    "item_count": 3
  }
}
```

<sub>End of `PUT /api/v1/cart/coupon` · [back to contents](#contents)</sub>

---

<a id="delete-cart-coupon"></a>

### `DELETE /api/v1/cart/coupon`

Remove the coupon.

Auth: optional

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Example**

```http
DELETE /api/v1/cart/coupon
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [
      {
        "id": 1,
        "variant_id": 1,
        "quantity": 3,
        "saved_for_later": false,
        "product": {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher",
          "slug": "abc-dry-powder-fire-extinguisher",
          "image": null
        },
        "sku": "FE-ABC-1KG",
        "label": "1 kg",
        "unit_price": 95000,
        "compare_at": null,
        "line_subtotal": 285000,
        "discount": 0,
        "vat": 42750,
        "line_total": 327750,
        "price_changed": false,
        "price_when_added": 95000,
        "available": true,
        "stock": 40,
        "max_qty": null,
        "min_qty": 1
      }
    ],
    "saved_for_later": [],
    "coupon": null,
    "coupon_error": null,
    "totals": {
      "subtotal": 285000,
      "discount": 0,
      "vat": 42750,
      "shipping": 12000,
      "grand_total": 339750
    },
    "shipping": {
      "zone_id": 2,
      "zone_name": "Outside Dhaka",
      "charge": 12000,
      "free_applied": false,
      "delivery_days_min": 3,
      "delivery_days_max": 5
    },
    "weight_grams": 4800,
    "item_count": 3
  }
}
```

<sub>End of `DELETE /api/v1/cart/coupon` · [back to contents](#contents)</sub>

---

<a id="post-cart-claim"></a>

### `POST /api/v1/cart/claim`

Fold a visitor's cart into the account.

Auth: token

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `location_id` | integer | a district id; adds the delivery charge to the totals |

**Example**

```http
POST /api/v1/cart/claim
Authorization: Bearer <token>
X-Cart-Token: NOY10Pmdc1EkYOqgJuOXv6WHU8WaOQMF61TV9F6V
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "token": null,
    "items": [
      {
        "id": 3,
        "variant_id": 1,
        "quantity": 1,
        "saved_for_later": false,
        "product": {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher",
          "slug": "abc-dry-powder-fire-extinguisher",
          "image": null
        },
        "sku": "FE-ABC-1KG",
        "label": "1 kg",
        "unit_price": 95000,
        "compare_at": null,
        "line_subtotal": 95000,
        "discount": 0,
        "vat": 14250,
        "line_total": 109250,
        "price_changed": false,
        "price_when_added": 95000,
        "available": true,
        "stock": 40,
        "max_qty": null,
        "min_qty": 1
      }
    ],
    "saved_for_later": [],
    "coupon": null,
    "coupon_error": null,
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 12000,
      "grand_total": 121250
    },
    "shipping": {
      "zone_id": 2,
      "zone_name": "Outside Dhaka",
      "charge": 12000,
      "free_applied": false,
      "delivery_days_min": 3,
      "delivery_days_max": 5
    },
    "weight_grams": 1600,
    "item_count": 1
  }
}
```

<sub>End of `POST /api/v1/cart/claim` · [back to contents](#contents)</sub>

---

<a id="post-checkout-quote"></a>

### `POST /api/v1/checkout/quote`

What the cart comes to, with the ways of paying on offer.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `address_id` | No | Integer, an existing `addresses` id |
| `district_id` | No | Integer, an existing `locations` id |

**Example**

```http
POST /api/v1/checkout/quote
Authorization: Bearer <token>
```
```json
{
  "address_id": 1
}
```

Response `200`
```json
{
  "data": {
    "items": [
      {
        "variant_id": 1,
        "product_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "slug": "abc-dry-powder-fire-extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "quantity": 1,
        "unit_price": 95000,
        "compare_at": null,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "coupon": null,
    "coupon_error": null,
    "shipping": {
      "zone_id": 1,
      "zone_name": "Inside Dhaka",
      "charge": 6000,
      "free_applied": false,
      "delivery_days_min": 1,
      "delivery_days_max": 2
    },
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "weight_grams": 1600,
    "payment_methods": [
      {
        "method": "cod",
        "label": "Cash on delivery",
        "is_online": false,
        "instructions": null
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/checkout/quote` · [back to contents](#contents)</sub>

---

<a id="post-checkout"></a>

### `POST /api/v1/checkout`

Place the cart as an order (`Idempotency-Key`).

Auth: token

Send an `Idempotency-Key` header with a fresh UUID for each order. If the connection drops and the app sends the same request again with the same key, it gets back the order already placed instead of a second order; the same key with a different order answers `409 IDEMPOTENCY_CONFLICT`. Send `address_id` for a saved address, or `address` to type one.

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `address_id` | Unless `address` is sent | Integer, an existing `addresses` id |
| `billing_address_id` | No | Integer, an existing `addresses` id, may be `null` |
| `address` | Unless `address_id` is sent | Object |
| `address.name` | Yes | String, up to 255 characters |
| `address.phone` | Yes | String, mobile number (01XXXXXXXXX) |
| `address.line1` | Yes | String, up to 255 characters |
| `address.line2` | No | String, up to 255 characters, may be `null` |
| `address.area` | No | String, up to 255 characters, may be `null` |
| `address.district_id` | Yes | Integer, an existing `locations` id |
| `address.postcode` | No | String, up to 16 characters, may be `null` |
| `billing_address` | No | Object |
| `billing_address.name` | With `billing_address` | String, up to 255 characters |
| `billing_address.phone` | With `billing_address` | String, mobile number (01XXXXXXXXX) |
| `billing_address.line1` | With `billing_address` | String, up to 255 characters |
| `billing_address.line2` | No | String, up to 255 characters, may be `null` |
| `billing_address.area` | No | String, up to 255 characters, may be `null` |
| `billing_address.district_id` | With `billing_address` | Integer, an existing `locations` id |
| `billing_address.postcode` | No | String, up to 16 characters, may be `null` |
| `payment_method` | Yes | One of `cod`, `bank_transfer`, `sslcommerz` |
| `note` | No | String, up to 1000 characters, may be `null` |

**Example**

```http
POST /api/v1/checkout
Authorization: Bearer <token>
Idempotency-Key: 194e6b93-2b17-4f52-936e-2a9c170a9101
```
```json
{
  "address_id": 1,
  "payment_method": "cod",
  "note": "Ring the bell"
}
```

Response `201`
```json
{
  "data": {
    "number": "261001-7P8U8",
    "status": "pending",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "cart",
    "contact": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "email": "newaddress@example.com"
    },
    "shipping_address": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "line1": "House 12, Road 4",
      "line2": null,
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": "1209",
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "line1": "House 12, Road 4",
      "line2": null,
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": "1209",
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2
    },
    "items": [
      {
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "coupon_code": null,
    "currency": "BDT",
    "note": "Ring the bell",
    "can_cancel": true,
    "payment_expires_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": null,
    "delivered_at": null,
    "cancelled_at": null,
    "timeline": [
      {
        "status": "pending",
        "note": "Order placed",
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  },
  "payment": null
}
```

<sub>End of `POST /api/v1/checkout` · [back to contents](#contents)</sub>

---

<a id="post-buy-now-quote"></a>

### `POST /api/v1/buy-now/quote`

What one item comes to.

Auth: optional

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `variant_id` | Yes | Integer, an existing `product_variants` id |
| `quantity` | Yes | Integer, at least 1, at most 10000 |
| `district_id` | No | Integer, an existing `locations` id |
| `coupon_code` | No | String, up to 32 characters, may be `null` |

**Example**

```http
POST /api/v1/buy-now/quote
```
```json
{
  "variant_id": 1,
  "quantity": 1,
  "district_id": 21
}
```

Response `200`
```json
{
  "data": {
    "items": [
      {
        "variant_id": 1,
        "product_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "slug": "abc-dry-powder-fire-extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "quantity": 1,
        "unit_price": 95000,
        "compare_at": null,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "coupon": null,
    "coupon_error": null,
    "shipping": {
      "zone_id": 1,
      "zone_name": "Inside Dhaka",
      "charge": 6000,
      "free_applied": false,
      "delivery_days_min": 1,
      "delivery_days_max": 2
    },
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "weight_grams": 1600,
    "payment_methods": [
      {
        "method": "cod",
        "label": "Cash on delivery",
        "is_online": false,
        "instructions": null
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/buy-now/quote` · [back to contents](#contents)</sub>

---

<a id="post-buy-now"></a>

### `POST /api/v1/buy-now`

Order one item; a visitor must give a mobile number.

Auth: optional

Fields are shown as a visitor sends them. A signed-in customer may leave out `name` and `phone`, and may send a saved `address_id` instead of `address`.

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `variant_id` | Yes | Integer, an existing `product_variants` id |
| `quantity` | Yes | Integer, at least 1, at most 10000 |
| `name` | Yes | String, up to 255 characters |
| `phone` | Yes | String, mobile number (01XXXXXXXXX) |
| `email` | No | String, email address, up to 255 characters, may be `null` |
| `address_id` | Not allowed | Integer, an existing `addresses` id |
| `address` | Yes | Object |
| `address.name` | Yes | String, up to 255 characters |
| `address.phone` | Yes | String, mobile number (01XXXXXXXXX) |
| `address.line1` | Yes | String, up to 255 characters |
| `address.line2` | No | String, up to 255 characters, may be `null` |
| `address.area` | No | String, up to 255 characters, may be `null` |
| `address.district_id` | Yes | Integer, an existing `locations` id |
| `address.postcode` | No | String, up to 16 characters, may be `null` |
| `billing_address` | No | Object |
| `billing_address.name` | With `billing_address` | String, up to 255 characters |
| `billing_address.phone` | With `billing_address` | String, mobile number (01XXXXXXXXX) |
| `billing_address.line1` | With `billing_address` | String, up to 255 characters |
| `billing_address.line2` | No | String, up to 255 characters, may be `null` |
| `billing_address.area` | No | String, up to 255 characters, may be `null` |
| `billing_address.district_id` | With `billing_address` | Integer, an existing `locations` id |
| `billing_address.postcode` | No | String, up to 16 characters, may be `null` |
| `coupon_code` | No | String, up to 32 characters, may be `null` |
| `payment_method` | Yes | One of `cod`, `bank_transfer`, `sslcommerz` |
| `note` | No | String, up to 1000 characters, may be `null` |

**Example**

```http
POST /api/v1/buy-now
```
```json
{
  "variant_id": 1,
  "quantity": 1,
  "name": "Walk-in Customer",
  "phone": "01812345678",
  "address": {
    "name": "Walk-in Customer",
    "phone": "01812345678",
    "line1": "Shop 4, New Market",
    "area": "New Market",
    "district_id": 21
  },
  "payment_method": "cod"
}
```

Response `201`
```json
{
  "data": {
    "number": "261001-BLTFT",
    "status": "pending",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "buy_now",
    "contact": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "email": null
    },
    "shipping_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2
    },
    "items": [
      {
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "coupon_code": null,
    "currency": "BDT",
    "note": null,
    "can_cancel": true,
    "payment_expires_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": null,
    "delivered_at": null,
    "cancelled_at": null,
    "timeline": [
      {
        "status": "pending",
        "note": "Order placed",
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  },
  "payment": null
}
```

<sub>End of `POST /api/v1/buy-now` · [back to contents](#contents)</sub>

---

<a id="get-orders-track"></a>

### `GET /api/v1/orders/track`

Track an order without signing in.

Auth: none

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `number` | Yes | String, up to 24 characters |
| `phone` | Yes | String, mobile number (01XXXXXXXXX) |

**Example**

```http
GET /api/v1/orders/track?number=261001-BLTFT&phone=01812345678
```

Response `200`
```json
{
  "data": {
    "number": "261001-BLTFT",
    "status": "pending",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "buy_now",
    "contact": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "email": null
    },
    "shipping_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2
    },
    "items": [
      {
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "coupon_code": null,
    "currency": "BDT",
    "note": null,
    "can_cancel": true,
    "payment_expires_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": null,
    "delivered_at": null,
    "cancelled_at": null,
    "timeline": [
      {
        "status": "pending",
        "note": "Order placed",
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  }
}
```

<sub>End of `GET /api/v1/orders/track` · [back to contents](#contents)</sub>

---

<a id="post-orders-number-pay"></a>

### `POST /api/v1/orders/{number}/pay`

Start or retry an online payment; returns `gateway_url`.

Auth: optional

A visitor must send the `phone` the order was placed with; a signed-in customer need not. Needs SSLCommerz credentials: until they are set every order answers `409 PAYMENT_NOT_PAYABLE`, as below.

Path: `number`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `phone` | Yes | String, mobile number (01XXXXXXXXX) |

**Example (not configured yet)**

```http
POST /api/v1/orders/261001-BLTFT/pay
```
```json
{
  "phone": "01812345678"
}
```

Response `409`
```json
{
  "message": "This order can no longer be paid for online. Please contact us.",
  "code": "PAYMENT_NOT_PAYABLE",
  "request_id": "afa2c375-6e05-472c-9351-1ad15fe871f1"
}
```

<sub>End of `POST /api/v1/orders/{number}/pay` · [back to contents](#contents)</sub>

---

<a id="post-payments-sslcommerz-success"></a>

### `POST /api/v1/payments/sslcommerz/success`

Gateway redirect; confirms, then `303` into the frontend.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `val_id` | string | |
| `tran_id` | string | |

**Example**

```http
POST /api/v1/payments/sslcommerz/success
```
```json
{
  "tran_id": "260920-XXXXX-ABC123",
  "val_id": "the-validation-id"
}
```

Response `303`: a redirect to `http://localhost:3000/checkout/payment?status=unknown`.

<sub>End of `POST /api/v1/payments/sslcommerz/success` · [back to contents](#contents)</sub>

---

<a id="post-payments-sslcommerz-fail"></a>

### `POST /api/v1/payments/sslcommerz/fail`

Gateway redirect for a refused payment.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `error` | string | |
| `failedreason` | string | |
| `tran_id` | string | |

**Example**

```http
POST /api/v1/payments/sslcommerz/fail
```
```json
{
  "tran_id": "260920-XXXXX-ABC123",
  "error": "Card declined"
}
```

Response `303`: a redirect to `http://localhost:3000/checkout/payment?status=failed`.

<sub>End of `POST /api/v1/payments/sslcommerz/fail` · [back to contents](#contents)</sub>

---

<a id="post-payments-sslcommerz-cancel"></a>

### `POST /api/v1/payments/sslcommerz/cancel`

Gateway redirect when the shopper backs out.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `tran_id` | string | |

**Example**

```http
POST /api/v1/payments/sslcommerz/cancel
```
```json
{
  "tran_id": "260920-XXXXX-ABC123"
}
```

Response `303`: a redirect to `http://localhost:3000/checkout/payment?status=cancelled`.

<sub>End of `POST /api/v1/payments/sslcommerz/cancel` · [back to contents](#contents)</sub>

---

<a id="post-payments-sslcommerz-ipn"></a>

### `POST /api/v1/payments/sslcommerz/ipn`

The gateway's own server-to-server callback.

Auth: none

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `val_id` | string | |
| `tran_id` | string | |

**Example**

```http
POST /api/v1/payments/sslcommerz/ipn
```
```json
{
  "tran_id": "260920-XXXXX-ABC123",
  "val_id": "the-validation-id"
}
```

Response `200`
```json
{
  "received": true
}
```

<sub>End of `POST /api/v1/payments/sslcommerz/ipn` · [back to contents](#contents)</sub>


## Customer endpoints (the storefront) · The customer's account

---

<a id="get-me-addresses"></a>

### `GET /api/v1/me/addresses`

The address book.

Auth: token

**Example**

```http
GET /api/v1/me/addresses
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "label": "Home",
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "division": {
        "id": 20,
        "name": "Dhaka"
      },
      "district": {
        "id": 21,
        "name": "Dhaka"
      },
      "division_id": 20,
      "district_id": 21,
      "area": "Dhanmondi",
      "line1": "House 12, Road 4",
      "line2": null,
      "postcode": "1209",
      "is_default_shipping": true,
      "is_default_billing": true
    }
  ]
}
```

<sub>End of `GET /api/v1/me/addresses` · [back to contents](#contents)</sub>

---

<a id="post-me-addresses"></a>

### `POST /api/v1/me/addresses`

Save an address.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `label` | No | String, up to 32 characters, may be `null` |
| `name` | Yes | String, up to 255 characters |
| `phone` | Yes | String, mobile number (01XXXXXXXXX) |
| `division_id` | No | Integer, an existing `locations` id, may be `null` |
| `district_id` | Yes | Integer, an existing `locations` id |
| `area` | No | String, up to 255 characters, may be `null` |
| `line1` | Yes | String, up to 255 characters |
| `line2` | No | String, up to 255 characters, may be `null` |
| `postcode` | No | String, up to 16 characters, may be `null` |
| `is_default_shipping` | No | Boolean |
| `is_default_billing` | No | Boolean |

**Example**

```http
POST /api/v1/me/addresses
Authorization: Bearer <token>
```
```json
{
  "label": "Office",
  "name": "Rafi Ahmed",
  "phone": "01712345678",
  "district_id": 21,
  "area": "Motijheel",
  "line1": "Suite 9, 12/A Motijheel",
  "postcode": "1000"
}
```

Response `201`
```json
{
  "data": {
    "id": 2,
    "label": "Office",
    "name": "Rafi Ahmed",
    "phone": "+8801712345678",
    "division": null,
    "district": {
      "id": 21,
      "name": "Dhaka"
    },
    "division_id": null,
    "district_id": "21",
    "area": "Motijheel",
    "line1": "Suite 9, 12/A Motijheel",
    "line2": null,
    "postcode": "1000",
    "is_default_shipping": false,
    "is_default_billing": false
  }
}
```

<sub>End of `POST /api/v1/me/addresses` · [back to contents](#contents)</sub>

---

<a id="put-me-addresses-address"></a>

### `PUT /api/v1/me/addresses/{address}`

Edit an address.

Auth: token

Path: `address`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `label` | No | String, up to 32 characters, may be `null` |
| `name` | No | String, up to 255 characters |
| `phone` | No | String, mobile number (01XXXXXXXXX) |
| `division_id` | No | Integer, an existing `locations` id, may be `null` |
| `district_id` | No | Integer, an existing `locations` id |
| `area` | No | String, up to 255 characters, may be `null` |
| `line1` | No | String, up to 255 characters |
| `line2` | No | String, up to 255 characters, may be `null` |
| `postcode` | No | String, up to 16 characters, may be `null` |
| `is_default_shipping` | No | Boolean |
| `is_default_billing` | No | Boolean |

**Example**

```http
PUT /api/v1/me/addresses/2
Authorization: Bearer <token>
```
```json
{
  "label": "Work",
  "is_default_shipping": true
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "label": "Work",
    "name": "Rafi Ahmed",
    "phone": "+8801712345678",
    "division": null,
    "district": {
      "id": 21,
      "name": "Dhaka"
    },
    "division_id": null,
    "district_id": 21,
    "area": "Motijheel",
    "line1": "Suite 9, 12/A Motijheel",
    "line2": null,
    "postcode": "1000",
    "is_default_shipping": true,
    "is_default_billing": false
  }
}
```

<sub>End of `PUT /api/v1/me/addresses/{address}` · [back to contents](#contents)</sub>

---

<a id="delete-me-addresses-address"></a>

### `DELETE /api/v1/me/addresses/{address}`

Delete an address.

Auth: token

Path: `address`

**Example**

```http
DELETE /api/v1/me/addresses/2
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/me/addresses/{address}` · [back to contents](#contents)</sub>

---

<a id="get-me-wishlist"></a>

### `GET /api/v1/me/wishlist`

Saved products.

Auth: token

**Example**

```http
GET /api/v1/me/wishlist
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": []
}
```

<sub>End of `GET /api/v1/me/wishlist` · [back to contents](#contents)</sub>

---

<a id="post-me-wishlist"></a>

### `POST /api/v1/me/wishlist`

Save a product.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `product_id` | Yes | Integer, an existing `products` id |

**Example**

```http
POST /api/v1/me/wishlist
Authorization: Bearer <token>
```
```json
{
  "product_id": 1
}
```

Response `201`
```json
{
  "data": {
    "product_id": 1,
    "saved": true
  }
}
```

<sub>End of `POST /api/v1/me/wishlist` · [back to contents](#contents)</sub>

---

<a id="delete-me-wishlist-product"></a>

### `DELETE /api/v1/me/wishlist/{product}`

Unsave a product.

Auth: token

Path: `product`

**Example**

```http
DELETE /api/v1/me/wishlist/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/me/wishlist/{product}` · [back to contents](#contents)</sub>

---

<a id="get-me-recently-viewed"></a>

### `GET /api/v1/me/recently-viewed`

Recently viewed products.

Auth: token

**Example**

```http
GET /api/v1/me/recently-viewed
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "ABC Dry Powder Fire Extinguisher",
      "slug": "abc-dry-powder-fire-extinguisher",
      "image": null,
      "brand": null,
      "price": {
        "min": 95000,
        "max": 349000,
        "compare_at": null,
        "discount_percent": 9
      },
      "has_options": true,
      "in_stock": true,
      "rating": {
        "average": 0,
        "count": 0
      },
      "is_featured": true,
      "is_trending": false,
      "is_new_arrival": false,
      "is_best_seller": false
    }
  ]
}
```

<sub>End of `GET /api/v1/me/recently-viewed` · [back to contents](#contents)</sub>

---

<a id="post-me-recently-viewed"></a>

### `POST /api/v1/me/recently-viewed`

Note that a product was viewed.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `product_id` | Yes | Integer, an existing `products` id |

**Example**

```http
POST /api/v1/me/recently-viewed
Authorization: Bearer <token>
```
```json
{
  "product_id": 1
}
```

Response `204`, no body.

<sub>End of `POST /api/v1/me/recently-viewed` · [back to contents](#contents)</sub>

---

<a id="get-me-orders"></a>

### `GET /api/v1/me/orders`

The customer's orders, newest first.

Auth: token · _paginated_

**Example**

```http
GET /api/v1/me/orders
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "number": "261001-7P8U8",
      "status": "pending",
      "payment_status": "unpaid",
      "payment_method": "cod",
      "grand_total": 115250,
      "item_count": 1,
      "preview": [
        {
          "name": "ABC Dry Powder Fire Extinguisher",
          "label": "1 kg",
          "image": null,
          "quantity": 1
        }
      ],
      "can_cancel": true,
      "placed_at": "2026-10-01T12:48:18.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/me/orders?page=1",
    "last": "http://localhost:8000/api/v1/me/orders?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/me/orders",
    "per_page": 25,
    "to": 1,
    "total": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/me/orders` · [back to contents](#contents)</sub>

---

<a id="get-me-orders-number"></a>

### `GET /api/v1/me/orders/{number}`

One order with its timeline.

Auth: token

Path: `number`

**Example**

```http
GET /api/v1/me/orders/261001-7P8U8
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "number": "261001-7P8U8",
    "status": "pending",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "cart",
    "contact": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "email": "newaddress@example.com"
    },
    "shipping_address": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "line1": "House 12, Road 4",
      "line2": null,
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": "1209",
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "line1": "House 12, Road 4",
      "line2": null,
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": "1209",
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2
    },
    "items": [
      {
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "coupon_code": null,
    "currency": "BDT",
    "note": "Ring the bell",
    "can_cancel": true,
    "payment_expires_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": null,
    "delivered_at": null,
    "cancelled_at": null,
    "timeline": [
      {
        "status": "pending",
        "note": "Order placed",
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  }
}
```

<sub>End of `GET /api/v1/me/orders/{number}` · [back to contents](#contents)</sub>

---

<a id="post-me-orders-number-cancel"></a>

### `POST /api/v1/me/orders/{number}/cancel`

Cancel while pending or confirmed.

Auth: token

Path: `number`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `reason` | No | String, up to 500 characters, may be `null` |

**Example**

```http
POST /api/v1/me/orders/261001-7P8U8/cancel
Authorization: Bearer <token>
```
```json
{
  "reason": "Ordered the wrong size"
}
```

Response `200`
```json
{
  "data": {
    "number": "261001-7P8U8",
    "status": "cancelled",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "cart",
    "contact": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "email": "newaddress@example.com"
    },
    "shipping_address": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "line1": "House 12, Road 4",
      "line2": null,
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": "1209",
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Rafi Ahmed",
      "phone": "+8801712345678",
      "line1": "House 12, Road 4",
      "line2": null,
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": "1209",
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2
    },
    "items": [
      {
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "grand_total": 115250
    },
    "coupon_code": null,
    "currency": "BDT",
    "note": "Ring the bell",
    "can_cancel": false,
    "payment_expires_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": null,
    "delivered_at": null,
    "cancelled_at": "2026-10-01T12:48:19.000000Z",
    "timeline": [
      {
        "status": "pending",
        "note": "Order placed",
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/me/orders/{number}/cancel` · [back to contents](#contents)</sub>

---

<a id="get-me-orders-number-invoice"></a>

### `GET /api/v1/me/orders/{number}/invoice`

The invoice, as a PDF.

Auth: token

Path: `number`

**Example**

```http
GET /api/v1/me/orders/261001-7P8U8/invoice
Authorization: Bearer <token>
```

Response `200`: a PDF file (`application/pdf`).

<sub>End of `GET /api/v1/me/orders/{number}/invoice` · [back to contents](#contents)</sub>

---

<a id="get-me-reviewable-items"></a>

### `GET /api/v1/me/reviewable-items`

Delivered items not reviewed yet.

Auth: token

**Example**

```http
GET /api/v1/me/reviewable-items
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "order_number": "261001-NFJWN",
      "order_id": 3,
      "delivered_at": "2026-10-01T12:48:22.000000Z",
      "product_id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set",
      "image": null
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/me/reviewable-items` · [back to contents](#contents)</sub>

---

<a id="get-me-reviews"></a>

### `GET /api/v1/me/reviews`

The customer's own reviews, approved or not.

Auth: token · _paginated_

**Example**

```http
GET /api/v1/me/reviews
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Solid build, arrived the next day.",
      "photos": [],
      "is_edited": false,
      "created_at": "2026-10-01T12:48:23.000000Z",
      "status": "pending",
      "rejection_reason": null,
      "product": {
        "id": 7,
        "name": "Galvanised Nut & Washer Set",
        "slug": "galvanised-nut-washer-set"
      }
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/me/reviews?page=1",
    "last": "http://localhost:8000/api/v1/me/reviews?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/me/reviews",
    "per_page": 25,
    "to": 1,
    "total": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/me/reviews` · [back to contents](#contents)</sub>

---

<a id="post-me-reviews"></a>

### `POST /api/v1/me/reviews`

Write one (stars alone are enough).

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `product_id` | Yes | Integer, an existing `products` id |
| `order_id` | Yes | Integer, an existing `orders` id |
| `rating` | Yes | Integer, at least 1, at most 5 |
| `comment` | No | String, up to 2000 characters, may be `null` |
| `photo_ids` | No | List, up to 5 items |
| `photo_ids[]` | No | Integer, an existing `media` id |

**Example**

```http
POST /api/v1/me/reviews
Authorization: Bearer <token>
```
```json
{
  "product_id": 7,
  "order_id": 3,
  "rating": 5,
  "comment": "Solid build, arrived the next day."
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "rating": 5,
    "comment": "Solid build, arrived the next day.",
    "photos": [],
    "is_edited": false,
    "created_at": "2026-10-01T12:48:23.000000Z",
    "status": "pending",
    "rejection_reason": null,
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    }
  }
}
```

<sub>End of `POST /api/v1/me/reviews` · [back to contents](#contents)</sub>

---

<a id="post-me-reviews-photos"></a>

### `POST /api/v1/me/reviews/photos`

Upload a photo to attach to a review.

Auth: token

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `file` | Yes | File, file type jpg, jpeg, png, webp, up to 2048 KB, image max_width=8000, max_height=8000 |

**Example**

```http
POST /api/v1/me/reviews/photos
Authorization: Bearer <token>
```
Sent as `multipart/form-data`:

| Field | Value |
| --- | --- |
| `file` | a file |

Response `201`
```json
{
  "data": {
    "id": 4,
    "url": "http://localhost:8000/storage/media/2026/10/01M3VR4FENQEX3S2ZWN6NQRP5R/full.webp",
    "sizes": {
      "thumb": "http://localhost:8000/storage/media/2026/10/01M3VR4FENQEX3S2ZWN6NQRP5R/thumb.webp",
      "card": "http://localhost:8000/storage/media/2026/10/01M3VR4FENQEX3S2ZWN6NQRP5R/card.webp",
      "full": "http://localhost:8000/storage/media/2026/10/01M3VR4FENQEX3S2ZWN6NQRP5R/full.webp"
    },
    "width": 64,
    "height": 64,
    "alt": null
  }
}
```

<sub>End of `POST /api/v1/me/reviews/photos` · [back to contents](#contents)</sub>

---

<a id="put-me-reviews-review"></a>

### `PUT /api/v1/me/reviews/{review}`

Change it while it is still waiting.

Auth: token

Path: `review`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `rating` | Yes | Integer, at least 1, at most 5 |
| `comment` | No | String, up to 2000 characters, may be `null` |

**Example**

```http
PUT /api/v1/me/reviews/1
Authorization: Bearer <token>
```
```json
{
  "rating": 4,
  "comment": "Good, though the bracket was fiddly."
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "rating": 4,
    "comment": "Good, though the bracket was fiddly.",
    "photos": [],
    "is_edited": false,
    "created_at": "2026-10-01T12:48:23.000000Z",
    "status": "pending",
    "rejection_reason": null,
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    }
  }
}
```

<sub>End of `PUT /api/v1/me/reviews/{review}` · [back to contents](#contents)</sub>

---

<a id="delete-me-reviews-review"></a>

### `DELETE /api/v1/me/reviews/{review}`

Take it back.

Auth: token

Path: `review`

**Example**

```http
DELETE /api/v1/me/reviews/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/me/reviews/{review}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Roles and staff

---

<a id="get-permissions"></a>

### `GET /api/v1/permissions`

Permission catalogue, by page.

Auth: token with permission `roles.view`

**Example**

```http
GET /api/v1/permissions
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "page": "products",
      "label": "Products",
      "permissions": [
        {
          "name": "products.view",
          "action": "view",
          "label": "View"
        }
      ]
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/permissions` · [back to contents](#contents)</sub>

---

<a id="get-roles"></a>

### `GET /api/v1/roles`

Roles, with holder counts.

Auth: token with permission `roles.view`

**Example**

```http
GET /api/v1/roles
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 2,
      "name": "customer",
      "is_reserved": true,
      "permissions": [],
      "users_count": 2,
      "created_at": "2026-10-01T12:48:08+00:00",
      "updated_at": "2026-10-01T12:48:08+00:00"
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/roles` · [back to contents](#contents)</sub>

---

<a id="get-roles-role"></a>

### `GET /api/v1/roles/{role}`

One role.

Auth: token with permission `roles.view`

Path: `role`

**Example**

```http
GET /api/v1/roles/3
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "name": "Packer",
    "is_reserved": false,
    "permissions": [
      "orders.view"
    ],
    "users_count": 0,
    "created_at": "2026-10-01T12:48:21+00:00",
    "updated_at": "2026-10-01T12:48:21+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/roles/{role}` · [back to contents](#contents)</sub>

---

<a id="post-roles"></a>

### `POST /api/v1/roles`

Create a role.

Auth: token with permission `roles.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 125 characters, not `super-admin`, `customer`, must not be taken |
| `permissions` | Yes (may be empty) | List |
| `permissions[]` | No | String, no repeats, one of `products.view`, `products.create`, `products.update`, `products.delete`, `products.import`, `products.export`, `categories.view`, `categories.create`, `categories.update`, `categories.delete`, `brands.view`, `brands.create`, `brands.update`, `brands.delete`, `inventory.view`, `inventory.adjust`, `inventory.receive`, `shipping.view`, `shipping.update`, `orders.view`, `orders.update`, `orders.fulfil`, `orders.cancel`, `orders.refund`, `customers.view`, `customers.update`, `customers.delete`, `discounts.view`, `discounts.create`, `discounts.update`, `discounts.delete`, `reviews.view`, `reviews.moderate`, `reviews.delete`, `reports.view`, `reports.export`, `settings.view`, `settings.update`, `staff.view`, `staff.create`, `staff.update`, `staff.delete`, `roles.view`, `roles.create`, `roles.update`, `roles.delete`, `roles.assign`, `media.upload`, `media.delete`, `storefront.view`, `storefront.update`, `content.view`, `content.create`, `content.update`, `content.delete`, `marketing.view`, `marketing.update`, `dashboard.view`, `activity-log.view` |

**Example**

```http
POST /api/v1/roles
Authorization: Bearer <token>
```
```json
{
  "name": "Packer",
  "permissions": [
    "orders.view",
    "orders.fulfil"
  ]
}
```

Response `201`
```json
{
  "data": {
    "id": 3,
    "name": "Packer",
    "is_reserved": false,
    "permissions": [
      "orders.view"
    ],
    "users_count": 0,
    "created_at": "2026-10-01T12:48:21+00:00",
    "updated_at": "2026-10-01T12:48:21+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/roles` · [back to contents](#contents)</sub>

---

<a id="put-roles-role"></a>

### `PUT /api/v1/roles/{role}`

Rename or re-cut a role.

Auth: token with permission `roles.update`

Path: `role`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 125 characters, not `super-admin`, `customer`, must not be taken |
| `permissions` | Yes (may be empty) | List |
| `permissions[]` | No | String, no repeats, one of `products.view`, `products.create`, `products.update`, `products.delete`, `products.import`, `products.export`, `categories.view`, `categories.create`, `categories.update`, `categories.delete`, `brands.view`, `brands.create`, `brands.update`, `brands.delete`, `inventory.view`, `inventory.adjust`, `inventory.receive`, `shipping.view`, `shipping.update`, `orders.view`, `orders.update`, `orders.fulfil`, `orders.cancel`, `orders.refund`, `customers.view`, `customers.update`, `customers.delete`, `discounts.view`, `discounts.create`, `discounts.update`, `discounts.delete`, `reviews.view`, `reviews.moderate`, `reviews.delete`, `reports.view`, `reports.export`, `settings.view`, `settings.update`, `staff.view`, `staff.create`, `staff.update`, `staff.delete`, `roles.view`, `roles.create`, `roles.update`, `roles.delete`, `roles.assign`, `media.upload`, `media.delete`, `storefront.view`, `storefront.update`, `content.view`, `content.create`, `content.update`, `content.delete`, `marketing.view`, `marketing.update`, `dashboard.view`, `activity-log.view` |

**Example**

```http
PUT /api/v1/roles/3
Authorization: Bearer <token>
```
```json
{
  "name": "Packer",
  "permissions": [
    "orders.view",
    "orders.fulfil",
    "inventory.view"
  ]
}
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "name": "Packer",
    "is_reserved": false,
    "permissions": [
      "orders.view"
    ],
    "users_count": 0,
    "created_at": "2026-10-01T12:48:21+00:00",
    "updated_at": "2026-10-01T12:48:21+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `PUT /api/v1/roles/{role}` · [back to contents](#contents)</sub>

---

<a id="delete-roles-role"></a>

### `DELETE /api/v1/roles/{role}`

Delete an unheld role.

Auth: token with permission `roles.delete`

Path: `role`

**Example**

```http
DELETE /api/v1/roles/3
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/roles/{role}` · [back to contents](#contents)</sub>

---

<a id="get-staff"></a>

### `GET /api/v1/staff`

Back office accounts.

Auth: token with permission `staff.view` · _paginated_

**Example**

```http
GET /api/v1/staff
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Store Owner",
      "email": "owner@example.com",
      "email_verified": true,
      "email_verified_at": "2026-10-01T12:48:08+00:00",
      "phone": null,
      "phone_verified": false,
      "avatar_url": null,
      "has_password": true,
      "google_linked": false,
      "is_active": true,
      "is_staff": true,
      "roles": [
        "super-admin"
      ],
      "permissions": [
        "products.view"
      ],
      "last_login_at": "2026-10-01T12:48:19+00:00",
      "created_at": "2026-10-01T12:48:08+00:00",
      "updated_at": "2026-10-01T12:48:19+00:00"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/staff?page=1",
    "last": "http://localhost:8000/api/v1/staff?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/staff",
    "per_page": 25,
    "to": 1,
    "total": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/staff` · [back to contents](#contents)</sub>

---

<a id="get-staff-staff"></a>

### `GET /api/v1/staff/{staff}`

One staff account.

Auth: token with permission `staff.view`

Path: `staff`

**Example**

```http
GET /api/v1/staff/4
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 4,
    "name": "Shop Assistant",
    "email": "assistant@example.com",
    "email_verified": true,
    "email_verified_at": "2026-10-01T12:48:21+00:00",
    "phone": null,
    "phone_verified": false,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": true,
    "is_staff": true,
    "roles": [
      "Packer"
    ],
    "permissions": [
      "inventory.view"
    ],
    "last_login_at": null,
    "created_at": "2026-10-01T12:48:21+00:00",
    "updated_at": "2026-10-01T12:48:21+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/staff/{staff}` · [back to contents](#contents)</sub>

---

<a id="post-staff"></a>

### `POST /api/v1/staff`

Create a staff account.

Auth: token with permission `staff.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |
| `email` | Yes | String, email address, up to 255 characters, must not be taken |
| `password` | Yes | String, 12+ characters with upper and lower case, a number and a symbol |
| `role` | Yes | String, not `customer`, must exist in `roles` |
| `is_active` | No | Boolean |

**Example**

```http
POST /api/v1/staff
Authorization: Bearer <token>
```
```json
{
  "name": "Shop Assistant",
  "email": "assistant@example.com",
  "password": "Demo-Password-1!",
  "role": "Packer",
  "is_active": true
}
```

Response `201`
```json
{
  "data": {
    "id": 4,
    "name": "Shop Assistant",
    "email": "assistant@example.com",
    "email_verified": true,
    "email_verified_at": "2026-10-01T12:48:21+00:00",
    "phone": null,
    "phone_verified": false,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": true,
    "is_staff": true,
    "roles": [
      "Packer"
    ],
    "permissions": [
      "inventory.view"
    ],
    "last_login_at": null,
    "created_at": "2026-10-01T12:48:21+00:00",
    "updated_at": "2026-10-01T12:48:21+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/staff` · [back to contents](#contents)</sub>

---

<a id="put-staff-staff"></a>

### `PUT /api/v1/staff/{staff}`

Update, re-role, reset password.

Auth: token with permission `staff.update`

Path: `staff`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |
| `email` | Yes | String, email address, up to 255 characters, must not be taken |
| `password` | Yes | String, 12+ characters with upper and lower case, a number and a symbol |
| `role` | Yes | String, not `customer`, must exist in `roles` |
| `is_active` | No | Boolean |

**Example**

```http
PUT /api/v1/staff/4
Authorization: Bearer <token>
```
```json
{
  "is_active": false
}
```

Response `200`
```json
{
  "data": {
    "id": 4,
    "name": "Shop Assistant",
    "email": "assistant@example.com",
    "email_verified": true,
    "email_verified_at": "2026-10-01T12:48:21+00:00",
    "phone": null,
    "phone_verified": false,
    "avatar_url": null,
    "has_password": true,
    "google_linked": false,
    "is_active": false,
    "is_staff": true,
    "roles": [
      "Packer"
    ],
    "permissions": [
      "inventory.view"
    ],
    "last_login_at": null,
    "created_at": "2026-10-01T12:48:21+00:00",
    "updated_at": "2026-10-01T12:48:21+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `PUT /api/v1/staff/{staff}` · [back to contents](#contents)</sub>

---

<a id="delete-staff-staff"></a>

### `DELETE /api/v1/staff/{staff}`

Delete a staff account.

Auth: token with permission `staff.delete`

Path: `staff`

**Example**

```http
DELETE /api/v1/staff/4
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/staff/{staff}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Dashboard, reports and the activity log

---

<a id="get-admin-dashboard"></a>

### `GET /api/v1/admin/dashboard`

Sales, visitors, queues and the chart.

Auth: token with permission `dashboard.view`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `to` | date | `YYYY-MM-DD` |
| `from` | date | `YYYY-MM-DD` |

**Example**

```http
GET /api/v1/admin/dashboard
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "range": {
      "from": "2026-09-02",
      "to": "2026-10-01"
    },
    "totals": {
      "orders": 1,
      "gross": 115250,
      "revenue": 101000,
      "vat": 14250,
      "shipping": 6000,
      "average_order": 115250,
      "visitors": 1,
      "new_customers": 2
    },
    "today": {
      "orders": 1,
      "gross": 115250,
      "revenue": 101000,
      "vat": 14250,
      "shipping": 6000,
      "average_order": 115250,
      "visitors": 1,
      "new_customers": 2
    },
    "orders_by_status": {
      "pending": 0,
      "confirmed": 0,
      "processing": 0,
      "packed": 0,
      "shipped": 0,
      "delivered": 1,
      "cancelled": 1,
      "returned": 0,
      "refunded": 0
    },
    "chart": [
      {
        "date": "2026-09-02",
        "orders": 0,
        "revenue": 0,
        "visitors": 0
      }
    ],
    "top_products": [
      {
        "product_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "quantity": 1,
        "revenue": 109250
      }
    ],
    "most_viewed": [
      {
        "product_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "views": 1
      }
    ],
    "needs_attention": {
      "pending_orders": 0,
      "processing_orders": 0,
      "pending_reviews": 0,
      "unread_messages": 0,
      "out_of_stock": 3
    },
    "recent_orders": [
      {
        "id": 2,
        "number": "261001-BLTFT",
        "customer": "Walk-in Customer",
        "status": "delivered",
        "payment_status": "paid",
        "grand_total": 115250,
        "placed_at": "2026-10-01T12:48:18.000000Z"
      }
    ],
    "low_stock": [
      {
        "variant_id": 8,
        "product": "Emergency Exit Light",
        "sku": "EL-EXIT-01",
        "stock": 0
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/dashboard` · [back to contents](#contents)</sub>

---

<a id="get-admin-reports"></a>

### `GET /api/v1/admin/reports`

The reports that can be asked for.

Auth: token with permission `reports.view`

**Example**

```http
GET /api/v1/admin/reports
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "type": "sales",
      "label": "Sales by day",
      "dated": true
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/reports` · [back to contents](#contents)</sub>

---

<a id="get-admin-reports-type"></a>

### `GET /api/v1/admin/reports/{type}`

One report: `columns`, `rows`, `totals`.

Auth: token with permission `reports.view`

Path: `type` (one of `sales`, `product`, `inventory`, `customer`, `order`, `coupon`, `tax`, `revenue`)

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `status` | string | |
| `to` | date | `YYYY-MM-DD` |
| `from` | date | `YYYY-MM-DD` |

**Example**

```http
GET /api/v1/admin/reports/sales?from=2026-09-01&to=2026-09-30
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "type": "sales",
    "label": "Sales by day",
    "columns": [
      {
        "key": "date",
        "label": "Date",
        "type": "date"
      }
    ],
    "rows": [],
    "totals": {
      "orders": 0,
      "subtotal": 0,
      "discount": 0,
      "vat": 0,
      "shipping": 0,
      "gross": 0,
      "revenue": 0
    },
    "range": {
      "from": "2026-09-01",
      "to": "2026-09-30"
    }
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/reports/{type}` · [back to contents](#contents)</sub>

---

<a id="post-admin-reports-type-exports"></a>

### `POST /api/v1/admin/reports/{type}/exports`

Ask for it as a file (queued).

Auth: token with permission `reports.export`

Path: `type` (one of `sales`, `product`, `inventory`, `customer`, `order`, `coupon`, `tax`, `revenue`)

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `format` | No | One of `xlsx`, `csv`, `pdf` |
| `from` | No | Date, `date` |
| `to` | No | Date, `date`, on or after `from` |
| `status` | No | String, up to 32 characters |

**Example**

```http
POST /api/v1/admin/reports/sales/exports
Authorization: Bearer <token>
```
```json
{
  "format": "xlsx",
  "from": "2026-09-01",
  "to": "2026-09-30"
}
```

Response `202`
```json
{
  "data": {
    "id": 1,
    "type": "sales",
    "format": "xlsx",
    "status": null,
    "row_count": null,
    "size_bytes": null,
    "error": null,
    "is_downloadable": false,
    "completed_at": null,
    "expires_at": null,
    "created_at": "2026-10-01T12:48:21.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/reports/{type}/exports` · [back to contents](#contents)</sub>

---

<a id="get-admin-report-exports"></a>

### `GET /api/v1/admin/report-exports`

Files asked for, and whether they are ready.

Auth: token with permission `reports.export` · _paginated_

**Example**

```http
GET /api/v1/admin/report-exports
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "type": "sales",
      "format": "xlsx",
      "status": "ready",
      "row_count": 0,
      "size_bytes": 4515,
      "error": null,
      "is_downloadable": true,
      "requested_by": "Store Owner",
      "completed_at": "2026-10-01T12:48:21.000000Z",
      "expires_at": "2026-10-08T12:48:21.000000Z",
      "created_at": "2026-10-01T12:48:21.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/report-exports?page=1",
    "last": "http://localhost:8000/api/v1/admin/report-exports?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/report-exports",
    "per_page": 25,
    "to": 1,
    "total": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/report-exports` · [back to contents](#contents)</sub>

---

<a id="get-admin-report-exports-reportexport-download"></a>

### `GET /api/v1/admin/report-exports/{reportExport}/download`

Download one.

Auth: token with permission `reports.export`

Path: `reportExport`

**Example**

```http
GET /api/v1/admin/report-exports/1/download
Authorization: Bearer <token>
```

Response `200`: a spreadsheet file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

<sub>End of `GET /api/v1/admin/report-exports/{reportExport}/download` · [back to contents](#contents)</sub>

---

<a id="get-admin-activity-log"></a>

### `GET /api/v1/admin/activity-log`

Who did what, with before and after.

Auth: token with permission `activity-log.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `log` | one of `admin`, `account`, `security`, `system` | |
| `event` | string | |
| `causer_id` | integer | |
| `subject_type` | string | |
| `subject_id` | integer | |
| `from` | date | `YYYY-MM-DD` |
| `to` | date | `YYYY-MM-DD` |
| `q` | string | search text |

**Example**

```http
GET /api/v1/admin/activity-log?log=admin
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 117,
      "log": "admin",
      "event": "deleted",
      "description": "deleted",
      "causer": {
        "id": 1,
        "name": "Store Owner"
      },
      "subject": {
        "type": "App\\Models\\NewsletterCampaign",
        "id": 2
      },
      "changes": {
        "old": {
          "subject": "Draft to delete",
          "body": "Never sent.",
          "status": "draft",
          "recipient_count": 0,
          "sent_count": 0,
          "scheduled_at": null,
          "sent_at": null,
          "user_id": 1
        },
        "new": null
      },
      "context": {
        "ip": "127.0.0.1",
        "user_agent": "Python-urllib/3.9",
        "request_id": "6910314b-4db0-47f8-95ca-1326df9382a6"
      },
      "created_at": "2026-10-01T12:48:21.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/activity-log?page=1",
    "last": "http://localhost:8000/api/v1/admin/activity-log?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/v1/admin/activity-log?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/activity-log",
    "per_page": 25,
    "to": 25,
    "total": 105,
    "logs": [
      "admin"
    ],
    "events": [
      "bulk_flag"
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/activity-log` · [back to contents](#contents)</sub>

---

<a id="get-admin-activity-log-type-id"></a>

### `GET /api/v1/admin/activity-log/{type}/{id}`

Everything that happened to one record.

Auth: token with permission `activity-log.view` · _paginated_

Path: `type` (the record type, as `subject_type` in the log (for example `order`)), `id`

**Example**

```http
GET /api/v1/admin/activity-log/App\Models\Order/2
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 89,
      "log": "admin",
      "event": "order_status",
      "description": "Order 261001-BLTFT: shipped to delivered",
      "causer": {
        "id": 1,
        "name": "Store Owner"
      },
      "subject": {
        "type": "App\\Models\\Order",
        "id": 2
      },
      "changes": {
        "old": {
          "status": "shipped"
        },
        "new": {
          "status": "delivered"
        }
      },
      "context": {
        "note": null,
        "ip": "127.0.0.1",
        "user_agent": "Python-urllib/3.9",
        "request_id": "8d470ddc-f155-4915-b82c-1aaa61418b4a"
      },
      "created_at": "2026-10-01T12:48:20.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/activity-log/App%5CModels%5COrder/2?page=1",
    "last": "http://localhost:8000/api/v1/admin/activity-log/App%5CModels%5COrder/2?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/activity-log/App%5CModels%5COrder/2",
    "per_page": 25,
    "to": 5,
    "total": 5
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/activity-log/{type}/{id}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Store settings and media

---

<a id="get-admin-settings"></a>

### `GET /api/v1/admin/settings`

Every store setting.

Auth: token with permission `settings.view`

**Example**

```http
GET /api/v1/admin/settings
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "store_name": "Demo Safety Store",
    "store_email": "shop@example.com",
    "store_phone": "+8801700000000",
    "store_address": "12/A Motijheel\nDhaka 1000",
    "default_vat_rate_bp": 1500,
    "vat_on_shipping": false,
    "low_stock_threshold": 5,
    "cod_enabled": true,
    "bank_transfer_enabled": true,
    "bank_transfer_instructions": null,
    "order_payment_timeout_minutes": 30,
    "logo_url": null,
    "favicon_url": null,
    "invoice_logo_url": null
  }
}
```

<sub>End of `GET /api/v1/admin/settings` · [back to contents](#contents)</sub>

---

<a id="put-admin-settings"></a>

### `PUT /api/v1/admin/settings`

Change settings; send only the keys being changed.

Auth: token with permission `settings.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `store_name` | Yes | String, up to 120 characters |
| `store_email` | No | String, email address, up to 255 characters, may be `null` |
| `store_phone` | No | String, up to 32 characters, may be `null` |
| `store_address` | No | String, up to 500 characters, may be `null` |
| `default_vat_rate_bp` | Yes | Integer, at least 0, at most 10000 |
| `vat_on_shipping` | Yes | Boolean |
| `low_stock_threshold` | Yes | Integer, at least 0, at most 100000 |
| `cod_enabled` | Yes | Boolean |
| `bank_transfer_enabled` | Yes | Boolean |
| `bank_transfer_instructions` | No | String, up to 2000 characters, may be `null` |
| `order_payment_timeout_minutes` | Yes | Integer, at least 5, at most 1440 |

**Example**

```http
PUT /api/v1/admin/settings
Authorization: Bearer <token>
```
```json
{
  "store_name": "Demo Safety Store",
  "store_phone": "+8801700000000",
  "default_vat_rate_bp": 1500,
  "vat_on_shipping": false,
  "cod_enabled": true,
  "bank_transfer_enabled": true,
  "low_stock_threshold": 5,
  "order_payment_timeout_minutes": 30
}
```

Response `200`
```json
{
  "data": {
    "store_name": "Demo Safety Store",
    "store_email": "shop@example.com",
    "store_phone": "+8801700000000",
    "store_address": "12/A Motijheel\nDhaka 1000",
    "default_vat_rate_bp": 1500,
    "vat_on_shipping": false,
    "low_stock_threshold": 5,
    "cod_enabled": true,
    "bank_transfer_enabled": true,
    "bank_transfer_instructions": null,
    "order_payment_timeout_minutes": 30,
    "logo_url": null,
    "favicon_url": null,
    "invoice_logo_url": null
  }
}
```

<sub>End of `PUT /api/v1/admin/settings` · [back to contents](#contents)</sub>

---

<a id="post-admin-settings-assets-asset"></a>

### `POST /api/v1/admin/settings/assets/{asset}`

Replace a store file (multipart `file`).

Auth: token with permission `settings.update`

Path: `asset` (one of `logo`, `favicon`, `invoice-logo`)

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `file` | Yes | File, file type png, jpg, jpeg, webp, ico, up to 2048 KB |

**Example**

```http
POST /api/v1/admin/settings/assets/logo
Authorization: Bearer <token>
```
Sent as `multipart/form-data`:

| Field | Value |
| --- | --- |
| `file` | a file |

Response `200`
```json
{
  "data": {
    "store_name": "Demo Safety Store",
    "store_email": "shop@example.com",
    "store_phone": "+8801700000000",
    "store_address": "12/A Motijheel\nDhaka 1000",
    "default_vat_rate_bp": 1500,
    "vat_on_shipping": false,
    "low_stock_threshold": 5,
    "cod_enabled": true,
    "bank_transfer_enabled": true,
    "bank_transfer_instructions": null,
    "order_payment_timeout_minutes": 30,
    "logo_url": "http://localhost:8000/storage/system/logo-url-rzz02vikveq4.png",
    "favicon_url": null,
    "invoice_logo_url": null
  }
}
```

<sub>End of `POST /api/v1/admin/settings/assets/{asset}` · [back to contents](#contents)</sub>

---

<a id="post-admin-media"></a>

### `POST /api/v1/admin/media`

Upload an image (multipart `file`, optional `alt`).

Auth: token with permission `media.upload`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `file` | Yes | File, file type jpg, jpeg, png, webp, up to 5120 KB, image max_width=8000, max_height=8000 |
| `alt` | No | String, up to 255 characters, may be `null` |

**Example**

```http
POST /api/v1/admin/media
Authorization: Bearer <token>
```
Sent as `multipart/form-data`:

| Field | Value |
| --- | --- |
| `file` | a file |
| `alt` | `Fire extinguisher` |

Response `201`
```json
{
  "data": {
    "id": 2,
    "url": "http://localhost:8000/storage/media/2026/10/01M3VR4C32TXXMJCQ70HTPM8QR/full.webp",
    "sizes": {
      "thumb": "http://localhost:8000/storage/media/2026/10/01M3VR4C32TXXMJCQ70HTPM8QR/thumb.webp",
      "card": "http://localhost:8000/storage/media/2026/10/01M3VR4C32TXXMJCQ70HTPM8QR/card.webp",
      "full": "http://localhost:8000/storage/media/2026/10/01M3VR4C32TXXMJCQ70HTPM8QR/full.webp"
    },
    "width": 64,
    "height": 64,
    "mime_type": "image/webp",
    "size_bytes": 90,
    "alt": "Fire extinguisher",
    "is_attached": false,
    "created_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/media` · [back to contents](#contents)</sub>

---

<a id="delete-admin-media-media"></a>

### `DELETE /api/v1/admin/media/{media}`

Delete an image.

Auth: token with permission `media.delete`

Path: `media`

**Example**

```http
DELETE /api/v1/admin/media/2
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/media/{media}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Catalogue

---

<a id="get-admin-brands"></a>

### `GET /api/v1/admin/brands`

Brands, with product counts (`q` to search).

Auth: token with permission `brands.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string | search text |

**Example**

```http
GET /api/v1/admin/brands
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/brands?page=1",
    "last": "http://localhost:8000/api/v1/admin/brands?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": null,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/brands",
    "per_page": 25,
    "to": null,
    "total": 0
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/brands` · [back to contents](#contents)</sub>

---

<a id="get-admin-brands-brand"></a>

### `GET /api/v1/admin/brands/{brand}`

One brand.

Auth: token with permission `brands.view`

Path: `brand`

**Example**

```http
GET /api/v1/admin/brands/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "name": "Firex",
    "slug": "firex",
    "description": "Extinguishers and blankets.",
    "is_active": true,
    "sort_order": 0,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "logo": null,
    "banner": null,
    "products_count": 0,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `GET /api/v1/admin/brands/{brand}` · [back to contents](#contents)</sub>

---

<a id="post-admin-brands"></a>

### `POST /api/v1/admin/brands`

Create a brand (logo/banner by media id).

Auth: token with permission `brands.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |
| `slug` | No | String, up to 180 characters, may be `null` |
| `description` | No | String, up to 5000 characters, may be `null` |
| `is_active` | No | Boolean |
| `sort_order` | No | Integer, at least 0, at most 65535 |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |
| `seo_keywords` | No | String, up to 500 characters, may be `null` |
| `logo_image_id` | No | Integer, an existing `media` id, may be `null` |
| `banner_image_id` | No | Integer, an existing `media` id, may be `null` |

**Example**

```http
POST /api/v1/admin/brands
Authorization: Bearer <token>
```
```json
{
  "name": "Firex",
  "description": "Extinguishers and blankets.",
  "is_active": true
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "name": "Firex",
    "slug": "firex",
    "description": "Extinguishers and blankets.",
    "is_active": true,
    "sort_order": null,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "logo": null,
    "banner": null,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/brands` · [back to contents](#contents)</sub>

---

<a id="put-admin-brands-brand"></a>

### `PUT /api/v1/admin/brands/{brand}`

Edit a brand.

Auth: token with permission `brands.update`

Path: `brand`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | No | String, at least 1 character, up to 255 characters |
| `slug` | No | String, up to 180 characters, may be `null` |
| `description` | No | String, up to 5000 characters, may be `null` |
| `is_active` | No | Boolean |
| `sort_order` | No | Integer, at least 0, at most 65535 |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |
| `seo_keywords` | No | String, up to 500 characters, may be `null` |
| `logo_image_id` | No | Integer, an existing `media` id, may be `null` |
| `banner_image_id` | No | Integer, an existing `media` id, may be `null` |

**Example**

```http
PUT /api/v1/admin/brands/1
Authorization: Bearer <token>
```
```json
{
  "description": "Fire safety equipment since 1998.",
  "sort_order": 1
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "name": "Firex",
    "slug": "firex",
    "description": "Fire safety equipment since 1998.",
    "is_active": true,
    "sort_order": 1,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "logo": null,
    "banner": null,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `PUT /api/v1/admin/brands/{brand}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-brands-brand"></a>

### `DELETE /api/v1/admin/brands/{brand}`

Delete a brand no product carries.

Auth: token with permission `brands.delete`

Path: `brand`

**Example**

```http
DELETE /api/v1/admin/brands/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/brands/{brand}` · [back to contents](#contents)</sub>

---

<a id="get-admin-categories"></a>

### `GET /api/v1/admin/categories`

The whole tree, flattened with `depth`.

Auth: token with permission `categories.view`

**Example**

```http
GET /api/v1/admin/categories
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "parent_id": null,
      "depth": 0,
      "name": "Safety equipment",
      "slug": "safety-equipment",
      "description": null,
      "vat_rate_bp": 1500,
      "is_active": true,
      "seo_title": null,
      "seo_description": null,
      "seo_keywords": null,
      "icon": null,
      "products_count": 0,
      "created_at": "2026-10-01T12:48:08+00:00",
      "updated_at": "2026-10-01T12:48:08+00:00"
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/categories` · [back to contents](#contents)</sub>

---

<a id="get-admin-categories-category"></a>

### `GET /api/v1/admin/categories/{category}`

One category.

Auth: token with permission `categories.view`

Path: `category`

**Example**

```http
GET /api/v1/admin/categories/7
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 7,
    "parent_id": 1,
    "name": "Hose reels",
    "slug": "hose-reels",
    "description": null,
    "vat_rate_bp": 1500,
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "icon": null,
    "banner": null,
    "products_count": 0,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `GET /api/v1/admin/categories/{category}` · [back to contents](#contents)</sub>

---

<a id="post-admin-categories"></a>

### `POST /api/v1/admin/categories`

Create a category (`parent_id` to nest).

Auth: token with permission `categories.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |
| `slug` | No | String, up to 180 characters, may be `null` |
| `parent_id` | No | Integer, an existing `categories` id, may be `null` |
| `description` | No | String, up to 5000 characters, may be `null` |
| `vat_rate_bp` | No | Integer, at least 0, at most 10000, may be `null` |
| `is_active` | No | Boolean |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |
| `seo_keywords` | No | String, up to 500 characters, may be `null` |
| `icon_image_id` | No | Integer, an existing `media` id, may be `null` |
| `banner_image_id` | No | Integer, an existing `media` id, may be `null` |

**Example**

```http
POST /api/v1/admin/categories
Authorization: Bearer <token>
```
```json
{
  "name": "Hose reels",
  "parent_id": 1,
  "vat_rate_bp": 1500,
  "is_active": true
}
```

Response `201`
```json
{
  "data": {
    "id": 7,
    "parent_id": 1,
    "name": "Hose reels",
    "slug": "hose-reels",
    "description": null,
    "vat_rate_bp": 1500,
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "icon": null,
    "banner": null,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/categories` · [back to contents](#contents)</sub>

---

<a id="put-admin-categories-category"></a>

### `PUT /api/v1/admin/categories/{category}`

Edit details, VAT rate, SEO, images.

Auth: token with permission `categories.update`

Path: `category`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | No | String, at least 1 character, up to 255 characters |
| `slug` | No | String, up to 180 characters, may be `null` |
| `description` | No | String, up to 5000 characters, may be `null` |
| `vat_rate_bp` | No | Integer, at least 0, at most 10000, may be `null` |
| `is_active` | No | Boolean |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |
| `seo_keywords` | No | String, up to 500 characters, may be `null` |
| `icon_image_id` | No | Integer, an existing `media` id, may be `null` |
| `banner_image_id` | No | Integer, an existing `media` id, may be `null` |

**Example**

```http
PUT /api/v1/admin/categories/7
Authorization: Bearer <token>
```
```json
{
  "description": "Wall mounted hose reels."
}
```

Response `200`
```json
{
  "data": {
    "id": 7,
    "parent_id": 1,
    "name": "Hose reels",
    "slug": "hose-reels",
    "description": "Wall mounted hose reels.",
    "vat_rate_bp": 1500,
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "icon": null,
    "banner": null,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `PUT /api/v1/admin/categories/{category}` · [back to contents](#contents)</sub>

---

<a id="put-admin-categories-category-move"></a>

### `PUT /api/v1/admin/categories/{category}/move`

Move under `parent_id` at `position`.

Auth: token with permission `categories.update`

Path: `category`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `parent_id` | Yes (may be empty) | Integer, an existing `categories` id, may be `null` |
| `position` | No | Integer, at least 0, may be `null` |

**Example**

```http
PUT /api/v1/admin/categories/7/move
Authorization: Bearer <token>
```
```json
{
  "parent_id": null,
  "position": 0
}
```

Response `200`
```json
{
  "data": {
    "id": 7,
    "parent_id": null,
    "name": "Hose reels",
    "slug": "hose-reels",
    "description": "Wall mounted hose reels.",
    "vat_rate_bp": 1500,
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `PUT /api/v1/admin/categories/{category}/move` · [back to contents](#contents)</sub>

---

<a id="delete-admin-categories-category"></a>

### `DELETE /api/v1/admin/categories/{category}`

Delete an empty category.

Auth: token with permission `categories.delete`

Path: `category`

**Example**

```http
DELETE /api/v1/admin/categories/7
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/categories/{category}` · [back to contents](#contents)</sub>

---

<a id="get-admin-option-types"></a>

### `GET /api/v1/admin/option-types`

Size, Weight, Volume.

Auth: token with permission `products.view`

**Example**

```http
GET /api/v1/admin/option-types
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 2,
      "name": "Size"
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/option-types` · [back to contents](#contents)</sub>

---

<a id="post-admin-option-types"></a>

### `POST /api/v1/admin/option-types`

Add one.

Auth: token with permission `products.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, up to 64 characters, must not be taken |

**Example**

```http
POST /api/v1/admin/option-types
Authorization: Bearer <token>
```
```json
{
  "name": "Length"
}
```

Response `201`
```json
{
  "data": {
    "id": 3,
    "name": "Length"
  }
}
```

<sub>End of `POST /api/v1/admin/option-types` · [back to contents](#contents)</sub>

---

<a id="put-admin-option-types-optiontype"></a>

### `PUT /api/v1/admin/option-types/{optionType}`

Rename one.

Auth: token with permission `products.update`

Path: `optionType`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, up to 64 characters, must not be taken |

**Example**

```http
PUT /api/v1/admin/option-types/3
Authorization: Bearer <token>
```
```json
{
  "name": "Length (m)"
}
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "name": "Length (m)"
  }
}
```

<sub>End of `PUT /api/v1/admin/option-types/{optionType}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-option-types-optiontype"></a>

### `DELETE /api/v1/admin/option-types/{optionType}`

Delete one no product uses.

Auth: token with permission `products.update`

Path: `optionType`

**Example**

```http
DELETE /api/v1/admin/option-types/3
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/option-types/{optionType}` · [back to contents](#contents)</sub>

---

<a id="get-admin-products"></a>

### `GET /api/v1/admin/products`

Products, drafts included, with filters.

Auth: token with permission `products.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `status` | one of `draft`, `active`, `hidden` | |
| `q` | string | search text |
| `brand_id` | integer | |
| `category_id` | integer | |
| `stock` | string | |
| `flag` | string | |
| `sort` | string | |

**Example**

```http
GET /api/v1/admin/products
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 9,
      "name": "Not Yet On Sale (draft)",
      "slug": "not-yet-on-sale-draft",
      "status": "draft",
      "sku": "DRAFT-01",
      "min_price": 100000,
      "max_price": 100000,
      "in_stock": true,
      "stock_total": 10,
      "variants_count": 1,
      "is_featured": false,
      "is_trending": false,
      "is_new_arrival": false,
      "is_best_seller": false,
      "brand": null,
      "category": {
        "id": 4,
        "name": "Hardware"
      },
      "image": null,
      "updated_at": "2026-10-01T12:48:08+00:00"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/products?page=1",
    "last": "http://localhost:8000/api/v1/admin/products?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/products",
    "per_page": 25,
    "to": 9,
    "total": 9
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/products` · [back to contents](#contents)</sub>

---

<a id="get-admin-products-product"></a>

### `GET /api/v1/admin/products/{product}`

One product, everything the edit form needs.

Auth: token with permission `products.view`

Path: `product`

**Example**

```http
GET /api/v1/admin/products/10
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 10,
    "name": "Fire Blanket",
    "slug": "fire-blanket",
    "status": "active",
    "brand_id": null,
    "category_id": 1,
    "brand": null,
    "category": {
      "id": 1,
      "name": "Safety equipment"
    },
    "short_description": "Glass fibre, for kitchen fires.",
    "description": "<p>Pull the tabs and smother the flames.</p>",
    "specifications": [],
    "video_url": null,
    "is_featured": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "tags": [],
    "option_type_id": 2,
    "option_name": "Size",
    "variants": [
      {
        "id": 15,
        "sku": "FB-1M",
        "is_default": true,
        "value": "1",
        "unit": "m",
        "label": "1 m",
        "price": 125000,
        "discount_price": null,
        "cost_price": 80000,
        "stock": 30,
        "low_stock_threshold": null,
        "min_order_qty": 1,
        "max_order_qty": null,
        "weight_grams": 900,
        "is_active": true,
        "image": null
      }
    ],
    "main_image": null,
    "gallery": [],
    "links": {
      "related": [],
      "cross_sell": [],
      "upsell": []
    },
    "min_price": 125000,
    "max_price": 195000,
    "in_stock": true,
    "rating_avg": 0,
    "rating_count": 0,
    "sold_count": 0,
    "view_count": 0,
    "published_at": "2026-10-01T12:48:19+00:00",
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/products/{product}` · [back to contents](#contents)</sub>

---

<a id="post-admin-products"></a>

### `POST /api/v1/admin/products`

Create a product with its variants.

Auth: token with permission `products.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, at least 1 character, up to 255 characters |
| `slug` | No | String, up to 180 characters, may be `null` |
| `brand_id` | No | Integer, an existing `brands` id, may be `null` |
| `category_id` | Yes | Integer, an existing `categories` id |
| `short_description` | No | String, up to 1000 characters, may be `null` |
| `description` | No | String, up to 200000 characters, may be `null` |
| `specifications` | No | List, up to 100 items, may be `null` |
| `specifications[].key` | Yes | String, up to 100 characters |
| `specifications[].value` | Yes | String, up to 1000 characters |
| `video_url` | No | Https URL, at most 2048, may be `null` |
| `status` | No | One of `draft`, `active`, `hidden` |
| `is_featured` | No | Boolean |
| `is_trending` | No | Boolean |
| `is_new_arrival` | No | Boolean |
| `is_best_seller` | No | Boolean |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |
| `seo_keywords` | No | String, up to 500 characters, may be `null` |
| `tags` | No | List, up to 30 items |
| `tags[]` | No | String, up to 64 characters |
| `main_image_id` | No | Integer, an existing `media` id, may be `null` |
| `gallery_image_ids` | No | List, up to 50 items |
| `gallery_image_ids[]` | No | Integer, no repeats, an existing `media` id |
| `option_type_id` | Yes (may be empty) | Integer, an existing `option_types` id, may be `null` |
| `variants` | Yes | List, at least 1 item, up to 100 items |
| `variants[].id` | Not allowed when creating | Only sent when editing, to keep an existing variant |
| `variants[].sku` | Yes | String, up to 64 characters, no repeats, must not be taken |
| `variants[].value` | When `option_type_id` is set; not allowed otherwise | String, up to 64 characters, may be `null` |
| `variants[].unit` | No | String, up to 16 characters, may be `null` |
| `variants[].price` | Yes | Integer, at least 0, at most 100000000000 |
| `variants[].discount_price` | No | Integer, at least 0, may be `null` |
| `variants[].cost_price` | No | Integer, at least 0, at most 100000000000, may be `null` |
| `variants[].stock` | No | Integer, at least 0, at most 10000000 |
| `variants[].low_stock_threshold` | No | Integer, at least 0, at most 10000000, may be `null` |
| `variants[].min_order_qty` | No | Integer, at least 1, at most 100000 |
| `variants[].max_order_qty` | No | Integer, at least 1, at most 100000, may be `null` |
| `variants[].weight_grams` | No | Integer, at least 0, at most 100000000, may be `null` |
| `variants[].image_id` | No | Integer, an existing `media` id, may be `null` |
| `variants[].is_active` | No | Boolean |

**Example**

```http
POST /api/v1/admin/products
Authorization: Bearer <token>
```
```json
{
  "name": "Fire Blanket",
  "category_id": 1,
  "short_description": "Glass fibre, for kitchen fires.",
  "description": "<p>Pull the tabs and smother the flames.</p>",
  "status": "active",
  "option_type_id": 2,
  "variants": [
    {
      "value": "1",
      "unit": "m",
      "sku": "FB-1M",
      "price": 125000,
      "cost_price": 80000,
      "stock": 30,
      "weight_grams": 900
    },
    {
      "value": "1.8",
      "unit": "m",
      "sku": "FB-18M",
      "price": 195000,
      "cost_price": 130000,
      "stock": 18,
      "weight_grams": 1500
    }
  ]
}
```

Response `201`
```json
{
  "data": {
    "id": 10,
    "name": "Fire Blanket",
    "slug": "fire-blanket",
    "status": "active",
    "brand_id": null,
    "category_id": 1,
    "brand": null,
    "category": {
      "id": 1,
      "name": "Safety equipment"
    },
    "short_description": "Glass fibre, for kitchen fires.",
    "description": "<p>Pull the tabs and smother the flames.</p>",
    "specifications": [],
    "video_url": null,
    "is_featured": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "tags": [],
    "option_type_id": 2,
    "option_name": "Size",
    "variants": [
      {
        "id": 15,
        "sku": "FB-1M",
        "is_default": true,
        "value": "1",
        "unit": "m",
        "label": "1 m",
        "price": 125000,
        "discount_price": null,
        "cost_price": 80000,
        "stock": 30,
        "low_stock_threshold": null,
        "min_order_qty": 1,
        "max_order_qty": null,
        "weight_grams": 900,
        "is_active": true,
        "image": null
      }
    ],
    "main_image": null,
    "gallery": [],
    "links": {
      "related": [],
      "cross_sell": [],
      "upsell": []
    },
    "min_price": 125000,
    "max_price": 195000,
    "in_stock": true,
    "rating_avg": 0,
    "rating_count": 0,
    "sold_count": 0,
    "view_count": 0,
    "published_at": "2026-10-01T12:48:19+00:00",
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/admin/products` · [back to contents](#contents)</sub>

---

<a id="put-admin-products-product"></a>

### `PUT /api/v1/admin/products/{product}`

Edit; `variants` replaces the whole set.

Auth: token with permission `products.update`

Path: `product`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | No | String, at least 1 character, up to 255 characters |
| `slug` | No | String, up to 180 characters, may be `null` |
| `brand_id` | No | Integer, an existing `brands` id, may be `null` |
| `category_id` | No | Integer, an existing `categories` id |
| `short_description` | No | String, up to 1000 characters, may be `null` |
| `description` | No | String, up to 200000 characters, may be `null` |
| `specifications` | No | List, up to 100 items, may be `null` |
| `specifications[].key` | Yes | String, up to 100 characters |
| `specifications[].value` | Yes | String, up to 1000 characters |
| `video_url` | No | Https URL, at most 2048, may be `null` |
| `status` | No | One of `draft`, `active`, `hidden` |
| `is_featured` | No | Boolean |
| `is_trending` | No | Boolean |
| `is_new_arrival` | No | Boolean |
| `is_best_seller` | No | Boolean |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |
| `seo_keywords` | No | String, up to 500 characters, may be `null` |
| `tags` | No | List, up to 30 items |
| `tags[]` | No | String, up to 64 characters |
| `main_image_id` | No | Integer, an existing `media` id, may be `null` |
| `gallery_image_ids` | No | List, up to 50 items |
| `gallery_image_ids[]` | No | Integer, no repeats, an existing `media` id |
| `option_type_id` | No | Integer, sent whenever `variants` is, an existing `option_types` id, may be `null` |
| `variants` | No | List, at least 1 item, up to 100 items |
| `variants[].id` | No | Integer, no repeats |
| `variants[].sku` | Yes | String, up to 64 characters, no repeats, must not be taken |
| `variants[].value` | When `option_type_id` is set; not allowed otherwise | String, up to 64 characters, may be `null` |
| `variants[].unit` | No | String, up to 16 characters, may be `null` |
| `variants[].price` | Yes | Integer, at least 0, at most 100000000000 |
| `variants[].discount_price` | No | Integer, at least 0, may be `null` |
| `variants[].cost_price` | No | Integer, at least 0, at most 100000000000, may be `null` |
| `variants[].stock` | No | Integer, at least 0, at most 10000000 |
| `variants[].low_stock_threshold` | No | Integer, at least 0, at most 10000000, may be `null` |
| `variants[].min_order_qty` | No | Integer, at least 1, at most 100000 |
| `variants[].max_order_qty` | No | Integer, at least 1, at most 100000, may be `null` |
| `variants[].weight_grams` | No | Integer, at least 0, at most 100000000, may be `null` |
| `variants[].image_id` | No | Integer, an existing `media` id, may be `null` |
| `variants[].is_active` | No | Boolean |

**Example**

```http
PUT /api/v1/admin/products/10
Authorization: Bearer <token>
```
```json
{
  "is_featured": true,
  "short_description": "Glass fibre. Now on the home page."
}
```

Response `200`
```json
{
  "data": {
    "id": 10,
    "name": "Fire Blanket",
    "slug": "fire-blanket",
    "status": "active",
    "brand_id": null,
    "category_id": 1,
    "brand": null,
    "category": {
      "id": 1,
      "name": "Safety equipment"
    },
    "short_description": "Glass fibre. Now on the home page.",
    "description": "<p>Pull the tabs and smother the flames.</p>",
    "specifications": [],
    "video_url": null,
    "is_featured": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "tags": [],
    "option_type_id": 2,
    "option_name": "Size",
    "variants": [
      {
        "id": 15,
        "sku": "FB-1M",
        "is_default": true,
        "value": "1",
        "unit": "m",
        "label": "1 m",
        "price": 125000,
        "discount_price": null,
        "cost_price": 80000,
        "stock": 30,
        "low_stock_threshold": null,
        "min_order_qty": 1,
        "max_order_qty": null,
        "weight_grams": 900,
        "is_active": true,
        "image": null
      }
    ],
    "main_image": null,
    "gallery": [],
    "links": {
      "related": [],
      "cross_sell": [],
      "upsell": []
    },
    "min_price": 125000,
    "max_price": 195000,
    "in_stock": true,
    "rating_avg": 0,
    "rating_count": 0,
    "sold_count": 0,
    "view_count": 0,
    "published_at": "2026-10-01T12:48:19+00:00",
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `PUT /api/v1/admin/products/{product}` · [back to contents](#contents)</sub>

---

<a id="patch-admin-products-product-status"></a>

### `PATCH /api/v1/admin/products/{product}/status`

`active`, `hidden` or `draft`.

Auth: token with permission `products.update`

Path: `product`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `status` | Yes | One of `draft`, `active`, `hidden` |

**Example**

```http
PATCH /api/v1/admin/products/10/status
Authorization: Bearer <token>
```
```json
{
  "status": "hidden"
}
```

Response `200`
```json
{
  "data": {
    "id": 10,
    "name": "Fire Blanket",
    "slug": "fire-blanket",
    "status": "hidden",
    "brand_id": null,
    "category_id": 1,
    "brand": null,
    "category": {
      "id": 1,
      "name": "Safety equipment"
    },
    "short_description": "Glass fibre. Now on the home page.",
    "description": "<p>Pull the tabs and smother the flames.</p>",
    "specifications": [],
    "video_url": null,
    "is_featured": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "tags": [],
    "option_type_id": 2,
    "option_name": "Size",
    "variants": [
      {
        "id": 15,
        "sku": "FB-1M",
        "is_default": true,
        "value": "1",
        "unit": "m",
        "label": "1 m",
        "price": 125000,
        "discount_price": null,
        "cost_price": 80000,
        "stock": 30,
        "low_stock_threshold": null,
        "min_order_qty": 1,
        "max_order_qty": null,
        "weight_grams": 900,
        "is_active": true,
        "image": null
      }
    ],
    "main_image": null,
    "gallery": [],
    "links": {
      "related": [],
      "cross_sell": [],
      "upsell": []
    },
    "min_price": 125000,
    "max_price": 195000,
    "in_stock": true,
    "rating_avg": 0,
    "rating_count": 0,
    "sold_count": 0,
    "view_count": 0,
    "published_at": "2026-10-01T12:48:19+00:00",
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `PATCH /api/v1/admin/products/{product}/status` · [back to contents](#contents)</sub>

---

<a id="post-admin-products-product-duplicate"></a>

### `POST /api/v1/admin/products/{product}/duplicate`

Copy into a new draft.

Auth: token with permission `products.create`

Path: `product`

**Example**

```http
POST /api/v1/admin/products/10/duplicate
Authorization: Bearer <token>
```

Response `201`
```json
{
  "data": {
    "id": 11,
    "name": "Fire Blanket (copy)",
    "slug": "fire-blanket-copy",
    "status": "draft",
    "brand_id": null,
    "category_id": 1,
    "brand": null,
    "category": {
      "id": 1,
      "name": "Safety equipment"
    },
    "short_description": "Glass fibre. Now on the home page.",
    "description": "<p>Pull the tabs and smother the flames.</p>",
    "specifications": [],
    "video_url": null,
    "is_featured": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "tags": [],
    "option_type_id": 2,
    "option_name": "Size",
    "variants": [
      {
        "id": 17,
        "sku": "FB-1M-COPY",
        "is_default": true,
        "value": "1",
        "unit": "m",
        "label": "1 m",
        "price": 125000,
        "discount_price": null,
        "cost_price": 80000,
        "stock": 0,
        "low_stock_threshold": null,
        "min_order_qty": 1,
        "max_order_qty": null,
        "weight_grams": 900,
        "is_active": true,
        "image": null
      }
    ],
    "main_image": null,
    "gallery": [],
    "links": {
      "related": [],
      "cross_sell": [],
      "upsell": []
    },
    "min_price": 125000,
    "max_price": 195000,
    "in_stock": false,
    "rating_avg": 0,
    "rating_count": 0,
    "sold_count": 0,
    "view_count": 0,
    "published_at": null,
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/admin/products/{product}/duplicate` · [back to contents](#contents)</sub>

---

<a id="put-admin-products-product-links"></a>

### `PUT /api/v1/admin/products/{product}/links`

Related, cross-sell and upsell products.

Auth: token with permission `products.update`

Path: `product`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `related` | No | List, up to 50 items |
| `related[]` | No | Integer, no repeats, an existing `products` id |
| `cross_sell` | No | List, up to 50 items |
| `cross_sell[]` | No | Integer, no repeats, an existing `products` id |
| `upsell` | No | List, up to 50 items |
| `upsell[]` | No | Integer, no repeats, an existing `products` id |

**Example**

```http
PUT /api/v1/admin/products/10/links
Authorization: Bearer <token>
```
```json
{
  "related": [
    1
  ],
  "cross_sell": [],
  "upsell": []
}
```

Response `200`
```json
{
  "data": {
    "id": 10,
    "name": "Fire Blanket",
    "slug": "fire-blanket",
    "status": "hidden",
    "brand_id": null,
    "category_id": 1,
    "brand": null,
    "category": {
      "id": 1,
      "name": "Safety equipment"
    },
    "short_description": "Glass fibre. Now on the home page.",
    "description": "<p>Pull the tabs and smother the flames.</p>",
    "specifications": [],
    "video_url": null,
    "is_featured": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_best_seller": false,
    "seo_title": null,
    "seo_description": null,
    "seo_keywords": null,
    "tags": [],
    "option_type_id": 2,
    "option_name": "Size",
    "variants": [
      {
        "id": 15,
        "sku": "FB-1M",
        "is_default": true,
        "value": "1",
        "unit": "m",
        "label": "1 m",
        "price": 125000,
        "discount_price": null,
        "cost_price": 80000,
        "stock": 30,
        "low_stock_threshold": null,
        "min_order_qty": 1,
        "max_order_qty": null,
        "weight_grams": 900,
        "is_active": true,
        "image": null
      }
    ],
    "main_image": null,
    "gallery": [],
    "links": {
      "related": [
        {
          "id": 1,
          "name": "ABC Dry Powder Fire Extinguisher"
        }
      ],
      "cross_sell": [],
      "upsell": []
    },
    "min_price": 125000,
    "max_price": 195000,
    "in_stock": true,
    "rating_avg": 0,
    "rating_count": 0,
    "sold_count": 0,
    "view_count": 0,
    "published_at": "2026-10-01T12:48:19+00:00",
    "created_at": "2026-10-01T12:48:19+00:00",
    "updated_at": "2026-10-01T12:48:19+00:00"
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `PUT /api/v1/admin/products/{product}/links` · [back to contents](#contents)</sub>

---

<a id="delete-admin-products-product"></a>

### `DELETE /api/v1/admin/products/{product}`

Delete a product.

Auth: token with permission `products.delete`

Path: `product`

**Example**

```http
DELETE /api/v1/admin/products/10
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/products/{product}` · [back to contents](#contents)</sub>

---

<a id="post-admin-products-bulk"></a>

### `POST /api/v1/admin/products/bulk`

One change to up to 500 products.

Auth: token with permission `products.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `action` | Yes | One of `status`, `flag`, `price`, `stock`, `delete` |
| `ids` | Yes | List, at least 1 item, up to 500 items |
| `ids[]` | No | Integer, no repeats, an existing `products` id |
| `status` | When `action` is `status` | One of `draft`, `active`, `hidden` |
| `flag` | When `action` is `flag` | One of `featured`, `trending`, `new_arrival`, `best_seller` |
| `mode` | When `action` is `price` or `stock` | For `stock`: `set` or `add`. For `price`: `set`, `increase_percent`, `decrease_percent`, `increase_amount` or `decrease_amount` |
| `value` | When `action` is `flag`, `price` or `stock` | Boolean for `flag`; integer otherwise (poisha for amounts, basis points up to 10000 for percent modes, -1,000,000 to 1,000,000 for stock) |

**Example**

```http
POST /api/v1/admin/products/bulk
Authorization: Bearer <token>
```
```json
{
  "action": "flag",
  "ids": [
    1
  ],
  "flag": "featured",
  "value": true
}
```

Response `200`
```json
{
  "data": {
    "action": "flag",
    "products": 1
  }
}
```

<sub>End of `POST /api/v1/admin/products/bulk` · [back to contents](#contents)</sub>

---

<a id="post-admin-products-images-bulk"></a>

### `POST /api/v1/admin/products/images/bulk`

Up to 20 images, matched to SKUs by file name.

Auth: token with permission `products.update` + `media.upload`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `files` | Yes | List, at least 1 item, up to 20 items |
| `files[]` | No | File, file type jpg, jpeg, png, webp, up to 5120 KB, image max_width=8000, max_height=8000 |

**Example**

```http
POST /api/v1/admin/products/images/bulk
Authorization: Bearer <token>
```
Sent as `multipart/form-data`:

| Field | Value |
| --- | --- |
| `files[]` | a file |

Response `200`
```json
{
  "data": [
    {
      "file": "DOCS-001.png",
      "status": "skipped",
      "message": "No product has the SKU DOCS-001."
    }
  ]
}
```

<sub>End of `POST /api/v1/admin/products/images/bulk` · [back to contents](#contents)</sub>

---

<a id="get-admin-products-export"></a>

### `GET /api/v1/admin/products/export`

Download products as CSV/Excel.

Auth: token with permission `products.export`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `status` | one of `draft`, `active`, `hidden` | |
| `brand_id` | integer | |
| `category_id` | integer | |
| `format` | string | |

**Example**

```http
GET /api/v1/admin/products/export?format=xlsx
Authorization: Bearer <token>
```

Response `200`: a spreadsheet file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

<sub>End of `GET /api/v1/admin/products/export` · [back to contents](#contents)</sub>

---

<a id="post-admin-product-imports"></a>

### `POST /api/v1/admin/product-imports`

Upload a spreadsheet; runs in the background (`202`).

Auth: token with permission `products.import`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `file` | Yes | File, file type csv, txt, xlsx, up to 20480 KB |

**Example**

```http
POST /api/v1/admin/product-imports
Authorization: Bearer <token>
```
Sent as `multipart/form-data`:

| Field | Value |
| --- | --- |
| `file` | a file |

Response `202`
```json
{
  "data": {
    "id": 1,
    "status": "completed",
    "file": "products.csv",
    "total_rows": 1,
    "products_created": 1,
    "products_updated": 0,
    "rows_failed": 0,
    "errors": [],
    "started_at": "2026-10-01T12:48:19+00:00",
    "finished_at": "2026-10-01T12:48:20+00:00",
    "created_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/product-imports` · [back to contents](#contents)</sub>

---

<a id="get-admin-product-imports-template"></a>

### `GET /api/v1/admin/product-imports/template`

Blank spreadsheet with example rows.

Auth: token with permission `products.import`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `format` | string | |

**Example**

```http
GET /api/v1/admin/product-imports/template?format=xlsx
Authorization: Bearer <token>
```

Response `200`: a spreadsheet file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

<sub>End of `GET /api/v1/admin/product-imports/template` · [back to contents](#contents)</sub>

---

<a id="get-admin-product-imports-productimport"></a>

### `GET /api/v1/admin/product-imports/{productImport}`

How an import went, with refused rows.

Auth: token with permission `products.import`

Path: `productImport`

**Example**

```http
GET /api/v1/admin/product-imports/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "status": "completed",
    "file": "products.csv",
    "total_rows": 1,
    "products_created": 1,
    "products_updated": 0,
    "rows_failed": 0,
    "errors": [],
    "started_at": "2026-10-01T12:48:19+00:00",
    "finished_at": "2026-10-01T12:48:20+00:00",
    "created_at": "2026-10-01T12:48:19+00:00"
  }
}
```

<sub>End of `GET /api/v1/admin/product-imports/{productImport}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Inventory

---

<a id="get-admin-inventory"></a>

### `GET /api/v1/admin/inventory`

Stock per variant (`status`: out, low, in).

Auth: token with permission `inventory.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string | search text |
| `status` | string | |
| `category_id` | integer | |
| `sort` | string | |

**Example**

```http
GET /api/v1/admin/inventory?status=low
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "variant_id": 11,
      "sku": "BOLT-SS-M10",
      "label": "M10",
      "product": {
        "id": 6,
        "name": "Stainless Steel Hex Bolt",
        "status": "active"
      },
      "stock": 3,
      "low_stock_threshold": null,
      "effective_threshold": 5,
      "stock_status": "low",
      "cost_price": 49000,
      "is_active": true
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/inventory?page=1",
    "last": "http://localhost:8000/api/v1/admin/inventory?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/inventory",
    "per_page": 25,
    "to": 2,
    "total": 2
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/inventory` · [back to contents](#contents)</sub>

---

<a id="get-admin-inventory-summary"></a>

### `GET /api/v1/admin/inventory/summary`

Units on hand, stock value, low/out counts.

Auth: token with permission `inventory.view`

**Example**

```http
GET /api/v1/admin/inventory/summary
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "variants": 17,
    "units_in_stock": 621,
    "stock_value": 35320000,
    "uncosted_variants": 2,
    "low_stock": 2,
    "out_of_stock": 3
  }
}
```

<sub>End of `GET /api/v1/admin/inventory/summary` · [back to contents](#contents)</sub>

---

<a id="get-admin-inventory-movements"></a>

### `GET /api/v1/admin/inventory/movements`

Stock history.

Auth: token with permission `inventory.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `type` | one of `initial`, `purchase`, `adjustment`, `import`, `sale`, `cancel_release`, `return` | |
| `variant_id` | integer | |
| `from` | date | `YYYY-MM-DD` |
| `to` | date | `YYYY-MM-DD` |

**Example**

```http
GET /api/v1/admin/inventory/movements
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 19,
      "variant_id": 19,
      "sku": "DOCS-001",
      "type": "import",
      "quantity": 10,
      "balance_after": 10,
      "reference": {
        "type": "product_import",
        "id": 1
      },
      "note": "Import #1",
      "user": {
        "id": 1,
        "name": "Store Owner"
      },
      "created_at": "2026-10-01T12:48:19+00:00"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/inventory/movements?page=1",
    "last": "http://localhost:8000/api/v1/admin/inventory/movements?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/inventory/movements",
    "per_page": 25,
    "to": 19,
    "total": 19
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/inventory/movements` · [back to contents](#contents)</sub>

---

<a id="post-admin-inventory-adjustments"></a>

### `POST /api/v1/admin/inventory/adjustments`

Correct stock (`set` or `add`), with a reason.

Auth: token with permission `inventory.adjust`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `variant_id` | Yes | Integer, an existing `product_variants` id |
| `mode` | Yes | One of `set`, `add` |
| `quantity` | Yes | Integer, -1,000,000 to 1,000,000; 0 or more when `mode` is `set` |
| `note` | Yes | String, up to 500 characters |

**Example**

```http
POST /api/v1/admin/inventory/adjustments
Authorization: Bearer <token>
```
```json
{
  "variant_id": 1,
  "mode": "set",
  "quantity": 25,
  "note": "Counted on the shelf"
}
```

Response `200`
```json
{
  "data": {
    "variant_id": 1,
    "sku": "FE-ABC-1KG",
    "label": "1 kg",
    "product": {
      "id": 1,
      "name": "ABC Dry Powder Fire Extinguisher",
      "status": "active"
    },
    "stock": 25,
    "low_stock_threshold": null,
    "effective_threshold": 5,
    "stock_status": "in",
    "cost_price": 62000,
    "is_active": true
  }
}
```

<sub>End of `POST /api/v1/admin/inventory/adjustments` · [back to contents](#contents)</sub>

---

<a id="get-admin-inventory-purchases"></a>

### `GET /api/v1/admin/inventory/purchases`

Deliveries received.

Auth: token with permission `inventory.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string | search text |

**Example**

```http
GET /api/v1/admin/inventory/purchases
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/inventory/purchases?page=1",
    "last": "http://localhost:8000/api/v1/admin/inventory/purchases?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": null,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/inventory/purchases",
    "per_page": 25,
    "to": null,
    "total": 0
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/inventory/purchases` · [back to contents](#contents)</sub>

---

<a id="get-admin-inventory-purchases-purchase"></a>

### `GET /api/v1/admin/inventory/purchases/{purchase}`

One delivery with its lines.

Auth: token with permission `inventory.view`

Path: `purchase`

**Example**

```http
GET /api/v1/admin/inventory/purchases/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "reference_no": "INV-8821",
    "supplier_name": "Firex Bangladesh",
    "received_on": "2026-09-20",
    "note": null,
    "total_cost": 1220000,
    "items": [
      {
        "variant_id": 1,
        "sku": "FE-ABC-1KG",
        "product": "ABC Dry Powder Fire Extinguisher",
        "quantity": 20,
        "unit_cost": 61000
      }
    ],
    "recorded_by": "Store Owner",
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `GET /api/v1/admin/inventory/purchases/{purchase}` · [back to contents](#contents)</sub>

---

<a id="post-admin-inventory-purchases"></a>

### `POST /api/v1/admin/inventory/purchases`

Record a delivery; adds the stock.

Auth: token with permission `inventory.receive`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `reference_no` | No | String, up to 64 characters, may be `null` |
| `supplier_name` | No | String, up to 255 characters, may be `null` |
| `received_on` | Yes | Date, `date`, on or before `today` |
| `note` | No | String, up to 1000 characters, may be `null` |
| `update_cost_price` | No | Boolean |
| `items` | Yes | List, at least 1 item, up to 200 items |
| `items[].variant_id` | Yes | Integer, an existing `product_variants` id |
| `items[].quantity` | Yes | Integer, at least 1, at most 1000000 |
| `items[].unit_cost` | No | Integer, at least 0, at most 100000000000, may be `null` |

**Example**

```http
POST /api/v1/admin/inventory/purchases
Authorization: Bearer <token>
```
```json
{
  "reference_no": "INV-8821",
  "supplier_name": "Firex Bangladesh",
  "received_on": "2026-09-20",
  "update_cost_price": true,
  "items": [
    {
      "variant_id": 1,
      "quantity": 20,
      "unit_cost": 61000
    }
  ]
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "reference_no": "INV-8821",
    "supplier_name": "Firex Bangladesh",
    "received_on": "2026-09-20",
    "note": null,
    "total_cost": 1220000,
    "items": [
      {
        "variant_id": 1,
        "sku": "FE-ABC-1KG",
        "product": "ABC Dry Powder Fire Extinguisher",
        "quantity": 20,
        "unit_cost": 61000
      }
    ],
    "recorded_by": "Store Owner",
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/inventory/purchases` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Orders and customers

---

<a id="get-admin-orders"></a>

### `GET /api/v1/admin/orders`

Orders, filtered by status, payment, date or `q`.

Auth: token with permission `orders.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `status` | one of `pending`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded` | |
| `payment_status` | one of `unpaid`, `pending`, `paid`, `failed`, `partially_refunded`, `refunded` | |
| `payment_method` | one of `cod`, `bank_transfer`, `sslcommerz` | |
| `source` | one of `cart`, `buy_now` | |
| `q` | string | search text |
| `customer_id` | integer | |
| `zone_id` | integer | |
| `from` | date | `YYYY-MM-DD` |
| `to` | date | `YYYY-MM-DD` |

**Example**

```http
GET /api/v1/admin/orders
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 2,
      "number": "261001-BLTFT",
      "status": "pending",
      "payment_status": "unpaid",
      "payment_method": "cod",
      "source": "buy_now",
      "customer": {
        "id": null,
        "is_guest": true,
        "name": "Walk-in Customer",
        "phone": "+8801812345678"
      },
      "district": "Dhaka",
      "item_count": 1,
      "grand_total": 115250,
      "placed_at": "2026-10-01T12:48:18.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/orders?page=1",
    "last": "http://localhost:8000/api/v1/admin/orders?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/orders",
    "per_page": 25,
    "to": 2,
    "total": 2
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/orders` · [back to contents](#contents)</sub>

---

<a id="get-admin-orders-order"></a>

### `GET /api/v1/admin/orders/{order}`

One order, its lines, history and allowed next steps.

Auth: token with permission `orders.view`

Path: `order`

**Example**

```http
GET /api/v1/admin/orders/2
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "number": "261001-BLTFT",
    "status": "pending",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "buy_now",
    "customer": {
      "id": null,
      "is_guest": true,
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "email": null,
      "account_type": "retail",
      "group": "Retail"
    },
    "shipping_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone_id": 1,
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2,
      "weight_grams": 1600
    },
    "items": [
      {
        "id": 2,
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "unit_cost": 62000,
        "price_source": "base",
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "shipping_vat": 0,
      "grand_total": 115250,
      "cost": 62000
    },
    "coupon_code": null,
    "currency": "BDT",
    "customer_note": null,
    "payments": [],
    "allowed_transitions": [
      {
        "status": "confirmed",
        "permission": "orders.update"
      }
    ],
    "payment_expires_at": null,
    "stock_released_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": null,
    "delivered_at": null,
    "cancelled_at": null,
    "history": [
      {
        "from": null,
        "to": "pending",
        "note": "Order placed",
        "by": null,
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/orders/{order}` · [back to contents](#contents)</sub>

---

<a id="post-admin-orders-order-status"></a>

### `POST /api/v1/admin/orders/{order}/status`

Move the order on.

Auth: token; the permission depends on the step (see below)

Which steps are allowed, and the permission each needs, is in the README ("Where an order may go next"). `allowed_transitions` on the order detail lists what this member of staff may do now.

Path: `order`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `status` | Yes | One of `pending`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded` |
| `note` | No | String, up to 500 characters, may be `null` |

**Example**

```http
POST /api/v1/admin/orders/2/status
Authorization: Bearer <token>
```
```json
{
  "status": "confirmed",
  "note": "Confirmed by phone"
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "number": "261001-BLTFT",
    "status": "confirmed",
    "payment_status": "unpaid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "buy_now",
    "customer": {
      "id": null,
      "is_guest": true,
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "email": null,
      "account_type": "retail",
      "group": "Retail"
    },
    "shipping_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone_id": 1,
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2,
      "weight_grams": 1600
    },
    "items": [
      {
        "id": 2,
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "unit_cost": 62000,
        "price_source": "base",
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "shipping_vat": 0,
      "grand_total": 115250,
      "cost": 62000
    },
    "coupon_code": null,
    "currency": "BDT",
    "customer_note": null,
    "payments": [],
    "allowed_transitions": [
      {
        "status": "processing",
        "permission": "orders.update"
      }
    ],
    "payment_expires_at": null,
    "stock_released_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": "2026-10-01T12:48:20.000000Z",
    "delivered_at": null,
    "cancelled_at": null,
    "history": [
      {
        "from": null,
        "to": "pending",
        "note": "Order placed",
        "by": null,
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

**Example error**

```http
POST /api/v1/admin/orders/2/status
Authorization: Bearer <token>
```
```json
{
  "status": "pending"
}
```

Response `409`
```json
{
  "message": "An order that is delivered cannot become pending. It can only become: returned.",
  "code": "INVALID_ORDER_TRANSITION",
  "request_id": "9a3c7417-9d70-47c0-b78d-73c901756798"
}
```

<sub>End of `POST /api/v1/admin/orders/{order}/status` · [back to contents](#contents)</sub>

---

<a id="post-admin-orders-order-payment"></a>

### `POST /api/v1/admin/orders/{order}/payment`

Record a cash or bank payment; confirms the order.

Auth: token with permission `orders.update`

Path: `order`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `note` | No | String, up to 500 characters, may be `null` |

**Example**

```http
POST /api/v1/admin/orders/2/payment
Authorization: Bearer <token>
```
```json
{
  "note": "Cash on delivery collected"
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "number": "261001-BLTFT",
    "status": "confirmed",
    "payment_status": "paid",
    "payment_method": "cod",
    "payment_method_label": "Cash on delivery",
    "source": "buy_now",
    "customer": {
      "id": null,
      "is_guest": true,
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "email": null,
      "account_type": "retail",
      "group": "Retail"
    },
    "shipping_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "billing_address": {
      "name": "Walk-in Customer",
      "phone": "+8801812345678",
      "line1": "Shop 4, New Market",
      "line2": null,
      "area": "New Market",
      "district": "Dhaka",
      "division": "Dhaka",
      "postcode": null,
      "district_id": 21,
      "division_id": 20
    },
    "delivery": {
      "zone_id": 1,
      "zone": "Inside Dhaka",
      "days_min": 1,
      "days_max": 2,
      "weight_grams": 1600
    },
    "items": [
      {
        "id": 2,
        "product_id": 1,
        "variant_id": 1,
        "name": "ABC Dry Powder Fire Extinguisher",
        "label": "1 kg",
        "sku": "FE-ABC-1KG",
        "image": null,
        "quantity": 1,
        "unit_price": 95000,
        "unit_cost": 62000,
        "price_source": "base",
        "discount": 0,
        "vat_rate_bp": 1500,
        "vat": 14250,
        "line_total": 109250
      }
    ],
    "totals": {
      "subtotal": 95000,
      "discount": 0,
      "vat": 14250,
      "shipping": 6000,
      "shipping_vat": 0,
      "grand_total": 115250,
      "cost": 62000
    },
    "coupon_code": null,
    "currency": "BDT",
    "customer_note": null,
    "payments": [],
    "allowed_transitions": [
      {
        "status": "processing",
        "permission": "orders.update"
      }
    ],
    "payment_expires_at": null,
    "stock_released_at": null,
    "placed_at": "2026-10-01T12:48:18.000000Z",
    "confirmed_at": "2026-10-01T12:48:20.000000Z",
    "delivered_at": null,
    "cancelled_at": null,
    "history": [
      {
        "from": null,
        "to": "pending",
        "note": "Order placed",
        "by": null,
        "at": "2026-10-01T12:48:18.000000Z"
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/admin/orders/{order}/payment` · [back to contents](#contents)</sub>

---

<a id="get-admin-orders-order-invoice"></a>

### `GET /api/v1/admin/orders/{order}/invoice`

The invoice, as a PDF.

Auth: token with permission `orders.view`

Path: `order`

**Example**

```http
GET /api/v1/admin/orders/2/invoice
Authorization: Bearer <token>
```

Response `200`: a PDF file (`application/pdf`).

<sub>End of `GET /api/v1/admin/orders/{order}/invoice` · [back to contents](#contents)</sub>

---

<a id="get-admin-orders-order-refunds"></a>

### `GET /api/v1/admin/orders/{order}/refunds`

Refunds made, and what is left to refund.

Auth: token with permission `orders.view`

Path: `order`

**Example**

```http
GET /api/v1/admin/orders/2/refunds
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [],
  "meta": {
    "refundable": 0
  }
}
```

<sub>End of `GET /api/v1/admin/orders/{order}/refunds` · [back to contents](#contents)</sub>

---

<a id="post-admin-orders-order-refunds"></a>

### `POST /api/v1/admin/orders/{order}/refunds`

Send money back (partial by default).

Auth: token with permission `orders.refund`

Refunds go back through SSLCommerz, so only orders paid online can be refunded. The example is the answer for a cash order.

Path: `order`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `amount` | No | Integer, at least 1 |
| `reason` | Yes | String, up to 500 characters |

**Example (not configured yet)**

```http
POST /api/v1/admin/orders/2/refunds
Authorization: Bearer <token>
```
```json
{
  "amount": 40000,
  "reason": "One item returned"
}
```

Response `409`
```json
{
  "message": "This order was not paid for online, so there is nothing to refund through the gateway.",
  "code": "REFUND_NOT_POSSIBLE",
  "request_id": "029f3646-c9c9-4763-bfa0-c6cb67b75608"
}
```

<sub>End of `POST /api/v1/admin/orders/{order}/refunds` · [back to contents](#contents)</sub>

---

<a id="get-admin-customers"></a>

### `GET /api/v1/admin/customers`

Customers, with what each has spent.

Auth: token with permission `customers.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string | search text |
| `is_active` | boolean | `1` or `0` |
| `has_orders` | boolean | `1` or `0` |
| `sort` | string | |

**Example**

```http
GET /api/v1/admin/customers?sort=spent
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 2,
      "name": "Rafi Ahmed",
      "email": "newaddress@example.com",
      "phone": "+8801712345678",
      "is_active": true,
      "email_verified": true,
      "phone_verified": true,
      "account_type": "retail",
      "orders_count": 0,
      "spent": 0,
      "last_order_at": null,
      "last_login_at": "2026-10-01T12:48:18.000000Z",
      "created_at": "2026-10-01T12:48:08.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/customers?page=1",
    "last": "http://localhost:8000/api/v1/admin/customers?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/customers",
    "per_page": 25,
    "to": 2,
    "total": 2
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/customers` · [back to contents](#contents)</sub>

---

<a id="get-admin-customers-customer"></a>

### `GET /api/v1/admin/customers/{customer}`

One customer, with their addresses.

Auth: token with permission `customers.view`

Path: `customer`

**Example**

```http
GET /api/v1/admin/customers/2
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Rafi Ahmed",
    "email": "newaddress@example.com",
    "phone": "+8801712345678",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true,
    "account_type": "retail",
    "group": null,
    "orders_count": 1,
    "spent": 0,
    "addresses": [
      {
        "id": 1,
        "label": "Home",
        "name": "Rafi Ahmed",
        "phone": "+8801712345678",
        "district": {
          "id": 21,
          "name": "Dhaka"
        },
        "division_id": 20,
        "district_id": 21,
        "area": "Dhanmondi",
        "line1": "House 12, Road 4",
        "line2": null,
        "postcode": "1209",
        "is_default_shipping": false,
        "is_default_billing": true
      }
    ],
    "last_login_at": "2026-10-01T12:48:18.000000Z",
    "created_at": "2026-10-01T12:48:08.000000Z"
  }
}
```

<sub>End of `GET /api/v1/admin/customers/{customer}` · [back to contents](#contents)</sub>

---

<a id="put-admin-customers-customer"></a>

### `PUT /api/v1/admin/customers/{customer}`

Rename or deactivate.

Auth: token with permission `customers.update`

Path: `customer`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | No | String, up to 255 characters |
| `is_active` | No | Boolean |

**Example**

```http
PUT /api/v1/admin/customers/2
Authorization: Bearer <token>
```
```json
{
  "name": "Rafi Ahmed",
  "is_active": true
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "name": "Rafi Ahmed",
    "email": "newaddress@example.com",
    "phone": "+8801712345678",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true,
    "account_type": "retail",
    "group": null,
    "addresses": [
      {
        "id": 1,
        "label": "Home",
        "name": "Rafi Ahmed",
        "phone": "+8801712345678",
        "district": {
          "id": 21,
          "name": "Dhaka"
        },
        "division_id": 20,
        "district_id": 21,
        "area": "Dhanmondi",
        "line1": "House 12, Road 4",
        "line2": null,
        "postcode": "1209",
        "is_default_shipping": false,
        "is_default_billing": true
      }
    ],
    "last_login_at": "2026-10-01T12:48:18.000000Z",
    "created_at": "2026-10-01T12:48:08.000000Z"
  }
}
```

<sub>End of `PUT /api/v1/admin/customers/{customer}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-customers-customer"></a>

### `DELETE /api/v1/admin/customers/{customer}`

Delete a customer.

Auth: token with permission `customers.delete`

Path: `customer`

**Example**

```http
DELETE /api/v1/admin/customers/3
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/customers/{customer}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Shipping and discounts

---

<a id="get-admin-shipping-zones"></a>

### `GET /api/v1/admin/shipping-zones`

Delivery zones with their charges.

Auth: token with permission `shipping.view`

**Example**

```http
GET /api/v1/admin/shipping-zones
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Inside Dhaka",
      "type": "inside_city",
      "rate_basis": "flat",
      "free_above": 500000,
      "delivery_days_min": 1,
      "delivery_days_max": 2,
      "is_default": false,
      "is_active": true,
      "sort_order": 0,
      "locations": [
        {
          "id": 21,
          "name": "Dhaka"
        }
      ],
      "rates": [
        {
          "id": 1,
          "range_from": 0,
          "range_to": null,
          "charge": 6000,
          "per_extra_kg": null
        }
      ]
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/shipping-zones` · [back to contents](#contents)</sub>

---

<a id="get-admin-shipping-zones-shippingzone"></a>

### `GET /api/v1/admin/shipping-zones/{shippingZone}`

One zone.

Auth: token with permission `shipping.view`

Path: `shippingZone`

**Example**

```http
GET /api/v1/admin/shipping-zones/3
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "name": "Chattogram",
    "type": "outside_city",
    "rate_basis": "weight",
    "free_above": 800000,
    "delivery_days_min": 2,
    "delivery_days_max": 4,
    "is_default": false,
    "is_active": true,
    "sort_order": 0,
    "locations": [],
    "rates": [
      {
        "id": 3,
        "range_from": 0,
        "range_to": 1000,
        "charge": 9000,
        "per_extra_kg": null
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/shipping-zones/{shippingZone}` · [back to contents](#contents)</sub>

---

<a id="post-admin-shipping-zones"></a>

### `POST /api/v1/admin/shipping-zones`

Create a zone.

Auth: token with permission `shipping.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | String, up to 255 characters |
| `type` | No | One of `inside_city`, `outside_city`, `custom` |
| `rate_basis` | No | One of `flat`, `weight`, `order_value` |
| `free_above` | No | Integer, at least 0, at most 100000000000, may be `null` |
| `delivery_days_min` | No | Integer, at least 0, at most 365, may be `null` |
| `delivery_days_max` | No | Integer, at least 0, at most 365, at least `delivery_days_min`, may be `null` |
| `is_default` | No | Boolean |
| `is_active` | No | Boolean |
| `sort_order` | No | Integer, at least 0, at most 65535 |
| `location_ids` | No | List, up to 100 items |
| `location_ids[]` | No | Integer, no repeats, an existing `locations` id |
| `rates` | Yes | List, at least 1 item, up to 50 items |
| `rates[].range_from` | Yes | Integer, at least 0, at most 100000000000 |
| `rates[].range_to` | No | Integer, at least 0, at most 100000000000, at least `rates.*.range_from`, may be `null` |
| `rates[].charge` | Yes | Integer, at least 0, at most 100000000000 |
| `rates[].per_extra_kg` | No | Integer, at least 0, at most 100000000000, may be `null` |

**Example**

```http
POST /api/v1/admin/shipping-zones
Authorization: Bearer <token>
```
```json
{
  "name": "Chattogram",
  "type": "outside_city",
  "rate_basis": "weight",
  "delivery_days_min": 2,
  "delivery_days_max": 4,
  "free_above": 800000,
  "rates": [
    {
      "range_from": 0,
      "range_to": 1000,
      "charge": 9000
    },
    {
      "range_from": 1001,
      "charge": 13000,
      "per_extra_kg": 2000
    }
  ]
}
```

Response `201`
```json
{
  "data": {
    "id": 3,
    "name": "Chattogram",
    "type": "outside_city",
    "rate_basis": "weight",
    "free_above": 800000,
    "delivery_days_min": 2,
    "delivery_days_max": 4,
    "is_default": false,
    "is_active": true,
    "sort_order": 0,
    "locations": [],
    "rates": [
      {
        "id": 3,
        "range_from": 0,
        "range_to": 1000,
        "charge": 9000,
        "per_extra_kg": null
      }
    ]
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `POST /api/v1/admin/shipping-zones` · [back to contents](#contents)</sub>

---

<a id="put-admin-shipping-zones-shippingzone"></a>

### `PUT /api/v1/admin/shipping-zones/{shippingZone}`

Edit a zone (sending `rates` replaces them).

Auth: token with permission `shipping.update`

Path: `shippingZone`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `name` | No | String, up to 255 characters |
| `type` | No | One of `inside_city`, `outside_city`, `custom` |
| `rate_basis` | No | One of `flat`, `weight`, `order_value` |
| `free_above` | No | Integer, at least 0, at most 100000000000, may be `null` |
| `delivery_days_min` | No | Integer, at least 0, at most 365, may be `null` |
| `delivery_days_max` | No | Integer, at least 0, at most 365, at least `delivery_days_min`, may be `null` |
| `is_default` | No | Boolean |
| `is_active` | No | Boolean |
| `sort_order` | No | Integer, at least 0, at most 65535 |
| `location_ids` | No | List, up to 100 items |
| `location_ids[]` | No | Integer, no repeats, an existing `locations` id |
| `rates` | No | List, at least 1 item, up to 50 items |
| `rates[].range_from` | Yes | Integer, at least 0, at most 100000000000 |
| `rates[].range_to` | No | Integer, at least 0, at most 100000000000, at least `rates.*.range_from`, may be `null` |
| `rates[].charge` | Yes | Integer, at least 0, at most 100000000000 |
| `rates[].per_extra_kg` | No | Integer, at least 0, at most 100000000000, may be `null` |

**Example**

```http
PUT /api/v1/admin/shipping-zones/3
Authorization: Bearer <token>
```
```json
{
  "rates": [
    {
      "range_from": 0,
      "charge": 10000
    }
  ]
}
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "name": "Chattogram",
    "type": "outside_city",
    "rate_basis": "weight",
    "free_above": 800000,
    "delivery_days_min": 2,
    "delivery_days_max": 4,
    "is_default": false,
    "is_active": true,
    "sort_order": 0,
    "locations": [],
    "rates": [
      {
        "id": 5,
        "range_from": 0,
        "range_to": null,
        "charge": 10000,
        "per_extra_kg": null
      }
    ]
  }
}
```

<sub>End of `PUT /api/v1/admin/shipping-zones/{shippingZone}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-shipping-zones-shippingzone"></a>

### `DELETE /api/v1/admin/shipping-zones/{shippingZone}`

Delete a zone.

Auth: token with permission `shipping.update`

Path: `shippingZone`

**Example**

```http
DELETE /api/v1/admin/shipping-zones/3
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/shipping-zones/{shippingZone}` · [back to contents](#contents)</sub>

---

<a id="get-admin-coupons"></a>

### `GET /api/v1/admin/coupons`

Coupons (`status`: active, scheduled, expired, used_up).

Auth: token with permission `discounts.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string | search text |
| `status` | string | |

**Example**

```http
GET /api/v1/admin/coupons
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 2,
      "code": "FLAT100",
      "type": "fixed",
      "value": 10000,
      "min_purchase": 100000,
      "max_discount": null,
      "starts_at": null,
      "expires_at": null,
      "usage_limit": null,
      "per_user_limit": null,
      "used_count": 0,
      "redemptions_count": 0,
      "is_active": true,
      "status": "active",
      "summary": "৳100.00 off",
      "created_at": "2026-10-01T12:48:08+00:00"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/coupons?page=1",
    "last": "http://localhost:8000/api/v1/admin/coupons?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/coupons",
    "per_page": 25,
    "to": 2,
    "total": 2
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/coupons` · [back to contents](#contents)</sub>

---

<a id="get-admin-coupons-coupon"></a>

### `GET /api/v1/admin/coupons/{coupon}`

One coupon.

Auth: token with permission `discounts.view`

Path: `coupon`

**Example**

```http
GET /api/v1/admin/coupons/3
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "code": "EID25",
    "type": "percent",
    "value": 2500,
    "min_purchase": 200000,
    "max_discount": 150000,
    "starts_at": null,
    "expires_at": null,
    "usage_limit": 500,
    "per_user_limit": 1,
    "used_count": 0,
    "redemptions_count": 0,
    "is_active": true,
    "status": "active",
    "summary": "25% off",
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `GET /api/v1/admin/coupons/{coupon}` · [back to contents](#contents)</sub>

---

<a id="post-admin-coupons"></a>

### `POST /api/v1/admin/coupons`

Create a coupon.

Auth: token with permission `discounts.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `code` | Yes | String, at least 3 characters, up to 32 characters, matches `/^[A-Za-z0-9._-]+$/`, must not be taken |
| `type` | Yes | One of `percent`, `fixed` |
| `value` | Yes | Integer, at least 1, at most 100000000000 |
| `min_purchase` | No | Integer, at least 0, at most 100000000000, may be `null` |
| `max_discount` | No | Integer, at least 1, at most 100000000000, may be `null` |
| `starts_at` | No | Date, `date`, may be `null` |
| `expires_at` | No | Date, `date`, after `starts_at`, may be `null` |
| `usage_limit` | No | Integer, at least 1, at most 1000000, may be `null` |
| `per_user_limit` | No | Integer, at least 1, at most 1000, may be `null` |
| `is_active` | No | Boolean |

**Example**

```http
POST /api/v1/admin/coupons
Authorization: Bearer <token>
```
```json
{
  "code": "EID25",
  "type": "percent",
  "value": 2500,
  "max_discount": 150000,
  "min_purchase": 200000,
  "per_user_limit": 1,
  "usage_limit": 500,
  "is_active": true
}
```

Response `201`
```json
{
  "data": {
    "id": 3,
    "code": "EID25",
    "type": "percent",
    "value": 2500,
    "min_purchase": 200000,
    "max_discount": 150000,
    "starts_at": null,
    "expires_at": null,
    "usage_limit": 500,
    "per_user_limit": 1,
    "used_count": 0,
    "is_active": true,
    "status": "active",
    "summary": "25% off",
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/coupons` · [back to contents](#contents)</sub>

---

<a id="put-admin-coupons-coupon"></a>

### `PUT /api/v1/admin/coupons/{coupon}`

Edit a coupon.

Auth: token with permission `discounts.update`

Path: `coupon`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `code` | No | String, at least 3 characters, up to 32 characters, matches `/^[A-Za-z0-9._-]+$/`, must not be taken |
| `type` | No | One of `percent`, `fixed` |
| `value` | No | Integer, at least 1, at most 100000000000 |
| `min_purchase` | No | Integer, at least 0, at most 100000000000, may be `null` |
| `max_discount` | No | Integer, at least 1, at most 100000000000, may be `null` |
| `starts_at` | No | Date, `date`, may be `null` |
| `expires_at` | No | Date, `date`, after `starts_at`, may be `null` |
| `usage_limit` | No | Integer, at least 1, at most 1000000, may be `null` |
| `per_user_limit` | No | Integer, at least 1, at most 1000, may be `null` |
| `is_active` | No | Boolean |

**Example**

```http
PUT /api/v1/admin/coupons/3
Authorization: Bearer <token>
```
```json
{
  "is_active": false
}
```

Response `200`
```json
{
  "data": {
    "id": 3,
    "code": "EID25",
    "type": "percent",
    "value": 2500,
    "min_purchase": 200000,
    "max_discount": 150000,
    "starts_at": null,
    "expires_at": null,
    "usage_limit": 500,
    "per_user_limit": 1,
    "used_count": 0,
    "redemptions_count": 0,
    "is_active": false,
    "status": "inactive",
    "summary": "25% off",
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `PUT /api/v1/admin/coupons/{coupon}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-coupons-coupon"></a>

### `DELETE /api/v1/admin/coupons/{coupon}`

Delete a coupon.

Auth: token with permission `discounts.delete`

Path: `coupon`

**Example**

```http
DELETE /api/v1/admin/coupons/3
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/coupons/{coupon}` · [back to contents](#contents)</sub>

---

<a id="get-admin-flash-sales"></a>

### `GET /api/v1/admin/flash-sales`

Flash sales (`running=1` for live ones).

Auth: token with permission `discounts.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `running` | boolean | `1` or `0` |

**Example**

```http
GET /api/v1/admin/flash-sales
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/flash-sales?page=1",
    "last": "http://localhost:8000/api/v1/admin/flash-sales?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": null,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/flash-sales",
    "per_page": 25,
    "to": null,
    "total": 0
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/flash-sales` · [back to contents](#contents)</sub>

---

<a id="get-admin-flash-sales-flashsale"></a>

### `GET /api/v1/admin/flash-sales/{flashSale}`

One sale with its prices.

Auth: token with permission `discounts.view`

Path: `flashSale`

**Example**

```http
GET /api/v1/admin/flash-sales/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "title": "Weekend sale",
    "starts_at": "2026-09-21T00:00:00+00:00",
    "ends_at": "2026-09-23T23:59:59+00:00",
    "is_active": true,
    "is_running": false,
    "items_count": 1,
    "items": [
      {
        "variant_id": 1,
        "sku": "FE-ABC-1KG",
        "sale_price": 79000,
        "usual_price": 95000
      }
    ],
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `GET /api/v1/admin/flash-sales/{flashSale}` · [back to contents](#contents)</sub>

---

<a id="post-admin-flash-sales"></a>

### `POST /api/v1/admin/flash-sales`

Create a sale with its prices.

Auth: token with permission `discounts.create`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `title` | Yes | String, up to 255 characters |
| `starts_at` | Yes | Date, `date` |
| `ends_at` | Yes | Date, `date`, after `starts_at` |
| `is_active` | No | Boolean |
| `items` | Yes | List, at least 1 item, up to 500 items |
| `items[].variant_id` | Yes | Integer, no repeats, an existing `product_variants` id |
| `items[].sale_price` | Yes | Integer, at least 0, at most 100000000000 |

**Example**

```http
POST /api/v1/admin/flash-sales
Authorization: Bearer <token>
```
```json
{
  "title": "Weekend sale",
  "starts_at": "2026-09-21T00:00:00+06:00",
  "ends_at": "2026-09-23T23:59:59+06:00",
  "is_active": true,
  "items": [
    {
      "variant_id": 1,
      "sale_price": 79000
    }
  ]
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "title": "Weekend sale",
    "starts_at": "2026-09-21T00:00:00+00:00",
    "ends_at": "2026-09-23T23:59:59+00:00",
    "is_active": true,
    "is_running": false,
    "items": [
      {
        "variant_id": 1,
        "sku": "FE-ABC-1KG",
        "sale_price": 79000,
        "usual_price": 95000
      }
    ],
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `POST /api/v1/admin/flash-sales` · [back to contents](#contents)</sub>

---

<a id="put-admin-flash-sales-flashsale"></a>

### `PUT /api/v1/admin/flash-sales/{flashSale}`

Edit a sale (sending `items` replaces them).

Auth: token with permission `discounts.update`

Path: `flashSale`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `title` | No | String, up to 255 characters |
| `starts_at` | No | Date, `date` |
| `ends_at` | No | Date, `date`, after `starts_at` |
| `is_active` | No | Boolean |
| `items` | No | List, at least 1 item, up to 500 items |
| `items[].variant_id` | Yes | Integer, no repeats, an existing `product_variants` id |
| `items[].sale_price` | Yes | Integer, at least 0, at most 100000000000 |

**Example**

```http
PUT /api/v1/admin/flash-sales/1
Authorization: Bearer <token>
```
```json
{
  "items": [
    {
      "variant_id": 1,
      "sale_price": 75000
    }
  ]
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "title": "Weekend sale",
    "starts_at": "2026-09-21T00:00:00+00:00",
    "ends_at": "2026-09-23T23:59:59+00:00",
    "is_active": true,
    "is_running": false,
    "items": [
      {
        "variant_id": 1,
        "sku": "FE-ABC-1KG",
        "sale_price": 75000,
        "usual_price": 95000
      }
    ],
    "created_at": "2026-10-01T12:48:20+00:00"
  }
}
```

<sub>End of `PUT /api/v1/admin/flash-sales/{flashSale}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-flash-sales-flashsale"></a>

### `DELETE /api/v1/admin/flash-sales/{flashSale}`

Delete a sale.

Auth: token with permission `discounts.delete`

Path: `flashSale`

**Example**

```http
DELETE /api/v1/admin/flash-sales/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/flash-sales/{flashSale}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Reviews

---

<a id="get-admin-reviews"></a>

### `GET /api/v1/admin/reviews`

The moderation queue (`status`, default pending).

Auth: token with permission `reviews.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `status` | string | |
| `rating` | integer | |
| `product_id` | integer | |
| `is_hidden` | boolean | `1` or `0` |
| `is_featured` | boolean | `1` or `0` |
| `q` | string | search text |

**Example**

```http
GET /api/v1/admin/reviews?status=pending
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 2,
      "rating": 4,
      "comment": "Does the job.",
      "status": "pending",
      "is_hidden": false,
      "is_featured": false,
      "is_visible": false,
      "rejection_reason": null,
      "edited_by_shop": false,
      "author": {
        "id": 2,
        "name": "Rafi Ahmed"
      },
      "product": {
        "id": 7,
        "name": "Galvanised Nut & Washer Set",
        "slug": "galvanised-nut-washer-set"
      },
      "order_id": 3,
      "photos": [],
      "moderated_by": null,
      "approved_at": null,
      "created_at": "2026-10-01T12:48:23.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/reviews?page=1",
    "last": "http://localhost:8000/api/v1/admin/reviews?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/reviews",
    "per_page": 25,
    "to": 1,
    "total": 1,
    "pending": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/reviews` · [back to contents](#contents)</sub>

---

<a id="get-admin-reviews-review"></a>

### `GET /api/v1/admin/reviews/{review}`

One review.

Auth: token with permission `reviews.view`

Path: `review`

**Example**

```http
GET /api/v1/admin/reviews/2
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Does the job.",
    "status": "pending",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": null,
    "edited_by_shop": false,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": null,
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `GET /api/v1/admin/reviews/{review}` · [back to contents](#contents)</sub>

---

<a id="post-admin-reviews-review-approve"></a>

### `POST /api/v1/admin/reviews/{review}/approve`

Publish a review.

Auth: token with permission `reviews.moderate`

Path: `review`

**Example**

```http
POST /api/v1/admin/reviews/2/approve
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Does the job.",
    "status": "approved",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": true,
    "rejection_reason": null,
    "edited_by_shop": false,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": "2026-10-01T12:48:23.000000Z",
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/reviews/{review}/approve` · [back to contents](#contents)</sub>

---

<a id="post-admin-reviews-review-reject"></a>

### `POST /api/v1/admin/reviews/{review}/reject`

Turn one down, with a reason.

Auth: token with permission `reviews.moderate`

Path: `review`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `reason` | No | String, up to 500 characters, may be `null` |

**Example**

```http
POST /api/v1/admin/reviews/2/reject
Authorization: Bearer <token>
```
```json
{
  "reason": "Contains a phone number"
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Does the job.",
    "status": "rejected",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": "Contains a phone number",
    "edited_by_shop": false,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/reviews/{review}/reject` · [back to contents](#contents)</sub>

---

<a id="post-admin-reviews-review-hide"></a>

### `POST /api/v1/admin/reviews/{review}/hide`

Take a published review down, or put it back. Reversible, unlike rejecting it.

Auth: token with permission `reviews.moderate`

Path: `review`

**Example**

```http
POST /api/v1/admin/reviews/2/hide
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Solid build, arrived the next day.",
    "status": "rejected",
    "is_hidden": true,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": "Contains a phone number",
    "edited_by_shop": true,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/reviews/{review}/hide` · [back to contents](#contents)</sub>

---

<a id="delete-admin-reviews-review-hide"></a>

### `DELETE /api/v1/admin/reviews/{review}/hide`

Auth: token with permission `reviews.moderate`

Path: `review`

**Example**

```http
DELETE /api/v1/admin/reviews/2/hide
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Solid build, arrived the next day.",
    "status": "rejected",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": "Contains a phone number",
    "edited_by_shop": true,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `DELETE /api/v1/admin/reviews/{review}/hide` · [back to contents](#contents)</sub>

---

<a id="post-admin-reviews-review-feature"></a>

### `POST /api/v1/admin/reviews/{review}/feature`

Put a review on the home page, or take it off. Only a review the shop is actually showing can be featured.

Auth: token with permission `reviews.moderate`

Path: `review`

**Example**

```http
POST /api/v1/admin/reviews/2/feature
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Solid build, arrived the next day.",
    "status": "rejected",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": "Contains a phone number",
    "edited_by_shop": true,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/reviews/{review}/feature` · [back to contents](#contents)</sub>

---

<a id="delete-admin-reviews-review-feature"></a>

### `DELETE /api/v1/admin/reviews/{review}/feature`

Auth: token with permission `reviews.moderate`

Path: `review`

**Example**

```http
DELETE /api/v1/admin/reviews/2/feature
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Solid build, arrived the next day.",
    "status": "rejected",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": "Contains a phone number",
    "edited_by_shop": true,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `DELETE /api/v1/admin/reviews/{review}/feature` · [back to contents](#contents)</sub>

---

<a id="put-admin-reviews-review"></a>

### `PUT /api/v1/admin/reviews/{review}`

Edit what it says.

Auth: token with permission `reviews.moderate`

Path: `review`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `comment` | Yes (may be empty) | String, up to 2000 characters, may be `null` |
| `rating` | No | Integer, at least 1, at most 5 |

**Example**

```http
PUT /api/v1/admin/reviews/2
Authorization: Bearer <token>
```
```json
{
  "comment": "Solid build, arrived the next day."
}
```

Response `200`
```json
{
  "data": {
    "id": 2,
    "rating": 4,
    "comment": "Solid build, arrived the next day.",
    "status": "rejected",
    "is_hidden": false,
    "is_featured": false,
    "is_visible": false,
    "rejection_reason": "Contains a phone number",
    "edited_by_shop": true,
    "author": {
      "id": 2,
      "name": "Rafi Ahmed"
    },
    "product": {
      "id": 7,
      "name": "Galvanised Nut & Washer Set",
      "slug": "galvanised-nut-washer-set"
    },
    "order_id": 3,
    "photos": [],
    "moderated_by": "Store Owner",
    "approved_at": null,
    "created_at": "2026-10-01T12:48:23.000000Z"
  }
}
```

<sub>End of `PUT /api/v1/admin/reviews/{review}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-reviews-review"></a>

### `DELETE /api/v1/admin/reviews/{review}`

Delete it.

Auth: token with permission `reviews.delete`

Path: `review`

**Example**

```http
DELETE /api/v1/admin/reviews/2
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/reviews/{review}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Home page and banners

---

<a id="get-admin-home-sections"></a>

### `GET /api/v1/admin/home-sections`

The home page, section by section.

Auth: token with permission `storefront.view`

**Example**

```http
GET /api/v1/admin/home-sections
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "type": "categories",
      "title": "Shop by category",
      "heading": "Shop by category",
      "subtitle": null,
      "is_active": true,
      "position": 0,
      "settings": {
        "limit": 8
      },
      "starts_at": null,
      "ends_at": null,
      "picks_items": true,
      "item_ids": []
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/home-sections` · [back to contents](#contents)</sub>

---

<a id="get-admin-home-sections-types"></a>

### `GET /api/v1/admin/home-sections/types`

The kinds of section that can be added.

Auth: token with permission `storefront.view`

**Example**

```http
GET /api/v1/admin/home-sections/types
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "type": "slider",
      "default_title": "",
      "picks_items": false,
      "needs_category": false,
      "shows_products": false
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/home-sections/types` · [back to contents](#contents)</sub>

---

<a id="get-admin-home-sections-homesection"></a>

### `GET /api/v1/admin/home-sections/{homeSection}`

One section.

Auth: token with permission `storefront.view`

Path: `homeSection`

**Example**

```http
GET /api/v1/admin/home-sections/5
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 5,
    "type": "custom",
    "title": "Our recommendations",
    "heading": "Our recommendations",
    "subtitle": null,
    "is_active": true,
    "position": 1,
    "settings": {
      "limit": 8
    },
    "starts_at": null,
    "ends_at": null,
    "picks_items": true,
    "item_ids": [
      1
    ]
  }
}
```

<sub>End of `GET /api/v1/admin/home-sections/{homeSection}` · [back to contents](#contents)</sub>

---

<a id="post-admin-home-sections"></a>

### `POST /api/v1/admin/home-sections`

Add a section.

Auth: token with permission `storefront.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `type` | Yes | One of `slider`, `categories`, `brands`, `featured`, `trending`, `new_arrivals`, `popular`, `best_sellers`, `flash_sale`, `offer_banners`, `featured_reviews`, `newsletter`, `custom`, `category` |
| `title` | No | String, up to 255 characters, may be `null` |
| `subtitle` | No | String, up to 500 characters, may be `null` |
| `is_active` | No | Boolean |
| `position` | No | Integer, at least 0, at most 1000 |
| `starts_at` | No | Date, `date`, may be `null` |
| `ends_at` | No | Date, `date`, after `starts_at`, may be `null` |
| `settings` | No | Object, may be `null` |
| `settings.limit` | No | Integer, at least 1, at most 48 |
| `settings.category_id` | No | Integer, an existing `categories` id |
| `settings.mode` | No | String, one of `latest`, `best_selling`, `popular`, `rating`, `discounted` |
| `item_ids` | No | List, up to 48 items |
| `item_ids[]` | No | Integer, at least 1 |

**Example**

```http
POST /api/v1/admin/home-sections
Authorization: Bearer <token>
```
```json
{
  "type": "custom",
  "title": "Our recommendations",
  "item_ids": [
    1
  ],
  "position": 1,
  "settings": {
    "limit": 8
  }
}
```

Response `201`
```json
{
  "data": {
    "id": 5,
    "type": "custom",
    "title": "Our recommendations",
    "heading": "Our recommendations",
    "subtitle": null,
    "is_active": true,
    "position": 1,
    "settings": {
      "limit": 8
    },
    "starts_at": null,
    "ends_at": null,
    "picks_items": true,
    "item_ids": [
      1
    ]
  }
}
```

<sub>End of `POST /api/v1/admin/home-sections` · [back to contents](#contents)</sub>

---

<a id="put-admin-home-sections-reorder"></a>

### `PUT /api/v1/admin/home-sections/reorder`

Put the sections in a new order.

Auth: token with permission `storefront.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `ids` | Yes | List, at least 1 item, up to 100 items |
| `ids[]` | No | Integer, an existing `home_sections` id |

**Example**

```http
PUT /api/v1/admin/home-sections/reorder
Authorization: Bearer <token>
```
```json
{
  "ids": [
    5,
    1
  ]
}
```

Response `200`
```json
{
  "data": [
    {
      "id": 5,
      "type": "custom",
      "title": "Picked for you",
      "heading": "Picked for you",
      "subtitle": null,
      "is_active": true,
      "position": 0,
      "settings": {
        "limit": 8
      },
      "starts_at": null,
      "ends_at": null,
      "picks_items": true,
      "item_ids": [
        1
      ]
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `PUT /api/v1/admin/home-sections/reorder` · [back to contents](#contents)</sub>

---

<a id="put-admin-home-sections-homesection"></a>

### `PUT /api/v1/admin/home-sections/{homeSection}`

Edit one (sending `item_ids` replaces its contents).

Auth: token with permission `storefront.update`

Path: `homeSection`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `title` | No | String, up to 255 characters, may be `null` |
| `subtitle` | No | String, up to 500 characters, may be `null` |
| `is_active` | No | Boolean |
| `position` | No | Integer, at least 0, at most 1000 |
| `starts_at` | No | Date, `date`, may be `null` |
| `ends_at` | No | Date, `date`, after `starts_at`, may be `null` |
| `settings` | No | Object, may be `null` |
| `settings.limit` | No | Integer, at least 1, at most 48 |
| `settings.category_id` | No | Integer, an existing `categories` id |
| `settings.mode` | No | String, one of `latest`, `best_selling`, `popular`, `rating`, `discounted` |
| `item_ids` | No | List, up to 48 items |
| `item_ids[]` | No | Integer, at least 1 |

**Example**

```http
PUT /api/v1/admin/home-sections/5
Authorization: Bearer <token>
```
```json
{
  "title": "Picked for you",
  "is_active": true
}
```

Response `200`
```json
{
  "data": {
    "id": 5,
    "type": "custom",
    "title": "Picked for you",
    "heading": "Picked for you",
    "subtitle": null,
    "is_active": true,
    "position": 1,
    "settings": {
      "limit": 8
    },
    "starts_at": null,
    "ends_at": null,
    "picks_items": true,
    "item_ids": [
      1
    ]
  }
}
```

<sub>End of `PUT /api/v1/admin/home-sections/{homeSection}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-home-sections-homesection"></a>

### `DELETE /api/v1/admin/home-sections/{homeSection}`

Remove a section.

Auth: token with permission `storefront.update`

Path: `homeSection`

**Example**

```http
DELETE /api/v1/admin/home-sections/5
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/home-sections/{homeSection}` · [back to contents](#contents)</sub>

---

<a id="get-admin-banners"></a>

### `GET /api/v1/admin/banners`

Banners, including scheduled and expired.

Auth: token with permission `storefront.view`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `type` | one of `slider`, `offer` | |

**Example**

```http
GET /api/v1/admin/banners
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": []
}
```

<sub>End of `GET /api/v1/admin/banners` · [back to contents](#contents)</sub>

---

<a id="post-admin-banners"></a>

### `POST /api/v1/admin/banners`

Auth: token with permission `storefront.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `type` | No | One of `slider`, `offer` |
| `title` | No | String, up to 255 characters, may be `null` |
| `subtitle` | No | String, up to 500 characters, may be `null` |
| `button_label` | No | String, up to 64 characters, may be `null` |
| `link_url` | No | String, up to 2048 characters, URL, may be `null` |
| `is_active` | No | Boolean |
| `position` | No | Integer, at least 0, at most 1000 |
| `starts_at` | No | Date, `date`, may be `null` |
| `ends_at` | No | Date, `date`, after `starts_at`, may be `null` |
| `image_id` | Yes | Integer, an existing `media` id |
| `mobile_image_id` | No | Integer, an existing `media` id, may be `null` |

**Example**

```http
POST /api/v1/admin/banners
Authorization: Bearer <token>
```
```json
{
  "type": "slider",
  "title": "Eid sale",
  "subtitle": "Up to 40% off",
  "button_label": "Shop now",
  "link_url": "https://example.com/offers",
  "image_id": 3,
  "position": 0,
  "is_active": true,
  "starts_at": null,
  "ends_at": null
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "type": "slider",
    "title": "Eid sale",
    "subtitle": "Up to 40% off",
    "button_label": "Shop now",
    "link_url": "https://example.com/offers",
    "is_active": true,
    "position": 0,
    "starts_at": null,
    "ends_at": null,
    "is_live": true,
    "image": {
      "id": 3,
      "url": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/full.webp",
      "sizes": {
        "thumb": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/thumb.webp",
        "card": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/card.webp",
        "full": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/full.webp"
      },
      "width": 64,
      "height": 64,
      "alt": "Eid sale"
    },
    "mobile_image": null
  }
}
```

<sub>End of `POST /api/v1/admin/banners` · [back to contents](#contents)</sub>

---

<a id="put-admin-banners-banner"></a>

### `PUT /api/v1/admin/banners/{banner}`

Auth: token with permission `storefront.update`

Path: `banner`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `type` | No | One of `slider`, `offer` |
| `title` | No | String, up to 255 characters, may be `null` |
| `subtitle` | No | String, up to 500 characters, may be `null` |
| `button_label` | No | String, up to 64 characters, may be `null` |
| `link_url` | No | String, up to 2048 characters, URL, may be `null` |
| `is_active` | No | Boolean |
| `position` | No | Integer, at least 0, at most 1000 |
| `starts_at` | No | Date, `date`, may be `null` |
| `ends_at` | No | Date, `date`, after `starts_at`, may be `null` |
| `image_id` | No | Integer, an existing `media` id |
| `mobile_image_id` | No | Integer, an existing `media` id, may be `null` |

**Example**

```http
PUT /api/v1/admin/banners/1
Authorization: Bearer <token>
```
```json
{
  "title": "Eid sale — final days"
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "type": "slider",
    "title": "Eid sale — final days",
    "subtitle": "Up to 40% off",
    "button_label": "Shop now",
    "link_url": "https://example.com/offers",
    "is_active": true,
    "position": 0,
    "starts_at": null,
    "ends_at": null,
    "is_live": true,
    "image": {
      "id": 3,
      "url": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/full.webp",
      "sizes": {
        "thumb": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/thumb.webp",
        "card": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/card.webp",
        "full": "http://localhost:8000/storage/media/2026/10/01M3VR4D8YC78D68TG60BDV4C9/full.webp"
      },
      "width": 64,
      "height": 64,
      "alt": "Eid sale"
    },
    "mobile_image": null
  }
}
```

<sub>End of `PUT /api/v1/admin/banners/{banner}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-banners-banner"></a>

### `DELETE /api/v1/admin/banners/{banner}`

Auth: token with permission `storefront.update`

Path: `banner`

**Example**

```http
DELETE /api/v1/admin/banners/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/banners/{banner}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Pages, FAQs and the inbox

---

<a id="get-admin-pages"></a>

### `GET /api/v1/admin/pages`

Standing pages.

Auth: token with permission `content.view`

**Example**

```http
GET /api/v1/admin/pages
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "slug": "about-us",
      "title": "About us",
      "content": "<p>A demonstration shop, selling safety equipment and fasteners.</p>",
      "is_active": true,
      "seo_title": null,
      "seo_description": null,
      "updated_at": "2026-10-01T12:48:08.000000Z"
    }
  ]
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/pages` · [back to contents](#contents)</sub>

---

<a id="get-admin-pages-page"></a>

### `GET /api/v1/admin/pages/{page}`

One page.

Auth: token with permission `content.view`

Path: `page`

**Example**

```http
GET /api/v1/admin/pages/4
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 4,
    "slug": "terms-conditions",
    "title": "Terms & conditions",
    "content": "<p>Written in the back office.</p>",
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "updated_at": "2026-10-01T12:48:20.000000Z"
  }
}
```

<sub>End of `GET /api/v1/admin/pages/{page}` · [back to contents](#contents)</sub>

---

<a id="post-admin-pages"></a>

### `POST /api/v1/admin/pages`

Auth: token with permission `content.create`/`update`/`delete`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `title` | Yes | String, up to 255 characters |
| `slug` | No | String, up to 200 characters, letters, numbers, `-` and `_`, must not be taken |
| `content` | No | String, up to 200000 characters, may be `null` |
| `is_active` | No | Boolean |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |

**Example**

```http
POST /api/v1/admin/pages
Authorization: Bearer <token>
```
```json
{
  "title": "Terms & conditions",
  "content": "<p>Written in the back office.</p>",
  "is_active": true
}
```

Response `201`
```json
{
  "data": {
    "id": 4,
    "slug": "terms-conditions",
    "title": "Terms & conditions",
    "content": "<p>Written in the back office.</p>",
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "updated_at": "2026-10-01T12:48:20.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/pages` · [back to contents](#contents)</sub>

---

<a id="put-admin-pages-page"></a>

### `PUT /api/v1/admin/pages/{page}`

Auth: token with permission `content.create`/`update`/`delete`

Path: `page`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `title` | No | String, up to 255 characters |
| `slug` | No | String, up to 200 characters, letters, numbers, `-` and `_`, must not be taken |
| `content` | No | String, up to 200000 characters, may be `null` |
| `is_active` | No | Boolean |
| `seo_title` | No | String, up to 255 characters, may be `null` |
| `seo_description` | No | String, up to 500 characters, may be `null` |

**Example**

```http
PUT /api/v1/admin/pages/4
Authorization: Bearer <token>
```
```json
{
  "content": "<p>Updated terms.</p>"
}
```

Response `200`
```json
{
  "data": {
    "id": 4,
    "slug": "terms-conditions",
    "title": "Terms & conditions",
    "content": "<p>Updated terms.</p>",
    "is_active": true,
    "seo_title": null,
    "seo_description": null,
    "updated_at": "2026-10-01T12:48:20.000000Z"
  }
}
```

<sub>End of `PUT /api/v1/admin/pages/{page}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-pages-page"></a>

### `DELETE /api/v1/admin/pages/{page}`

Auth: token with permission `content.create`/`update`/`delete`

Path: `page`

**Example**

```http
DELETE /api/v1/admin/pages/4
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/pages/{page}` · [back to contents](#contents)</sub>

---

<a id="get-admin-faqs"></a>

### `GET /api/v1/admin/faqs`

Questions and answers.

Auth: token with permission `content.view`

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `group` | string | |

**Example**

```http
GET /api/v1/admin/faqs
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": []
}
```

<sub>End of `GET /api/v1/admin/faqs` · [back to contents](#contents)</sub>

---

<a id="post-admin-faqs"></a>

### `POST /api/v1/admin/faqs`

Auth: token with permission `content.create`/`update`/`delete`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `question` | Yes | String, up to 500 characters |
| `answer` | Yes | String, up to 20000 characters |
| `group` | No | String, up to 64 characters, may be `null` |
| `is_active` | No | Boolean |
| `position` | No | Integer, at least 0, at most 1000 |

**Example**

```http
POST /api/v1/admin/faqs
Authorization: Bearer <token>
```
```json
{
  "question": "How long does delivery take?",
  "answer": "<p>1-2 days inside Dhaka, 3-5 days elsewhere.</p>",
  "group": "Delivery",
  "position": 0,
  "is_active": true
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "question": "How long does delivery take?",
    "answer": "<p>1-2 days inside Dhaka, 3-5 days elsewhere.</p>",
    "group": "Delivery",
    "is_active": true,
    "position": 0
  }
}
```

<sub>End of `POST /api/v1/admin/faqs` · [back to contents](#contents)</sub>

---

<a id="put-admin-faqs-faq"></a>

### `PUT /api/v1/admin/faqs/{faq}`

Auth: token with permission `content.create`/`update`/`delete`

Path: `faq`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `question` | No | String, up to 500 characters |
| `answer` | No | String, up to 20000 characters |
| `group` | No | String, up to 64 characters, may be `null` |
| `is_active` | No | Boolean |
| `position` | No | Integer, at least 0, at most 1000 |

**Example**

```http
PUT /api/v1/admin/faqs/1
Authorization: Bearer <token>
```
```json
{
  "position": 1
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "question": "How long does delivery take?",
    "answer": "<p>1-2 days inside Dhaka, 3-5 days elsewhere.</p>",
    "group": "Delivery",
    "is_active": true,
    "position": 1
  }
}
```

<sub>End of `PUT /api/v1/admin/faqs/{faq}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-faqs-faq"></a>

### `DELETE /api/v1/admin/faqs/{faq}`

Auth: token with permission `content.create`/`update`/`delete`

Path: `faq`

**Example**

```http
DELETE /api/v1/admin/faqs/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/faqs/{faq}` · [back to contents](#contents)</sub>

---

<a id="get-admin-contact-messages"></a>

### `GET /api/v1/admin/contact-messages`

The contact form's inbox (`unread=1`).

Auth: token with permission `content.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `unread` | boolean | `1` or `0` |
| `q` | string | search text |

**Example**

```http
GET /api/v1/admin/contact-messages
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Curious Visitor",
      "email": null,
      "phone": "01911112222",
      "subject": "Do you deliver to Khulna?",
      "message": "Asking before I order.",
      "is_read": false,
      "replied_at": null,
      "customer": null,
      "created_at": "2026-10-01T12:48:19.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/contact-messages?page=1",
    "last": "http://localhost:8000/api/v1/admin/contact-messages?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/contact-messages",
    "per_page": 25,
    "to": 1,
    "total": 1,
    "unread": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/contact-messages` · [back to contents](#contents)</sub>

---

<a id="get-admin-contact-messages-contactmessage"></a>

### `GET /api/v1/admin/contact-messages/{contactMessage}`

One message.

Auth: token with permission `content.view`

Path: `contactMessage`

**Example**

```http
GET /api/v1/admin/contact-messages/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "name": "Curious Visitor",
    "email": null,
    "phone": "01911112222",
    "subject": "Do you deliver to Khulna?",
    "message": "Asking before I order.",
    "is_read": true,
    "replied_at": null,
    "customer": null,
    "created_at": "2026-10-01T12:48:19.000000Z"
  }
}
```

<sub>End of `GET /api/v1/admin/contact-messages/{contactMessage}` · [back to contents](#contents)</sub>

---

<a id="post-admin-contact-messages-contactmessage-replied"></a>

### `POST /api/v1/admin/contact-messages/{contactMessage}/replied`

Mark one answered.

Auth: token with permission `content.update`

Path: `contactMessage`

**Example**

```http
POST /api/v1/admin/contact-messages/1/replied
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "name": "Curious Visitor",
    "email": null,
    "phone": "01911112222",
    "subject": "Do you deliver to Khulna?",
    "message": "Asking before I order.",
    "is_read": true,
    "replied_at": "2026-10-01T12:48:20.000000Z",
    "customer": null,
    "created_at": "2026-10-01T12:48:19.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/contact-messages/{contactMessage}/replied` · [back to contents](#contents)</sub>

---

<a id="delete-admin-contact-messages-contactmessage"></a>

### `DELETE /api/v1/admin/contact-messages/{contactMessage}`

Delete one.

Auth: token with permission `content.delete`

Path: `contactMessage`

**Example**

```http
DELETE /api/v1/admin/contact-messages/1
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/contact-messages/{contactMessage}` · [back to contents](#contents)</sub>


## Admin endpoints (the back office) · Newsletter

---

<a id="get-admin-newsletter-subscribers"></a>

### `GET /api/v1/admin/newsletter/subscribers`

The mailing list.

Auth: token with permission `marketing.view` · _paginated_

**Query parameters**

| Query | Type | Notes |
| --- | --- | --- |
| `subscribed` | boolean | `1` or `0` |
| `q` | string | search text |

**Example**

```http
GET /api/v1/admin/newsletter/subscribers
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "email": "reader@example.com",
      "source": "footer",
      "is_subscribed": true,
      "subscribed_at": "2026-10-01T12:48:19.000000Z",
      "unsubscribed_at": null
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/newsletter/subscribers?page=1",
    "last": "http://localhost:8000/api/v1/admin/newsletter/subscribers?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/newsletter/subscribers",
    "per_page": 25,
    "to": 1,
    "total": 1,
    "subscribed": 1
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/newsletter/subscribers` · [back to contents](#contents)</sub>

---

<a id="get-admin-newsletter-campaigns"></a>

### `GET /api/v1/admin/newsletter/campaigns`

Auth: token with permission `marketing.view` · _paginated_

**Example**

```http
GET /api/v1/admin/newsletter/campaigns
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": [],
  "links": {
    "first": "http://localhost:8000/api/v1/admin/newsletter/campaigns?page=1",
    "last": "http://localhost:8000/api/v1/admin/newsletter/campaigns?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": null,
    "last_page": 1,
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      }
    ],
    "path": "http://localhost:8000/api/v1/admin/newsletter/campaigns",
    "per_page": 25,
    "to": null,
    "total": 0
  }
}
```
_Lists trimmed to their first item; long text shortened._

<sub>End of `GET /api/v1/admin/newsletter/campaigns` · [back to contents](#contents)</sub>

---

<a id="get-admin-newsletter-campaigns-campaign"></a>

### `GET /api/v1/admin/newsletter/campaigns/{campaign}`

Auth: token with permission `marketing.view`

Path: `campaign`

**Example**

```http
GET /api/v1/admin/newsletter/campaigns/1
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "subject": "Eid offers",
    "body": "Up to 40% off this week.",
    "status": "draft",
    "recipient_count": 0,
    "sent_count": 0,
    "scheduled_at": null,
    "sent_at": null,
    "author": "Store Owner",
    "created_at": "2026-10-01T12:48:21.000000Z"
  }
}
```

<sub>End of `GET /api/v1/admin/newsletter/campaigns/{campaign}` · [back to contents](#contents)</sub>

---

<a id="post-admin-newsletter-campaigns"></a>

### `POST /api/v1/admin/newsletter/campaigns`

Auth: token with permission `marketing.update`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `subject` | Yes | String, up to 255 characters |
| `body` | Yes | String, up to 100000 characters |
| `scheduled_at` | No | Date, `date`, after `now`, may be `null` |

**Example**

```http
POST /api/v1/admin/newsletter/campaigns
Authorization: Bearer <token>
```
```json
{
  "subject": "Eid offers",
  "body": "Up to 40% off this week."
}
```

Response `201`
```json
{
  "data": {
    "id": 1,
    "subject": "Eid offers",
    "body": "Up to 40% off this week.",
    "status": "draft",
    "recipient_count": 0,
    "sent_count": 0,
    "scheduled_at": null,
    "sent_at": null,
    "created_at": "2026-10-01T12:48:21.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/newsletter/campaigns` · [back to contents](#contents)</sub>

---

<a id="put-admin-newsletter-campaigns-campaign"></a>

### `PUT /api/v1/admin/newsletter/campaigns/{campaign}`

Edit a campaign that has not gone out. One that has is a record of what people were sent, and changing it would make that record a lie.

Auth: token with permission `marketing.update`

Path: `campaign`

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| `subject` | No | String, up to 255 characters |
| `body` | No | String, up to 100000 characters |
| `scheduled_at` | No | Date, `date`, after `now`, may be `null` |

**Example**

```http
PUT /api/v1/admin/newsletter/campaigns/1
Authorization: Bearer <token>
```
```json
{
  "subject": "Eid offers — this week only"
}
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "subject": "Eid offers — this week only",
    "body": "Up to 40% off this week.",
    "status": "draft",
    "recipient_count": 0,
    "sent_count": 0,
    "scheduled_at": null,
    "sent_at": null,
    "author": "Store Owner",
    "created_at": "2026-10-01T12:48:21.000000Z"
  }
}
```

<sub>End of `PUT /api/v1/admin/newsletter/campaigns/{campaign}` · [back to contents](#contents)</sub>

---

<a id="delete-admin-newsletter-campaigns-campaign"></a>

### `DELETE /api/v1/admin/newsletter/campaigns/{campaign}`

Auth: token with permission `marketing.update`

Path: `campaign`

**Example**

```http
DELETE /api/v1/admin/newsletter/campaigns/2
Authorization: Bearer <token>
```

Response `204`, no body.

<sub>End of `DELETE /api/v1/admin/newsletter/campaigns/{campaign}` · [back to contents](#contents)</sub>

---

<a id="post-admin-newsletter-campaigns-campaign-send"></a>

### `POST /api/v1/admin/newsletter/campaigns/{campaign}/send`

Send it (queued, in chunks).

Auth: token with permission `marketing.update`

Path: `campaign`

**Example**

```http
POST /api/v1/admin/newsletter/campaigns/1/send
Authorization: Bearer <token>
```

Response `200`
```json
{
  "data": {
    "id": 1,
    "subject": "Eid offers — this week only",
    "body": "Up to 40% off this week.",
    "status": "sent",
    "recipient_count": 1,
    "sent_count": 1,
    "scheduled_at": null,
    "sent_at": "2026-10-01T12:48:21.000000Z",
    "author": "Store Owner",
    "created_at": "2026-10-01T12:48:21.000000Z"
  }
}
```

<sub>End of `POST /api/v1/admin/newsletter/campaigns/{campaign}/send` · [back to contents](#contents)</sub>