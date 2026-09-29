# Shino-Bangla eCommerce Backend — Complete Frontend API Specification

> **Frontend Developer Guide & Reference**  
> This specification provides all 224 endpoints across 25 modules, including HTTP methods, URL paths, headers, query parameters, request payloads, response structures, and HTTP status codes.

---

## 1. System Architecture & Frontend Integration Rules

### Base URL
`http://13.140.181.253/api/v1`

### Authentication
- Uses **Laravel Sanctum Bearer tokens**.
- Send on all protected endpoints as: `Authorization: Bearer <token>`
- Returned upon successful login/verification under `data.token.token`.
- Tokens include `expires_at` (default 7 days) and `abilities: ['*']`.

### Money & Prices (Integer Poisha)
- **All currency is in integer poisha** (৳1.00 = 100 poisha). E.g., `৳12.50` is `1250`, `৳2,305.00` is `230500`.
- **Frontend display:** Divide by `100` before showing (`(amount / 100).toFixed(2)`).
- **Payloads:** Always send prices as integers in poisha.

### Tax / VAT Rates (Basis Points)
- VAT rates are returned as integer **basis points** (15% VAT = `1500` bp, 5% = `500` bp).
- **Frontend display:** Divide by `100` to get the percentage value (`1500 / 100 = 15%`).

### Phone Numbers
- Input formats accepted: `01712345678`, `8801712345678`, `+880 1712-345678`, or Bangla digits `০১৭১২৩৪৫৬৭৮`.
- Always returned standardized as `+8801712345678`.

### Guest vs Logged-In Cart Lifecycle
1. **Guest Shopper:** The first `POST /api/v1/cart/items` returns `data.token`. Save this token in `localStorage`.
2. Pass `X-Cart-Token: <token>` on all cart operations for guests.
3. **Claiming on Login:** When the guest logs in or registers, call `POST /api/v1/cart/claim` with `Authorization: Bearer <auth_token>` AND `X-Cart-Token: <token>`. This merges guest items into their customer account.
4. **Delivery Quote in Cart:** Pass `?location_id=<district_id>` to any cart GET request to compute shipping in totals.

### Idempotent Order Placement
- When placing an order via `POST /api/v1/checkout`, provide an `Idempotency-Key` header with a unique UUID.
- If network fails and retries, the same key safely returns the existing order rather than placing a duplicate.

### Standard Response Envelopes

#### Single Resource / Mutation Success (200 OK / 201 Created):
```json
{
  "data": {
    "id": 1,
    "name": "..."
  }
}
```

#### Paginated List Success (200 OK):
```json
{
  "data": [
    { "id": 1, "name": "..." }
  ],
  "links": {
    "first": "http://.../api/v1/products?page=1",
    "last": "http://.../api/v1/products?page=5",
    "prev": null,
    "next": "http://.../api/v1/products?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 24,
    "to": 24,
    "total": 120
  }
}
```

#### Empty Action Success (204 No Content):
HTTP 204 with an empty body (e.g. for `DELETE` endpoints, marking items as read/viewed).

#### Standard Error Envelope (4xx / 5xx):
```json
{
  "message": "Human-readable explanation of error",
  "code": "VALIDATION_FAILED",
  "request_id": "9d3752e2-04fc-4e6a-bc91-231908d08479",
  "errors": {
    "email": ["The email field is required."]
  }
}
```
- `code`: Machine-readable constant (e.g. `ACCOUNT_NOT_VERIFIED`, `INSUFFICIENT_STOCK`, `COUPON_INVALID`). Branch UI state on `code`!
- `errors`: Present on validation failures (`422`) or stock shortages (`409`), mapping field names to message arrays.

### Status Code Dictionary

| HTTP Status | Meaning | Typical Usage in this API |
|---|---|---|
| **200 OK** | Success | Standard GET data retrieval or synchronous update |
| **201 Created** | Created | Resource created (`POST /cart/items`, `POST /addresses`, `POST /orders`) |
| **202 Accepted** | Queued / Pending Action | Action initiated (`POST /auth/register` waiting OTP, `POST /product-imports` background queue) |
| **204 No Content** | Success (No Body) | Deleting resources, logging views (`DELETE /cart/items/{id}`, `POST /track/view`) |
| **400 Bad Request** | Malformed Request | General client error |
| **401 Unauthorized** | Unauthenticated | Missing or expired Bearer token (`code: UNAUTHENTICATED`) |
| **403 Forbidden** | Not Permitted | Insufficient permissions, account inactive, or unverified (`ACCOUNT_NOT_VERIFIED`) |
| **404 Not Found** | Resource Missing | Non-existent product slug, invalid id (`code: NOT_FOUND`) |
| **409 Conflict** | Business Rule Violation | State mismatch (`INSUFFICIENT_STOCK`, `INVALID_ORDER_TRANSITION`, `COUPON_INVALID`) |
| **422 Unprocessable Entity** | Form Validation Failed | Invalid fields (`code: VALIDATION_FAILED` with `errors` object) |
| **429 Too Many Requests** | Rate Limit Hit | Cooldown active (`OTP_COOLDOWN`, carries `Retry-After` header) |
| **500 Server Error** | Internal Failure | Bug or server failure (`code: SERVER_ERROR`) |

---

## 2. Comprehensive Endpoint Catalog by Module

### 00 · Start here (2 endpoints)

***Run the folders in order.** Each request saves what the next one needs - tokens, ids, the order number - into collection variables, so nothing is copied by hand.

**Setup**
```
php artisan serve
php artisan db:seed --class=DemoStoreSeeder
php artisan queue:work    # only for report files and order emails
```

**Money** is an integer number of poisha: `230500` is ৳2,305.00. VAT rates are basis points: `1500` is 15%.

**Payment** here is cash on delivery. SSLCommerz is wired but unconfigured, so it is simply not offered until credentials are set.

**Errors** all look the same: `{message, code, request_id, errors?}`.*

#### `GET` `/api/v1/api/v1/health` — **Health**
- **Description:** Is the API up? Deliberately unauthenticated: a monitor that needs a credential stops working exactly when it is most needed.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/settings` — **Public settings**
- **Description:** Store name, contact details, logo, and which payment methods are switched on.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

### 01 · Browse the shop (21 endpoints)

#### `GET` `/api/v1/api/v1/categories` — **Categories**
- **Description:** The visible tree with product counts, for the menu. Unlimited nesting.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/categories/fire-extinguishers` — **One category**
- **Description:** Breadcrumbs, subcategories, SEO fields and the VAT rate that applies.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/brands` — **Brands**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/brands/{{brand_slug}}` — **One brand**
- **Description:** Set brand_slug first; the demo catalogue has no brands until you add one in folder 12.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/products?per_page=12` — **Products**
- **Description:** Filters, all combinable: `category` (slug, includes subcategories), `brand`, `price_min`, `price_max`, `option[{option type id}][]=5kg`, `rating_min`, `in_stock=1`, `flag` (featured, trending, new_arrival, best_seller, on_sale), `q`. Sorts: newest, relevance, price_asc, price_desc, popular, best_selling, rating, name.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `per_page` = `12`
- **Payload:** None

#### `GET` `/api/v1/api/v1/products?q=অগ্নি` — **Products · search in Bangla**
- **Description:** Bangla search. Bangla digits (৫) match ASCII ones (5).
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `q` = `অগ্নি`
- **Payload:** None

#### `GET` `/api/v1/api/v1/products?in_stock=1&sort=price_asc` — **Products · in stock, cheapest first**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `in_stock` = `1`
  - `sort` = `price_asc`
- **Payload:** None

#### `GET` `/api/v1/api/v1/products/facets` — **Filter counts**
- **Description:** How many products each filter would leave, for the sidebar.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/products/suggest?q=fire` — **Live search suggestions**
- **Description:** Products, categories and brands for the search box.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `q` = `fire`
- **Payload:** None

#### `GET` `/api/v1/api/v1/products/{{product_slug}}` — **Product page**
- **Description:** Every variant priced. Saves the first variant id for the cart.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/products/{{product_slug}}/related?type=related` — **Related products**
- **Description:** `type`: related, cross_sell or upsell.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `type` = `related`
- **Payload:** None

#### `GET` `/api/v1/api/v1/products/{{product_slug}}/reviews` — **Product reviews**
- **Description:** Approved reviews only, with the star breakdown in `meta.summary`.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/home` — **Home page**
- **Description:** Every section the owner arranged, in order, in one call.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/pages` — **Footer pages**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/pages/about-us` — **One page**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/faqs` — **FAQs**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/sitemap?type=products` — **Sitemap slugs**
- **Description:** `type`: products, categories, brands, pages. Paged with `page`.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `type` = `products`
- **Payload:** None

#### `GET` `/api/v1/api/v1/locations` — **Divisions**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `GET` `/api/v1/api/v1/locations?parent_id=1` — **Districts of a division**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `parent_id` = `1`
- **Payload:** None

#### `GET` `/api/v1/api/v1/shipping/zones` — **Delivery zones**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload:** None

#### `POST` `/api/v1/api/v1/track/view` — **Track a view**
- **Description:** Counted after the response is sent. The visitor becomes a one-day hash; no address is stored.
- **Success Status Code:** `204`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "product_slug": "{{product_slug}}"
}
```

### 02 · Sign in & the account (16 endpoints)

#### `POST` `/api/v1/api/v1/auth/login` — **Sign in (seeded customer)**
- **Description:** `login` is an email address or a Bangladeshi mobile number. The seeded customer is already verified, so no code is needed.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "login": "customer@example.com",
  "password": "{{demo_password}}"
}
```

#### `GET` `/api/v1/api/v1/me` — **Who am I**
- **Description:** Profile, roles and every permission the account holds.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/me` — **Change my name**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "name": "Rafi Ahmed"
}
```

#### `POST` `/api/v1/api/v1/auth/register` — **Register**
- **Description:** 202 and a six digit code. With SMS_DRIVER=log the code goes to storage/logs/laravel.log - copy it into the next request.
- **Success Status Code:** `202`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "name": "New Shopper",
  "login": "01911111111",
  "password": "Demo-Password-1!"
}
```

#### `POST` `/api/v1/api/v1/auth/otp/verify` — **Verify the code**
- **Description:** Returns the first token. Replace `code` with the one from the log.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "login": "01911111111",
  "code": "000000",
  "purpose": "verify"
}
```

#### `POST` `/api/v1/api/v1/auth/otp/resend` — **Send the code again**
- **Description:** Answers the same way whether or not that account exists.
- **Success Status Code:** `202`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "login": "01911111111",
  "purpose": "verify"
}
```

#### `POST` `/api/v1/api/v1/auth/forgot-password` — **Forgot password**
- **Description:** Identical answer for a known and an unknown address, so nobody can learn which addresses have accounts.
- **Success Status Code:** `202`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "login": "customer@example.com"
}
```

#### `POST` `/api/v1/api/v1/auth/reset-password` — **Reset it with the code**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "login": "customer@example.com",
  "code": "000000",
  "password": "New-Password-1!",
  "password_confirmation": "New-Password-1!"
}
```

#### `PUT` `/api/v1/api/v1/auth/password` — **Change my password**
- **Description:** `current_password` is only required when the account has one - an account made through Google has none until it sets one here.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "current_password": "{{demo_password}}",
  "password": "Demo-Password-1!",
  "password_confirmation": "Demo-Password-1!"
}
```

#### `POST` `/api/v1/api/v1/auth/google` — **Sign in with Google**
- **Description:** The frontend gets the id token from Google and posts it here. Answers 503 if GOOGLE_CLIENT_ID is unset, and refuses tokens issued for any other client.
- **Success Status Code:** `422`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "id_token": "the-id-token-from-google-identity-services"
}
```

#### `POST` `/api/v1/api/v1/me/contact` — **Change my email or mobile**
- **Description:** Sends a code to the new address; nothing changes until it is entered.
- **Success Status Code:** `202`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "login": "newaddress@example.com"
}
```

#### `POST` `/api/v1/api/v1/me/contact/verify` — **Confirm the change**
- **Description:** Verifying a mobile number here is also what hands over any Buy Now orders placed with it.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "login": "newaddress@example.com",
  "code": "000000"
}
```

#### `GET` `/api/v1/api/v1/auth/tokens` — **My signed-in devices**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/auth/tokens/{{token_id}}` — **Revoke one device**
- **Description:** Revoking the token you are using signs you out immediately.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/auth/logout` — **Sign out**
- **Description:** Run this last: it revokes {{customer_token}}. Sign in again to carry on.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/auth/logout-all` — **Sign out everywhere**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

### 03 · Addresses (4 endpoints)

#### `GET` `/api/v1/api/v1/me/addresses` — **My addresses**
- **Description:** Default first. Saves address_id and district_id for checkout.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/me/addresses` — **Add one**
- **Description:** `district_id` is what the delivery charge is worked out from; the rest is free text, so an address with no postcode is not a problem. The first one saved becomes the default.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "label": "Office",
  "name": "Rafi Ahmed",
  "phone": "01712345678",
  "district_id": "{{district_id}}",
  "area": "Motijheel",
  "line1": "Suite 9, 12/A Motijheel",
  "postcode": "1000"
}
```

#### `PUT` `/api/v1/api/v1/me/addresses/{{new_address_id}}` — **Edit it**
- **Description:** Setting a new default clears the old one.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "label": "Work",
  "is_default_shipping": true
}
```

#### `DELETE` `/api/v1/api/v1/me/addresses/{{new_address_id}}` — **Delete it**
- **Description:** Past orders keep their own copy of the address, so nothing already ordered changes.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

### 04 · Wishlist & recently viewed (5 endpoints)

#### `GET` `/api/v1/api/v1/me/wishlist` — **My wishlist**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/me/wishlist` — **Save a product**
- **Description:** Saving the same product twice is harmless.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "product_id": "{{product_id}}"
}
```

#### `DELETE` `/api/v1/api/v1/me/wishlist/{{product_id}}` — **Unsave it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/me/recently-viewed` — **Note a product as viewed**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "product_id": "{{product_id}}"
}
```

#### `GET` `/api/v1/api/v1/me/recently-viewed` — **Recently viewed**
- **Description:** Hidden and deleted products drop out of the list.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

### 05 · Cart (11 endpoints)

#### `POST` `/api/v1/api/v1/cart/items` — **Add to cart (signed in)**
- **Description:** What a shopper buys is a *variant*. Adding the same one again adds to its quantity. Refused if there is not enough stock.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "variant_id": "{{variant_id}}",
  "quantity": 2
}
```

#### `GET` `/api/v1/api/v1/cart?location_id={{district_id}}` — **View the cart**
- **Description:** Pass `location_id` (a district) to see the delivery charge in the totals. Each line says whether it is still available and whether its price has moved.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Query Parameters:**
  - `location_id` = `{{district_id}}`
- **Payload:** None

#### `PATCH` `/api/v1/api/v1/cart/items/{{cart_item_id}}` — **Change a quantity**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "quantity": 3
}
```

#### `POST` `/api/v1/api/v1/cart/items/{{cart_item_id}}/save-for-later` — **Save a line for later**
- **Description:** Kept, but out of the total.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/cart/items/{{cart_item_id}}/move-to-cart` — **Put it back**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/cart/coupon` — **Apply a coupon**
- **Description:** DEMO10 is 10% off capped at ৳1,000; FLAT100 is ৳100 off orders over ৳1,000. A coupon that stops applying is set aside with a note in the cart, and refused outright at checkout.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "code": "DEMO10"
}
```

#### `DELETE` `/api/v1/api/v1/cart/coupon` — **Remove the coupon**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/cart/items/{{cart_item_id}}` — **Remove a line**
- **Description:** Run this after checkout, or add the item again before folder 06.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/cart/items` — **Add to cart as a visitor**
- **Description:** No sign-in. The first call returns a `token`; send it back as `X-Cart-Token`.
- **Success Status Code:** `201`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "variant_id": "{{variant_id}}",
  "quantity": 1
}
```

#### `GET` `/api/v1/api/v1/cart` — **The visitor's cart**
- **Success Status Code:** `200`
- **Headers:** `X-Cart-Token: {{cart_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/cart/claim` — **Claim it after signing in**
- **Description:** Folds the visitor's cart into the account's: quantities are added up and trimmed to what may be bought. Doing it twice changes nothing.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`, `X-Cart-Token: {{cart_token}}`
- **Payload:** None

### 06 · Checkout · cash on delivery (3 endpoints)

#### `POST` `/api/v1/api/v1/checkout/quote` — **Quote**
- **Description:** What the cart comes to, with the payment methods on offer. Nothing is written. Send `district_id` instead of `address_id` to price delivery without choosing an address.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "address_id": "{{address_id}}"
}
```

#### `POST` `/api/v1/api/v1/checkout` — **Place the order (COD)**
- **Description:** Every order starts **Pending**, whatever the payment method: staff confirm cash orders themselves.

Instead of `address_id` you can type an address:
```
"address": {"name":"Rafi Ahmed","phone":"01712345678",
  "line1":"House 12, Road 4","area":"Dhanmondi","district_id":{{district_id}}}
```
`payment_method`: `cod`, `bank_transfer`, or `sslcommerz` once it is configured.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`, `Idempotency-Key: {{$guid}}`
- **Payload (JSON):**
```json
{
  "address_id": "{{address_id}}",
  "payment_method": "cod",
  "note": "Ring the bell"
}
```

#### `POST` `/api/v1/api/v1/checkout` — **Retry with the same key**
- **Description:** Send this twice. The second call returns the **same** order, not a new one. The same key with a different order answers 409 IDEMPOTENCY_CONFLICT.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`, `Idempotency-Key: retry-demo-key`
- **Payload (JSON):**
```json
{
  "address_id": "{{address_id}}",
  "payment_method": "cod",
  "note": "Ring the bell"
}
```

### 07 · Buy Now · without an account (4 endpoints)

#### `POST` `/api/v1/api/v1/buy-now/quote` — **Quote**
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "variant_id": "{{variant_id}}",
  "quantity": 1,
  "district_id": "{{district_id}}"
}
```

#### `POST` `/api/v1/api/v1/buy-now` — **Order one item (COD)**
- **Description:** No sign-in. The **mobile number is required**: it is how the shop confirms the order, how it is tracked, and how it joins an account later - but only once that account verifies the same number.
- **Success Status Code:** `201`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "variant_id": "{{variant_id}}",
  "quantity": 1,
  "name": "Walk-in Customer",
  "phone": "01812345678",
  "address": {
    "name": "Walk-in Customer",
    "phone": "01812345678",
    "line1": "Shop 4, New Market",
    "area": "New Market",
    "district_id": "{{district_id}}"
  },
  "payment_method": "cod"
}
```

#### `GET` `/api/v1/api/v1/orders/track?number={{guest_order_number}}&phone=01812345678` — **Track it**
- **Description:** A wrong pair answers 404 exactly as an unknown order does, so the endpoint cannot be used to find out who shops here.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Query Parameters:**
  - `number` = `{{guest_order_number}}`
  - `phone` = `01812345678`
- **Payload:** None

#### `POST` `/api/v1/api/v1/orders/{{guest_order_number}}/pay` — **Pay for it online (retry)**
- **Description:** Starts or restarts an online payment and returns `gateway_url`. A cash order answers 409 PAYMENT_NOT_PAYABLE - there is nothing to pay online.
- **Success Status Code:** `409`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "phone": "01812345678"
}
```

### 08 · My orders (4 endpoints)

#### `GET` `/api/v1/api/v1/me/orders` — **My orders**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/me/orders/{{order_number}}` — **One order**
- **Description:** With its timeline. Orders are addressed by their number, never by a row id.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/me/orders/{{order_number}}/invoice` — **Invoice (PDF)**
- **Description:** A real PDF; Bangla renders with its conjuncts joined. Use Postman's 'Save response to file'.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/me/orders/{{order_number}}/cancel` — **Cancel it**
- **Description:** Only while Pending or Confirmed; the stock goes back on the shelf. Skip this if you want to walk the order through the back office in folder 15.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "reason": "Ordered the wrong size"
}
```

### 09 · My reviews (6 endpoints)

#### `GET` `/api/v1/api/v1/me/reviewable-items` — **What can I review?**
- **Description:** Only **delivered** orders appear. Walk an order to Delivered in folder 15 first.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/me/reviews/photos` — **Upload a photo**
- **Description:** JPEG, PNG or WebP. Send the returned id in `photo_ids` below.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (multipart/form-data):**
  - `file` (file): Choose a file in Postman.

#### `POST` `/api/v1/api/v1/me/reviews` — **Write a review**
- **Description:** Stars alone are fine - leave `comment` out. Held for approval, so it will not appear at once.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "product_id": "{{reviewable_product_id}}",
  "order_id": "{{reviewable_order_id}}",
  "rating": 5,
  "comment": "Solid build, arrived the next day."
}
```

#### `GET` `/api/v1/api/v1/me/reviews` — **My reviews**
- **Description:** Approved or not, with the reason if one was turned down.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/me/reviews/{{review_id}}` — **Change it**
- **Description:** Only while it is still waiting. Once approved it is the shop's copy too.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload (JSON):**
```json
{
  "rating": 4,
  "comment": "Good, though the bracket was fiddly."
}
```

#### `DELETE` `/api/v1/api/v1/me/reviews/{{review_id}}` — **Take it back**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Payload:** None

### 10 · Contact & newsletter (3 endpoints)

#### `POST` `/api/v1/api/v1/contact` — **Send a message**
- **Description:** Needs an email address or a mobile number - a message nobody can answer helps nobody. `website` is a honeypot and must stay empty.
- **Success Status Code:** `201`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "name": "Curious Visitor",
  "phone": "01911112222",
  "subject": "Do you deliver to Khulna?",
  "message": "Asking before I order."
}
```

#### `POST` `/api/v1/api/v1/newsletter/subscribe` — **Join the mailing list**
- **Description:** Answers the same way whether or not the address was already on it.
- **Success Status Code:** `202`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "email": "reader@example.com"
}
```

#### `POST` `/api/v1/api/v1/newsletter/unsubscribe` — **Leave it**
- **Description:** Works from the token alone: an unsubscribe link that asks people to sign in is an unsubscribe link that does not work.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "token": "the-token-from-the-email-footer"
}
```

### 11 · Payment callbacks (SSLCommerz) (4 endpoints)

#### `POST` `/api/v1/api/v1/payments/sslcommerz/success` — **Success**
- **Description:** **The gateway calls these, not your frontend.** Listed so you can see what they do.

Nothing in the request is trusted: only `tran_id` and `val_id` are read, and the gateway's validation API is then asked what really happened. The order is confirmed only if it says VALID, about this transaction, for an amount equal to the order total, in the order's currency. Then the shopper is redirected (303) to APP_FRONTEND_URL/checkout/payment?status=…
- **Success Status Code:** `303`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "tran_id": "260920-XXXXX-ABC123",
  "val_id": "the-validation-id"
}
```

#### `POST` `/api/v1/api/v1/payments/sslcommerz/fail` — **Failed**
- **Description:** The order stays open, so the shopper can try again.
- **Success Status Code:** `303`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "tran_id": "260920-XXXXX-ABC123",
  "error": "Card declined"
}
```

#### `POST` `/api/v1/api/v1/payments/sslcommerz/cancel` — **Cancelled**
- **Success Status Code:** `303`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "tran_id": "260920-XXXXX-ABC123"
}
```

#### `POST` `/api/v1/api/v1/payments/sslcommerz/ipn` — **IPN**
- **Description:** The gateway's own server calling this one. **This is the one that matters**: a shopper who closes the tab after paying never reaches the success URL. Register it in the SSLCommerz merchant panel.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "tran_id": "260920-XXXXX-ABC123",
  "val_id": "the-validation-id"
}
```

### 12 · Back office · sign in, settings, media (6 endpoints)

#### `POST` `/api/v1/api/v1/auth/login` — **Sign in (owner)**
- **Description:** The super administrator the seeder created. Put ADMIN_PASSWORD in the environment first.
- **Success Status Code:** `200`
- **Headers:** Default (`Accept: application/json`)
- **Payload (JSON):**
```json
{
  "login": "{{admin_email}}",
  "password": "{{admin_password}}"
}
```

#### `GET` `/api/v1/api/v1/admin/settings` — **Store settings**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/settings` — **Change them**
- **Description:** Send only what changes. Gateway credentials are **not** here - they live in the environment, out of reach of staff.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
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

#### `POST` `/api/v1/api/v1/admin/settings/assets/logo` — **Replace the logo**
- **Description:** `logo`, `favicon` or `invoice-logo`. System files stay on the API's own storage.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (multipart/form-data):**
  - `file` (file): Choose a file in Postman.

#### `POST` `/api/v1/api/v1/admin/media` — **Upload an image**
- **Description:** Upload first, then send the returned id with whatever it belongs to. JPEG, PNG or WebP; stored as resized WebP copies (thumb 200, card 600, full 1600). Anything nothing claims within a day is deleted.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (multipart/form-data):**
  - `file` (file): Choose a file in Postman.
  - `alt` (text): 

#### `DELETE` `/api/v1/api/v1/admin/media/{{media_id}}` — **Delete an image**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 13 · Back office · catalogue (29 endpoints)

#### `GET` `/api/v1/api/v1/admin/brands` — **Brands**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/brands` — **Create a brand**
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Firex",
  "description": "Extinguishers and blankets.",
  "is_active": true
}
```

#### `GET` `/api/v1/api/v1/admin/brands/{{brand_id}}` — **One brand**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/brands/{{brand_id}}` — **Edit it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "description": "Fire safety equipment since 1998.",
  "sort_order": 1
}
```

#### `DELETE` `/api/v1/api/v1/admin/brands/{{brand_id}}` — **Delete it**
- **Description:** Refused with 409 while products still point at it.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/categories` — **Categories**
- **Description:** The whole tree, including inactive branches.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/categories` — **Create a category**
- **Description:** Nesting is unlimited. `vat_rate_bp` is inherited from the parent when left out.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Hose reels",
  "parent_id": "{{category_id}}",
  "vat_rate_bp": 1500,
  "is_active": true
}
```

#### `GET` `/api/v1/api/v1/admin/categories/{{new_category_id}}` — **One category**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/categories/{{new_category_id}}` — **Edit it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "description": "Wall mounted hose reels."
}
```

#### `PUT` `/api/v1/api/v1/admin/categories/{{new_category_id}}/move` — **Move it**
- **Description:** `parent_id: null` makes it a top-level category. Making a category its own descendant is refused.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "parent_id": null,
  "position": 0
}
```

#### `DELETE` `/api/v1/api/v1/admin/categories/{{new_category_id}}` — **Delete it**
- **Description:** Refused while it holds products or subcategories.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/option-types` — **Option types**
- **Description:** Size, Weight, Volume - the kinds of choice a product can offer.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/option-types` — **Create one**
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Length"
}
```

#### `PUT` `/api/v1/api/v1/admin/option-types/{{new_option_type_id}}` — **Rename it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Length (m)"
}
```

#### `DELETE` `/api/v1/api/v1/admin/option-types/{{new_option_type_id}}` — **Delete it**
- **Description:** Refused while a product uses it.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/products` — **Products**
- **Description:** Includes drafts and hidden products, unlike the storefront. Filters: q, status, category_id, brand_id, stock, flag.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/products` — **Create a product (sold in sizes)**
- **Description:** For a product sold in one form: leave out `option_type_id` and send a single variant with no `value`. Prices are poisha and **exclude VAT**.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Fire Blanket",
  "category_id": "{{category_id}}",
  "short_description": "Glass fibre, for kitchen fires.",
  "description": "<p>Pull the tabs and smother the flames.</p>",
  "status": "active",
  "option_type_id": "{{option_type_id}}",
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

#### `GET` `/api/v1/api/v1/admin/products/{{new_product_id}}` — **One product**
- **Description:** Returns the same shape PUT accepts, so an edit form fills from one and posts to the other.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/products/{{new_product_id}}` — **Edit it**
- **Description:** Sending `variants` replaces the whole set; variants left out are deleted (or deactivated if an order references them).
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "is_featured": true,
  "short_description": "Glass fibre. Now on the home page."
}
```

#### `PATCH` `/api/v1/api/v1/admin/products/{{new_product_id}}/status` — **Change its status**
- **Description:** `draft`, `active` or `hidden`.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "hidden"
}
```

#### `POST` `/api/v1/api/v1/admin/products/{{new_product_id}}/duplicate` — **Duplicate it**
- **Description:** A copy as a draft, with fresh SKUs and zero stock.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/products/{{new_product_id}}/links` — **Link related products**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "related": [
    "{{product_id}}"
  ],
  "cross_sell": [],
  "upsell": []
}
```

#### `DELETE` `/api/v1/api/v1/admin/products/{{new_product_id}}` — **Delete it**
- **Description:** Marked deleted, not erased; its SKUs are free to use again.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/products/bulk` — **Bulk change**
- **Description:** `action`: status, flag, price, stock, delete - up to 500 products at a time.

`flag` is `featured`, `trending`, `new_arrival` or `best_seller` (without the `is_` prefix the column has). `price` and `stock` take `mode` (set/add/percent) and `value`.

Deleting also needs products.delete; changing stock needs inventory.adjust.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "action": "flag",
  "ids": [
    "{{product_id}}"
  ],
  "flag": "featured",
  "value": true
}
```

#### `POST` `/api/v1/api/v1/admin/products/images/bulk` — **Bulk image upload**
- **Description:** Matched to variants by the SKU in the filename.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (multipart/form-data):**
  - `files[]` (file): Name each file after its SKU: FE-ABC-1KG.jpg, FE-ABC-1KG_2.jpg

#### `GET` `/api/v1/api/v1/admin/product-imports/template?format=xlsx` — **Import template**
- **Description:** A blank file with the headers and two example rows.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `format` = `xlsx`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/product-imports` — **Import a spreadsheet**
- **Description:** CSV or XLSX, **in taka not poisha** because people edit them by hand. Runs in the background; needs a queue worker.
- **Success Status Code:** `202`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (multipart/form-data):**
  - `file` (file): Choose a file in Postman.

#### `GET` `/api/v1/api/v1/admin/product-imports/{{import_id}}` — **How the import went**
- **Description:** Progress and every refused row with its line number.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/products/export?format=xlsx` — **Export the catalogue**
- **Description:** An export can be edited and imported straight back.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `format` = `xlsx`
- **Payload:** None

### 14 · Back office · inventory (7 endpoints)

#### `GET` `/api/v1/api/v1/admin/inventory?status=low` — **Stock levels**
- **Description:** `status`: out, low or in. Also q, category_id, sort.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `status` = `low`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/inventory/summary` — **Summary**
- **Description:** Units on hand, stock value at cost, and how many are low or out.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/inventory/movements` — **Stock history**
- **Description:** Every change with what caused it: an opening count, a purchase, an adjustment, an import, a sale, a cancellation or a return.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/inventory/adjustments` — **Correct the stock**
- **Description:** `set` means this is the new figure; `add` is a correction and may be negative. Stock can never go below zero.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "variant_id": "{{variant_id}}",
  "mode": "set",
  "quantity": 25,
  "note": "Counted on the shelf"
}
```

#### `GET` `/api/v1/api/v1/admin/inventory/purchases` — **Deliveries received**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/inventory/purchases` — **Record a delivery**
- **Description:** Adds the stock and, with `update_cost_price`, moves the variant's cost - which is what the margin in the reports is worked out from.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "reference_no": "INV-8821",
  "supplier_name": "Firex Bangladesh",
  "received_on": "2026-09-20",
  "update_cost_price": true,
  "items": [
    {
      "variant_id": "{{variant_id}}",
      "quantity": 20,
      "unit_cost": 61000
    }
  ]
}
```

#### `GET` `/api/v1/api/v1/admin/inventory/purchases/{{purchase_id}}` — **One delivery**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 15 · Back office · orders (13 endpoints)

#### `GET` `/api/v1/api/v1/admin/orders` — **Orders**
- **Description:** Filters: status, payment_status, payment_method, source, customer_id, zone_id, from, to, and `q` (order number, mobile number or name).
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/orders?status=pending` — **Only the ones waiting**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `status` = `pending`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/orders/{{order_id}}` — **One order**
- **Description:** Its lines, history, payments, and `allowed_transitions` - where it may go next and which permission each step needs.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/status` — **Confirm it**
- **Description:** Pending → Confirmed → Processing → Packed → Shipped → Delivered. Cancelling is allowed up to Packed; Returned and Refunded follow delivery.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "confirmed",
  "note": "Confirmed by phone"
}
```

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/payment` — **Record the cash**
- **Description:** Recording payment on an order that is still waiting confirms it as well.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "note": "Cash on delivery collected"
}
```

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/status` — **Processing**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "processing"
}
```

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/status` — **Packed**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "packed"
}
```

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/status` — **Shipped**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "shipped"
}
```

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/status` — **Delivered**
- **Description:** Delivering is what earns the customer the right to review - folder 09.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "delivered"
}
```

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/status` — **An impossible step**
- **Description:** 409 INVALID_ORDER_TRANSITION. An order cannot go backwards.
- **Success Status Code:** `409`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "status": "pending"
}
```

#### `GET` `/api/v1/api/v1/admin/orders/{{order_id}}/invoice` — **Invoice (PDF)**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/orders/{{order_id}}/refunds` — **Refunds on this order**
- **Description:** And what is left that could be refunded.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/orders/{{order_id}}/refunds` — **Refund some of it**
- **Description:** Goes back through the gateway the money came in by, so a **cash order answers 409** - there is nothing to refund through SSLCommerz. Leave `amount` out to refund whatever is left.
- **Success Status Code:** `409`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "amount": 40000,
  "reason": "One item returned"
}
```

### 16 · Back office · customers (4 endpoints)

#### `GET` `/api/v1/api/v1/admin/customers?sort=spent` — **Customers**
- **Description:** Shoppers only - staff live under /staff. `q` searches name, email and mobile; `sort`: spent, orders, newest.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `sort` = `spent`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/customers/{{customer_id}}` — **One customer**
- **Description:** With their addresses and what they have spent.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/customers/{{customer_id}}` — **Rename or deactivate**
- **Description:** Deliberately short: the email address, mobile number and password are the customer's own. Deactivating revokes their tokens at once.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Rafi Ahmed",
  "is_active": true
}
```

#### `DELETE` `/api/v1/api/v1/admin/customers/{{customer_id}}` — **Delete a customer**
- **Description:** Their orders stay - those are the shop's records too - but stop naming an account. Run this last: it deletes the customer you have been signing in as.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 17 · Back office · discounts (10 endpoints)

#### `GET` `/api/v1/api/v1/admin/coupons` — **Coupons**
- **Description:** `status`: active, scheduled, expired, used_up.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/coupons` — **Create one**
- **Description:** `type`: percent (value in basis points, 2500 = 25%) or fixed (value in poisha). Per-customer limits count the account **and** the mobile number, so a guest cannot dodge them.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
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

#### `GET` `/api/v1/api/v1/admin/coupons/{{coupon_id}}` — **One coupon**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/coupons/{{coupon_id}}` — **Edit it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "is_active": false
}
```

#### `DELETE` `/api/v1/api/v1/admin/coupons/{{coupon_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/flash-sales` — **Flash sales**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/flash-sales` — **Create one**
- **Description:** Prices a variant while it runs. A sale price above the shelf price is ignored.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "title": "Weekend sale",
  "starts_at": "2026-09-21T00:00:00+06:00",
  "ends_at": "2026-09-23T23:59:59+06:00",
  "is_active": true,
  "items": [
    {
      "variant_id": "{{variant_id}}",
      "sale_price": 79000
    }
  ]
}
```

#### `GET` `/api/v1/api/v1/admin/flash-sales/{{flash_sale_id}}` — **One flash sale**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/flash-sales/{{flash_sale_id}}` — **Edit it**
- **Description:** Sending `items` replaces them all. The change shows on the shop at once.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "items": [
    {
      "variant_id": "{{variant_id}}",
      "sale_price": 75000
    }
  ]
}
```

#### `DELETE` `/api/v1/api/v1/admin/flash-sales/{{flash_sale_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 18 · Back office · delivery (5 endpoints)

#### `GET` `/api/v1/api/v1/admin/shipping-zones` — **Zones**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/shipping-zones` — **Create one**
- **Description:** `rate_basis`: flat, weight (ranges in grams, plus per_extra_kg) or order_value (ranges in poisha). Attach districts with `location_ids`; anywhere uncovered falls to the default zone.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
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

#### `GET` `/api/v1/api/v1/admin/shipping-zones/{{new_zone_id}}` — **One zone**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/shipping-zones/{{new_zone_id}}` — **Edit it**
- **Description:** Sending `rates` replaces them all.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
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

#### `DELETE` `/api/v1/api/v1/admin/shipping-zones/{{new_zone_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 19 · Back office · reviews (10 endpoints)

#### `GET` `/api/v1/api/v1/admin/reviews?status=pending` — **Moderation queue**
- **Description:** Default is pending. Also rating, product_id, is_hidden, is_featured, q. `meta.pending` is the badge count.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `status` = `pending`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reviews/{{review_id}}` — **One review**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/reviews/{{review_id}}/approve` — **Approve it**
- **Description:** Now it shows on the product page and counts towards the star rating.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/reviews/{{review_id}}/reject` — **Turn it down**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "reason": "Contains a phone number"
}
```

#### `PUT` `/api/v1/api/v1/admin/reviews/{{review_id}}` — **Edit what it says**
- **Description:** Marked as edited by the shop; the original wording stays in the activity log.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "comment": "Solid build, arrived the next day."
}
```

#### `POST` `/api/v1/api/v1/admin/reviews/{{review_id}}/hide` — **Take it down**
- **Description:** Reversible, and not the same as rejecting it.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/admin/reviews/{{review_id}}/hide` — **Put it back**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/reviews/{{review_id}}/feature` — **Feature it on the home page**
- **Description:** Only a review the shop is actually showing can be featured.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/admin/reviews/{{review_id}}/feature` — **Unfeature it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/admin/reviews/{{review_id}}` — **Delete it**
- **Description:** Needs reviews.delete, which is a separate permission from moderating.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 20 · Back office · home page & banners (11 endpoints)

#### `GET` `/api/v1/api/v1/admin/home-sections` — **Sections**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/home-sections/types` — **Kinds of section**
- **Description:** What the editor offers and what each kind needs, so the list is not hard-coded in the frontend.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/home-sections` — **Add a hand-picked row**
- **Description:** `custom` takes products, `categories` and `brands` take those; the automatic kinds (featured, best_sellers, flash_sale…) take none. `category` needs `settings.category_id` and takes `settings.mode`: latest, best_selling, popular, rating, discounted.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "type": "custom",
  "title": "Our recommendations",
  "item_ids": [
    "{{product_id}}"
  ],
  "position": 1,
  "settings": {
    "limit": 8
  }
}
```

#### `GET` `/api/v1/api/v1/admin/home-sections/{{new_section_id}}` — **One section**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/home-sections/{{new_section_id}}` — **Edit it**
- **Description:** Sending `item_ids` replaces what it holds. The type cannot change.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "title": "Picked for you",
  "is_active": true
}
```

#### `PUT` `/api/v1/api/v1/admin/home-sections/reorder` — **Reorder the page**
- **Description:** Send every section id in the order they should appear.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "ids": [
    "{{new_section_id}}",
    "{{section_id}}"
  ]
}
```

#### `DELETE` `/api/v1/api/v1/admin/home-sections/{{new_section_id}}` — **Remove a section**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/banners` — **Banners**
- **Description:** Including scheduled and expired ones. `type`: slider or offer.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/banners` — **Create one**
- **Description:** Upload the picture in folder 12 first. `starts_at`/`ends_at` schedule it, so a sale banner appears on its own.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "type": "slider",
  "title": "Eid sale",
  "subtitle": "Up to 40% off",
  "button_label": "Shop now",
  "link_url": "https://example.com/offers",
  "image_id": "{{media_id}}",
  "position": 0,
  "is_active": true,
  "starts_at": null,
  "ends_at": null
}
```

#### `PUT` `/api/v1/api/v1/admin/banners/{{banner_id}}` — **Edit it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "title": "Eid sale — final days"
}
```

#### `DELETE` `/api/v1/api/v1/admin/banners/{{banner_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 21 · Back office · pages, FAQs, messages (13 endpoints)

#### `GET` `/api/v1/api/v1/admin/pages` — **Pages**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/pages` — **Write one**
- **Description:** The slug comes from the title unless you send one. HTML is sanitised on the way in: a script tag would run in a customer's browser.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "title": "Terms & conditions",
  "content": "<p>Written in the back office.</p>",
  "is_active": true
}
```

#### `GET` `/api/v1/api/v1/admin/pages/{{page_id}}` — **One page**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/pages/{{page_id}}` — **Edit it**
- **Description:** Changing the slug breaks any link already pointing at it.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "content": "<p>Updated terms.</p>"
}
```

#### `DELETE` `/api/v1/api/v1/admin/pages/{{page_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/faqs` — **FAQs**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/faqs` — **Add one**
- **Description:** `group` puts it under a heading on the shop.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "question": "How long does delivery take?",
  "answer": "<p>1-2 days inside Dhaka, 3-5 days elsewhere.</p>",
  "group": "Delivery",
  "position": 0,
  "is_active": true
}
```

#### `PUT` `/api/v1/api/v1/admin/faqs/{{faq_id}}` — **Edit it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "position": 1
}
```

#### `DELETE` `/api/v1/api/v1/admin/faqs/{{faq_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/contact-messages` — **The inbox**
- **Description:** `unread=1` for the ones nobody has opened. `meta.unread` is the badge count.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/contact-messages/{{message_id}}` — **Read one**
- **Description:** Opening it marks it read.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/contact-messages/{{message_id}}/replied` — **Mark it answered**
- **Description:** Replying happens by email or phone, outside the API; this records that somebody dealt with it.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/admin/contact-messages/{{message_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 22 · Back office · newsletter (7 endpoints)

#### `GET` `/api/v1/api/v1/admin/newsletter/subscribers` — **Subscribers**
- **Description:** `subscribed=0` shows the ones who have left. The unsubscribe token is never returned.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/newsletter/campaigns` — **Campaigns**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/newsletter/campaigns` — **Write one**
- **Description:** Send `scheduled_at` to schedule it instead of leaving it a draft.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "subject": "Eid offers",
  "body": "Up to 40% off this week."
}
```

#### `GET` `/api/v1/api/v1/admin/newsletter/campaigns/{{campaign_id}}` — **One campaign**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/admin/newsletter/campaigns/{{campaign_id}}` — **Edit it**
- **Description:** Only until it goes out: a sent campaign is the record of what people were sent.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "subject": "Eid offers — this week only"
}
```

#### `POST` `/api/v1/api/v1/admin/newsletter/campaigns/{{campaign_id}}/send` — **Send it**
- **Description:** Queued in chunks of 200, skipping anyone who has unsubscribed. Watch `sent_count` climb. Needs a queue worker.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/admin/newsletter/campaigns/{{campaign_id}}` — **Delete it**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 23 · Back office · dashboard, reports, log (15 endpoints)

#### `GET` `/api/v1/api/v1/admin/dashboard` — **Dashboard**
- **Description:** Sales, visitors, the queues waiting for staff, the chart, top products and low stock. Revenue excludes VAT and excludes cancelled, returned and refunded orders. `from` and `to` set the period; the default is the last 30 days.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports` — **Which reports exist**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/sales?from=2026-09-01&to=2026-09-30` — **Sales by day**
- **Description:** Every report returns `columns`, `rows` and `totals`, so one table component renders all of them.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `from` = `2026-09-01`
  - `to` = `2026-09-30`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/product` — **Sales by product**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/inventory` — **Stock on hand**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/customer` — **Customers**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/order` — **Orders**
- **Description:** The one report that includes cancelled and refunded orders - it is what people reconcile against.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/coupon` — **Coupon use**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/tax` — **VAT collected**
- **Description:** Per rate, from the rates the orders recorded - not from today's category settings, which may have changed since.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/reports/revenue` — **Revenue by month**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/admin/reports/sales/exports` — **Ask for a file**
- **Description:** `format`: xlsx, csv or pdf. Queued - needs a queue worker.
- **Success Status Code:** `202`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "format": "xlsx",
  "from": "2026-09-01",
  "to": "2026-09-30"
}
```

#### `GET` `/api/v1/api/v1/admin/report-exports` — **Is it ready?**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/report-exports/{{export_id}}/download` — **Download it**
- **Description:** Money in the file is **taka, not poisha**, because a person opens it. Files are deleted after seven days.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/activity-log?log=admin` — **Activity log**
- **Description:** Streams: admin, account, security, system. Each admin entry carries the before and after of what changed. Filters: event, causer_id, subject_type, from, to, q.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Query Parameters:**
  - `log` = `admin`
- **Payload:** None

#### `GET` `/api/v1/api/v1/admin/activity-log/{{order_subject}}/{{order_id}}` — **Everything that happened to one order**
- **Description:** `order_subject` is the collection variable holding App\Models\Order, URL encoded.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

### 24 · Back office · roles & staff (11 endpoints)

#### `GET` `/api/v1/api/v1/permissions` — **Permission catalogue**
- **Description:** Every permission, grouped by back office page. This is what the role editor is built from - permissions are fixed in code, roles are not.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `GET` `/api/v1/api/v1/roles` — **Roles**
- **Description:** With holder counts.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/roles` — **Create a role**
- **Description:** The owner cuts roles at runtime. Nobody can grant a permission they do not hold themselves.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Packer",
  "permissions": [
    "orders.view",
    "orders.fulfil"
  ]
}
```

#### `GET` `/api/v1/api/v1/roles/{{role_id}}` — **One role**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/roles/{{role_id}}` — **Re-cut it**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
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

#### `GET` `/api/v1/api/v1/staff` — **Staff**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `POST` `/api/v1/api/v1/staff` — **Add a member of staff**
- **Description:** Staff hold exactly one role. Changing somebody's role additionally needs roles.assign - managing a colleague and deciding what they may do are separate responsibilities.
- **Success Status Code:** `201`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "name": "Shop Assistant",
  "email": "assistant@example.com",
  "password": "Demo-Password-1!",
  "role": "Packer",
  "is_active": true
}
```

#### `GET` `/api/v1/api/v1/staff/{{staff_id}}` — **One member of staff**
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `PUT` `/api/v1/api/v1/staff/{{staff_id}}` — **Update them**
- **Description:** Deactivating takes effect on their very next request, not when their token expires.
- **Success Status Code:** `200`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload (JSON):**
```json
{
  "is_active": false
}
```

#### `DELETE` `/api/v1/api/v1/staff/{{staff_id}}` — **Remove them**
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

#### `DELETE` `/api/v1/api/v1/roles/{{role_id}}` — **Delete the role**
- **Description:** Refused while anybody still holds it.
- **Success Status Code:** `204`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Payload:** None

