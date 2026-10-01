# ecommerce-api

API backend for a single online store, built on Laravel 13 and MySQL 8.

The frontend is a separate TypeScript application. This repository serves JSON
only: there are no Blade pages and no asset pipeline.

---

## Requirements

| | |
|---|---|
| PHP | 8.3+ (developed on 8.4) with `pdo_mysql`, `mbstring`, `intl`, `bcmath` |
| Composer | 2.x |
| MySQL | 8.0+ |

---

## Getting started

```sh
# 1. Create the database and a user for it
mysql -u root -p <<'SQL'
CREATE DATABASE ecommerce_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ecommerce_api'@'127.0.0.1' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON ecommerce_api.* TO 'ecommerce_api'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

# 2. Install and configure
composer install
cp .env.example .env
php artisan key:generate
# then set DB_PASSWORD (and ADMIN_PASSWORD) in .env

# 3. Create the schema, the roles, and the first administrator
php artisan migrate
php artisan db:seed

# 4. Serve
php artisan serve          # http://localhost:8000
```

`composer setup` runs steps 2 to 3 in one go once the database exists.

The seeder creates a super administrator from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
It does nothing if `ADMIN_PASSWORD` is empty, so a production database can never
quietly acquire an account with a known password.

### Trying it by hand

```sh
php artisan db:seed --class=DemoStoreSeeder
```

Fills a small shop to click through: nine products (single-form, sold in sizes,
one out of stock, one on offer, one Bangla, one draft, one in a zero-rated
category), two delivery zones, two coupons, a home page, three pages, and a
**customer who is already verified** - `customer@example.com` /
`Demo-Password-1!` - so the API can be used without digging a one-time code out
of the log. It leaves an existing catalogue alone, so running it twice is safe.

`postman/ecommerce-api.postman_collection.json` imports into Postman with **every
endpoint** the API has - 211 requests, the customer's side in folders 00-11 and
the back office in 12-24, each in the order you would use them. It is generated
by `postman/build-collection.py`, which reads the route list and refuses to
write the file if any route is uncovered - so after adding a route, add a
request and re-run it. Each request saves what the next one
needs - tokens, the variant id, the order number - so the folders run top to
bottom without anything being copied by hand. Import
`postman/local.postman_environment.json` alongside it and put your
`ADMIN_PASSWORD` in it.

Two things need a queue worker (`php artisan queue:work`): report files, and the
emails and SMS an order sends. Everything else works without one. With
`SMS_DRIVER=log` and `MAIL_MAILER=log`, codes and messages are written to
`storage/logs/laravel.log` instead of being sent.

---

## API documentation

An OpenAPI 3.1 document is generated from the code itself - no annotations to
keep in sync.

```sh
php artisan scramble:export   # writes api.json
composer docs                 # the same thing
```

Browse it at **http://localhost:8000/docs/api**. Outside local the page is shut
unless `SCRAMBLE_DOCS_TOKEN` is set, in which case it opens to a request
carrying that value in an `X-Docs-Token` header.

`api.json` is the input for generating TypeScript client types, so the frontend
never hand-writes a request or response shape.

---

## Conventions the frontend can rely on

### Authentication

Bearer tokens, issued by Laravel Sanctum. Shoppers sign in with an email
address **or** a Bangladeshi mobile number - always sent as `login` - and a
password, or with Google.

```http
POST /api/v1/auth/login
{ "login": "01712345678", "password": "…", "device_name": "web" }

→ 200
{
  "data": {
    "token": { "token": "ecom_…", "token_type": "Bearer",
               "expires_at": "2026-10-15T09:00:00+00:00", "abilities": ["*"] },
    "user":  { "id": 1, "email": "…", "roles": […], "permissions": […] }
  }
}
```

Send it on every subsequent call as `Authorization: Bearer <token>`. The value
is shown once and never again; only its hash is stored. Tokens expire after
`SANCTUM_TOKEN_EXPIRATION` minutes (7 days by default) and `expires_at` says
exactly when, so the client can sign in again before a request fails.

**Mobile numbers** are accepted in any common spelling - `01712345678`,
`8801712345678`, `+880 1712-345678`, Bangla digits - and always returned as
`+8801712345678`.

**Signing up is two steps.** Registering answers `202` and sends a six digit
code to the email or phone; `POST /auth/otp/verify` with that code returns the
first token. Signing in to an account that was never verified answers
`403 ACCOUNT_NOT_VERIFIED` (only after the password is right) and sends a new
code - move to the code entry screen.

```http
POST /api/v1/auth/register
{ "name": "Ada", "login": "ada@example.com", "password": "…", "password_confirmation": "…" }

→ 202
{ "message": "…", "data": { "verification": {
    "channel": "email", "destination": "ad*@example.com", "expires_in_minutes": 5 } } }
```

Codes expire after 5 minutes, die after 5 wrong guesses
(`OTP_ATTEMPTS_EXCEEDED`), and only the most recent one works. Requesting
another within a minute answers `429 OTP_COOLDOWN` with `Retry-After`.

**Google:** run Google Identity Services in the frontend with the client id in
`GOOGLE_CLIENT_ID` and post the ID token to `POST /auth/google`. A Google
sign-up has no password (`user.has_password: false`) until it sets one with
`PUT /auth/password`, which then needs no `current_password`.

### Errors

Every failure has the same shape:

```json
{
  "message": "Human readable. May change, may be translated.",
  "code": "VALIDATION_FAILED",
  "request_id": "0f1c…",
  "errors": { "email": ["The email field is required."] }
}
```

- **`code`** is stable and machine readable. Branch on it, never on `message`.
  The full set lives in `app/Enums/ErrorCode.php`.
- **`errors`** appears on validation failures only, keyed by field name.
- **`request_id`** also comes back in the `X-Request-Id` header and appears on
  every server log line for that request. Quote it in a bug report.

`429` responses carry a `Retry-After` header.

### Endpoints

In the **Auth** column, `–` means open to anyone, `token` needs a bearer token,
and `optional` works either way: signed in, or as a visitor identified by
something else (a cart token, a mobile number).

#### Signing in and your own account

Used by customers and staff alike. Shoppers register themselves; staff accounts
are created in the back office (`/api/v1/staff`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | – | Create a shopper account; sends a code (`202`) |
| `POST` | `/api/v1/auth/otp/verify` | – | Confirm the account with its code; returns a token |
| `POST` | `/api/v1/auth/otp/resend` | – | Send a new code (`purpose`: `verify` or `password_reset`) |
| `POST` | `/api/v1/auth/login` | – | Exchange email or mobile number and password for a token |
| `POST` | `/api/v1/auth/google` | – | Sign in or up with a Google ID token |
| `POST` | `/api/v1/auth/forgot-password` | – | Send a password reset code |
| `POST` | `/api/v1/auth/reset-password` | – | Set a new password with the code |
| `POST` | `/api/v1/auth/logout` | token | Revoke the token in use |
| `POST` | `/api/v1/auth/logout-all` | token | Revoke every token |
| `PUT` | `/api/v1/auth/password` | token | Change own password, or set a first one after Google sign-up |
| `GET` | `/api/v1/auth/tokens` | token | List signed-in devices |
| `DELETE` | `/api/v1/auth/tokens/{id}` | token | Revoke one device |
| `GET` | `/api/v1/me` | token | Profile, roles and permissions |
| `PUT` | `/api/v1/me` | token | Update own name |
| `POST` | `/api/v1/me/contact` | token | Send a code to a new email or mobile number |
| `POST` | `/api/v1/me/contact/verify` | token | Switch to it with the code |

#### Customer endpoints (the storefront)

**The catalogue and store content**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | – | Liveness check, `{"status":"healthy"}` |
| `GET` | `/api/v1/settings` | – | Store name, contact details, logo, payment methods on offer (publicly cacheable) |
| `GET` | `/api/v1/home` | – | The whole front page: every section, in order |
| `GET` | `/api/v1/categories` | – | Category tree for menus, with product counts |
| `GET` | `/api/v1/categories/{slug}` | – | Category page: breadcrumbs, subcategories, SEO, VAT rate |
| `GET` | `/api/v1/brands` | – | Active brands with logos and product counts |
| `GET` | `/api/v1/brands/{slug}` | – | Brand page |
| `GET` | `/api/v1/products` | – | Product cards, filtered, sorted, paged (see below) |
| `GET` | `/api/v1/products/facets` | – | Filter counts for the same filters |
| `GET` | `/api/v1/products/suggest?q=` | – | Live search: products, categories, brands |
| `GET` | `/api/v1/products/{slug}` | – | Product page, every variant priced |
| `GET` | `/api/v1/products/{slug}/related` | – | `type=related` (default), `cross_sell` or `upsell` |
| `GET` | `/api/v1/products/{slug}/reviews` | – | Approved reviews, with the star breakdown |
| `GET` | `/api/v1/locations` | – | Divisions, or the districts of one (`parent_id`) |
| `GET` | `/api/v1/shipping/zones` | – | Delivery zones, charges and estimated days |
| `GET` | `/api/v1/pages` | – | Published pages, for the footer |
| `GET` | `/api/v1/pages/{slug}` | – | One page, with its HTML |
| `GET` | `/api/v1/faqs` | – | Published questions and answers |
| `GET` | `/api/v1/sitemap?type=` | – | Slugs for sitemap.xml (`products`, `categories`, `brands`, `pages`) |
| `POST` | `/api/v1/contact` | optional | Send a message to the shop |
| `POST` | `/api/v1/newsletter/subscribe` | – | Join the mailing list |
| `POST` | `/api/v1/newsletter/unsubscribe` | – | Leave it, by the token in the email |
| `POST` | `/api/v1/track/view` | – | Note a page or product view (counted after the response) |

**Cart, checkout and payment**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/cart` | optional | The cart (`X-Cart-Token` for visitors) |
| `POST` | `/api/v1/cart/items` | optional | Add an item; a visitor's first call returns a `token` |
| `PATCH` | `/api/v1/cart/items/{id}` | optional | Change a line's quantity |
| `DELETE` | `/api/v1/cart/items/{id}` | optional | Remove a line |
| `POST` | `/api/v1/cart/items/{id}/save-for-later` | optional | Set a line aside |
| `POST` | `/api/v1/cart/items/{id}/move-to-cart` | optional | Put it back |
| `PUT` | `/api/v1/cart/coupon` | optional | Apply a coupon code |
| `DELETE` | `/api/v1/cart/coupon` | optional | Remove the coupon |
| `POST` | `/api/v1/cart/claim` | token | Fold a visitor's cart into the account |
| `POST` | `/api/v1/checkout/quote` | token | What the cart comes to, with the ways of paying on offer |
| `POST` | `/api/v1/checkout` | token | Place the cart as an order (`Idempotency-Key`) |
| `POST` | `/api/v1/buy-now/quote` | optional | What one item comes to |
| `POST` | `/api/v1/buy-now` | optional | Order one item; a visitor must give a mobile number |
| `GET` | `/api/v1/orders/track?number=&phone=` | – | Track an order without signing in |
| `POST` | `/api/v1/orders/{number}/pay` | optional | Start or retry an online payment; returns `gateway_url` |

The frontend never calls these four; SSLCommerz does:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/payments/sslcommerz/success` | – | Gateway redirect; confirms, then `303` into the frontend |
| `POST` | `/api/v1/payments/sslcommerz/fail` | – | Gateway redirect for a refused payment |
| `POST` | `/api/v1/payments/sslcommerz/cancel` | – | Gateway redirect when the shopper backs out |
| `POST` | `/api/v1/payments/sslcommerz/ipn` | – | The gateway's own server-to-server callback |

**The customer's account**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/me/addresses` | token | The address book |
| `POST` | `/api/v1/me/addresses` | token | Save an address |
| `PUT` | `/api/v1/me/addresses/{id}` | token | Edit an address |
| `DELETE` | `/api/v1/me/addresses/{id}` | token | Delete an address |
| `GET` | `/api/v1/me/wishlist` | token | Saved products |
| `POST` | `/api/v1/me/wishlist` | token | Save a product |
| `DELETE` | `/api/v1/me/wishlist/{product}` | token | Unsave a product |
| `GET` | `/api/v1/me/recently-viewed` | token | Recently viewed products |
| `POST` | `/api/v1/me/recently-viewed` | token | Note that a product was viewed |
| `GET` | `/api/v1/me/orders` | token | The customer's orders, newest first |
| `GET` | `/api/v1/me/orders/{number}` | token | One order with its timeline |
| `POST` | `/api/v1/me/orders/{number}/cancel` | token | Cancel while pending or confirmed |
| `GET` | `/api/v1/me/orders/{number}/invoice` | token | The invoice, as a PDF |
| `GET` | `/api/v1/me/reviewable-items` | token | Delivered items not reviewed yet |
| `GET` | `/api/v1/me/reviews` | token | The customer's own reviews, approved or not |
| `POST` | `/api/v1/me/reviews` | token | Write one (stars alone are enough) |
| `POST` | `/api/v1/me/reviews/photos` | token | Upload a photo to attach to a review |
| `PUT` | `/api/v1/me/reviews/{id}` | token | Change it while it is still waiting |
| `DELETE` | `/api/v1/me/reviews/{id}` | token | Take it back |

#### Admin endpoints (the back office)

Every one needs a bearer token from a staff account holding the permission
shown. They live under `/api/v1/admin/`, except roles and staff, which predate
that prefix and keep their paths.

**Roles and staff**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/permissions` | `roles.view` | Permission catalogue, by page |
| `GET` | `/api/v1/roles` | `roles.view` | Roles, with holder counts |
| `GET` | `/api/v1/roles/{id}` | `roles.view` | One role |
| `POST` | `/api/v1/roles` | `roles.create` | Create a role |
| `PUT` | `/api/v1/roles/{id}` | `roles.update` | Rename or re-cut a role |
| `DELETE` | `/api/v1/roles/{id}` | `roles.delete` | Delete an unheld role |
| `GET` | `/api/v1/staff` | `staff.view` | Back office accounts |
| `GET` | `/api/v1/staff/{id}` | `staff.view` | One staff account |
| `POST` | `/api/v1/staff` | `staff.create` | Create a staff account |
| `PUT` | `/api/v1/staff/{id}` | `staff.update` | Update, re-role, reset password |
| `DELETE` | `/api/v1/staff/{id}` | `staff.delete` | Delete a staff account |

**Dashboard, reports and the activity log**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | `dashboard.view` | Sales, visitors, queues and the chart |
| `GET` | `/api/v1/admin/reports` | `reports.view` | The reports that can be asked for |
| `GET` | `/api/v1/admin/reports/{type}` | `reports.view` | One report: `columns`, `rows`, `totals` |
| `POST` | `/api/v1/admin/reports/{type}/exports` | `reports.export` | Ask for it as a file (queued) |
| `GET` | `/api/v1/admin/report-exports` | `reports.export` | Files asked for, and whether they are ready |
| `GET` | `/api/v1/admin/report-exports/{id}/download` | `reports.export` | Download one |
| `GET` | `/api/v1/admin/activity-log` | `activity-log.view` | Who did what, with before and after |
| `GET` | `/api/v1/admin/activity-log/{type}/{id}` | `activity-log.view` | Everything that happened to one record |

**Store settings and media**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/settings` | `settings.view` | Every store setting |
| `PUT` | `/api/v1/admin/settings` | `settings.update` | Change settings; send only the keys being changed |
| `POST` | `/api/v1/admin/settings/assets/{logo\|favicon\|invoice-logo}` | `settings.update` | Replace a store file (multipart `file`) |
| `POST` | `/api/v1/admin/media` | `media.upload` | Upload an image (multipart `file`, optional `alt`) |
| `DELETE` | `/api/v1/admin/media/{id}` | `media.delete` | Delete an image |

**Catalogue**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/brands` | `brands.view` | Brands, with product counts (`q` to search) |
| `GET` | `/api/v1/admin/brands/{id}` | `brands.view` | One brand |
| `POST` | `/api/v1/admin/brands` | `brands.create` | Create a brand (logo/banner by media id) |
| `PUT` | `/api/v1/admin/brands/{id}` | `brands.update` | Edit a brand |
| `DELETE` | `/api/v1/admin/brands/{id}` | `brands.delete` | Delete a brand no product carries |
| `GET` | `/api/v1/admin/categories` | `categories.view` | The whole tree, flattened with `depth` |
| `GET` | `/api/v1/admin/categories/{id}` | `categories.view` | One category |
| `POST` | `/api/v1/admin/categories` | `categories.create` | Create a category (`parent_id` to nest) |
| `PUT` | `/api/v1/admin/categories/{id}` | `categories.update` | Edit details, VAT rate, SEO, images |
| `PUT` | `/api/v1/admin/categories/{id}/move` | `categories.update` | Move under `parent_id` at `position` |
| `DELETE` | `/api/v1/admin/categories/{id}` | `categories.delete` | Delete an empty category |
| `GET` | `/api/v1/admin/option-types` | `products.view` | Size, Weight, Volume... |
| `POST` | `/api/v1/admin/option-types` | `products.update` | Add one |
| `PUT` | `/api/v1/admin/option-types/{id}` | `products.update` | Rename one |
| `DELETE` | `/api/v1/admin/option-types/{id}` | `products.update` | Delete one no product uses |
| `GET` | `/api/v1/admin/products` | `products.view` | Products, drafts included, with filters |
| `GET` | `/api/v1/admin/products/{id}` | `products.view` | One product, everything the edit form needs |
| `POST` | `/api/v1/admin/products` | `products.create` | Create a product with its variants |
| `PUT` | `/api/v1/admin/products/{id}` | `products.update` | Edit; `variants` replaces the whole set |
| `PATCH` | `/api/v1/admin/products/{id}/status` | `products.update` | `active`, `hidden` or `draft` |
| `POST` | `/api/v1/admin/products/{id}/duplicate` | `products.create` | Copy into a new draft |
| `PUT` | `/api/v1/admin/products/{id}/links` | `products.update` | Related, cross-sell and upsell products |
| `DELETE` | `/api/v1/admin/products/{id}` | `products.delete` | Delete a product |
| `POST` | `/api/v1/admin/products/bulk` | `products.update` | One change to up to 500 products |
| `POST` | `/api/v1/admin/products/images/bulk` | `products.update` + `media.upload` | Up to 20 images, matched to SKUs by file name |
| `GET` | `/api/v1/admin/products/export` | `products.export` | Download products as CSV/Excel |
| `POST` | `/api/v1/admin/product-imports` | `products.import` | Upload a spreadsheet; runs in the background (`202`) |
| `GET` | `/api/v1/admin/product-imports/template` | `products.import` | Blank spreadsheet with example rows |
| `GET` | `/api/v1/admin/product-imports/{id}` | `products.import` | How an import went, with refused rows |

**Inventory**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/inventory` | `inventory.view` | Stock per variant (`status`: out, low, in) |
| `GET` | `/api/v1/admin/inventory/summary` | `inventory.view` | Units on hand, stock value, low/out counts |
| `GET` | `/api/v1/admin/inventory/movements` | `inventory.view` | Stock history |
| `POST` | `/api/v1/admin/inventory/adjustments` | `inventory.adjust` | Correct stock (`set` or `add`), with a reason |
| `GET` | `/api/v1/admin/inventory/purchases` | `inventory.view` | Deliveries received |
| `GET` | `/api/v1/admin/inventory/purchases/{id}` | `inventory.view` | One delivery with its lines |
| `POST` | `/api/v1/admin/inventory/purchases` | `inventory.receive` | Record a delivery; adds the stock |

**Orders and customers**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/orders` | `orders.view` | Orders, filtered by status, payment, date or `q` |
| `GET` | `/api/v1/admin/orders/{id}` | `orders.view` | One order, its lines, history and allowed next steps |
| `POST` | `/api/v1/admin/orders/{id}/status` | depends | Move the order on (see below) |
| `POST` | `/api/v1/admin/orders/{id}/payment` | `orders.update` | Record a cash or bank payment; confirms the order |
| `GET` | `/api/v1/admin/orders/{id}/invoice` | `orders.view` | The invoice, as a PDF |
| `GET` | `/api/v1/admin/orders/{id}/refunds` | `orders.view` | Refunds made, and what is left to refund |
| `POST` | `/api/v1/admin/orders/{id}/refunds` | `orders.refund` | Send money back (partial by default) |
| `GET` | `/api/v1/admin/customers` | `customers.view` | Customers, with what each has spent |
| `GET` | `/api/v1/admin/customers/{id}` | `customers.view` | One customer, with their addresses |
| `PUT` | `/api/v1/admin/customers/{id}` | `customers.update` | Rename or deactivate |
| `DELETE` | `/api/v1/admin/customers/{id}` | `customers.delete` | Delete a customer |

**Shipping and discounts**
 
| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/shipping-zones` | `shipping.view` | Delivery zones with their charges |
| `GET` | `/api/v1/admin/shipping-zones/{id}` | `shipping.view` | One zone |
| `POST` | `/api/v1/admin/shipping-zones` | `shipping.update` | Create a zone |
| `PUT` | `/api/v1/admin/shipping-zones/{id}` | `shipping.update` | Edit a zone (sending `rates` replaces them) |
| `DELETE` | `/api/v1/admin/shipping-zones/{id}` | `shipping.update` | Delete a zone |
| `GET` | `/api/v1/admin/coupons` | `discounts.view` | Coupons (`status`: active, scheduled, expired, used_up) |
| `GET` | `/api/v1/admin/coupons/{id}` | `discounts.view` | One coupon |
| `POST` | `/api/v1/admin/coupons` | `discounts.create` | Create a coupon |
| `PUT` | `/api/v1/admin/coupons/{id}` | `discounts.update` | Edit a coupon |
| `DELETE` | `/api/v1/admin/coupons/{id}` | `discounts.delete` | Delete a coupon |
| `GET` | `/api/v1/admin/flash-sales` | `discounts.view` | Flash sales (`running=1` for live ones) |
| `GET` | `/api/v1/admin/flash-sales/{id}` | `discounts.view` | One sale with its prices |
| `POST` | `/api/v1/admin/flash-sales` | `discounts.create` | Create a sale with its prices |
| `PUT` | `/api/v1/admin/flash-sales/{id}` | `discounts.update` | Edit a sale (sending `items` replaces them) |
| `DELETE` | `/api/v1/admin/flash-sales/{id}` | `discounts.delete` | Delete a sale |

**Reviews**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/reviews` | `reviews.view` | The moderation queue (`status`, default pending) |
| `GET` | `/api/v1/admin/reviews/{id}` | `reviews.view` | One review |
| `POST` | `/api/v1/admin/reviews/{id}/approve` | `reviews.moderate` | Publish a review |
| `POST` | `/api/v1/admin/reviews/{id}/reject` | `reviews.moderate` | Turn one down, with a reason |
| `POST`/`DELETE` | `/api/v1/admin/reviews/{id}/hide` | `reviews.moderate` | Take a published review down, or put it back |
| `POST`/`DELETE` | `/api/v1/admin/reviews/{id}/feature` | `reviews.moderate` | Put it on the home page, or take it off |
| `PUT` | `/api/v1/admin/reviews/{id}` | `reviews.moderate` | Edit what it says |
| `DELETE` | `/api/v1/admin/reviews/{id}` | `reviews.delete` | Delete it |

**Home page and banners**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/home-sections` | `storefront.view` | The home page, section by section |
| `GET` | `/api/v1/admin/home-sections/types` | `storefront.view` | The kinds of section that can be added |
| `GET` | `/api/v1/admin/home-sections/{id}` | `storefront.view` | One section |
| `POST` | `/api/v1/admin/home-sections` | `storefront.update` | Add a section |
| `PUT` | `/api/v1/admin/home-sections/reorder` | `storefront.update` | Put the sections in a new order |
| `PUT` | `/api/v1/admin/home-sections/{id}` | `storefront.update` | Edit one (sending `item_ids` replaces its contents) |
| `DELETE` | `/api/v1/admin/home-sections/{id}` | `storefront.update` | Remove a section |
| `GET` | `/api/v1/admin/banners` | `storefront.view` | Banners, including scheduled and expired |
| `POST`/`PUT`/`DELETE` | `/api/v1/admin/banners[/{id}]` | `storefront.update` | Manage banners |

**Pages, FAQs and the inbox**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/pages` | `content.view` | Standing pages |
| `GET` | `/api/v1/admin/pages/{id}` | `content.view` | One page |
| `POST`/`PUT`/`DELETE` | `/api/v1/admin/pages[/{id}]` | `content.create`/`update`/`delete` | Manage pages |
| `GET` | `/api/v1/admin/faqs` | `content.view` | Questions and answers |
| `POST`/`PUT`/`DELETE` | `/api/v1/admin/faqs[/{id}]` | `content.create`/`update`/`delete` | Manage them |
| `GET` | `/api/v1/admin/contact-messages` | `content.view` | The contact form's inbox (`unread=1`) |
| `GET` | `/api/v1/admin/contact-messages/{id}` | `content.view` | One message |
| `POST` | `/api/v1/admin/contact-messages/{id}/replied` | `content.update` | Mark one answered |
| `DELETE` | `/api/v1/admin/contact-messages/{id}` | `content.delete` | Delete one |

**Newsletter**

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/newsletter/subscribers` | `marketing.view` | The mailing list |
| `GET` | `/api/v1/admin/newsletter/campaigns[/{id}]` | `marketing.view` | Mailings, or one |
| `POST`/`PUT`/`DELETE` | `/api/v1/admin/newsletter/campaigns[/{id}]` | `marketing.update` | Write, edit or delete a mailing |
| `POST` | `/api/v1/admin/newsletter/campaigns/{id}/send` | `marketing.update` | Send it (queued, in chunks) |

**The cart works the same for visitors and customers.** A visitor's first
`POST /cart/items` answers `201` with a `token`; send it back as
`X-Cart-Token`. After signing in, `POST /cart/claim` with that header folds the
visitor's cart into the customer's own - quantities are added up and trimmed to
what may be bought, and doing it twice changes nothing. Pass `location_id` (a
district) on any cart call to see the delivery charge in the totals.

**Totals are worked out in one place** for the cart, Buy Now and checkout: each
line is priced, a coupon's discount is split across the lines in proportion to
their value (the odd poisha going to the largest remainders, so the parts add up
exactly), VAT is charged per line on what is left at that product's category
rate, then delivery is added - with VAT on delivery only if the store charges
it. A coupon that stops applying is set aside in the cart with a note, and
refused outright at checkout.

**Orders keep their own copy of everything.** Product names, prices, VAT rates
and the delivery address are written onto the order as they were at the moment
it was placed, so putting prices up, editing a product or moving house never
rewrites a past order. Orders are addressed by their number (`260920-K4M2P`),
never by a row id.

**Every order starts Pending**, however it is paid for. Cash on delivery and
bank transfer wait for staff to confirm them - that is the shop's rule. An
online payment confirms the order by itself, but only once the gateway has been
asked and agrees it was paid. Stock is held from the moment the order is
placed, and put back exactly once when it is cancelled or returned. An online
order nobody pays for is cancelled when its payment window passes
(`order_payment_timeout_minutes`, default 30).

Where an order may go next, and what each step needs:

| From | May become | Permission |
|---|---|---|
| Pending | Confirmed, Cancelled | `orders.update`, `orders.cancel` |
| Confirmed | Processing, Cancelled | `orders.update`, `orders.cancel` |
| Processing | Packed, Cancelled | `orders.fulfil`, `orders.cancel` |
| Packed | Shipped, Cancelled | `orders.fulfil`, `orders.cancel` |
| Shipped | Delivered, Returned | `orders.fulfil`, `orders.refund` |
| Delivered | Returned | `orders.refund` |
| Cancelled, Returned | Refunded | `orders.refund` |

Anything else is refused with `409 INVALID_ORDER_TRANSITION`. Each order's
detail carries `allowed_transitions`, each with the permission it needs, so the
status screen can offer only what this member of staff may actually do. A
customer may cancel their own order only while it is Pending or Confirmed
(`409 ORDER_NOT_CANCELLABLE` after that).

**Buy Now takes an order without an account.** One item, a name, a **mobile
number** (required) and where it goes. The number is what the shop rings to
confirm, what tracks the order at `GET /orders/track`, and what later joins the
order to an account - but only once that account has proved the number is
theirs by verifying it with a code. Tracking answers the same `404` for a wrong
number as for an order that does not exist, so it cannot be used to find out
who shops here.

**Send an `Idempotency-Key` header when placing an order.** If the connection
drops and the app retries, the same key returns the order already placed rather
than placing a second one; the same key with a different order is refused with
`409 IDEMPOTENCY_CONFLICT`.

**Paying online goes through SSLCommerz.** An order placed with
`payment_method: sslcommerz` comes back with a `payment` block carrying
`gateway_url` - send the shopper there. If the gateway could not be reached,
`payment` is `null` and the order still stands: call
`POST /orders/{number}/pay` to try again (a guest gives the mobile number the
order was placed with). Each attempt is recorded separately, so a card refused
at eight and paid at ten are two rows against one order.

**Nothing the browser brings back is believed.** The gateway posts the shopper
to `/payments/sslcommerz/success`, and this API takes only the transaction and
validation ids from that request before asking the gateway's validation API
what really happened. An order is confirmed only if the gateway says VALID or
VALIDATED, about the transaction we started, for an amount equal to the order
total to the poisha, in the order's own currency. Then the shopper is
redirected (`303`) to `APP_FRONTEND_URL/checkout/payment?status=…&order=…` -
`paid`, `failed`, `cancelled`, `late` or `unknown`.

The **IPN** endpoint is the one that matters for reliability: a shopper who
closes the tab after paying never reaches the success URL, and without the
gateway's own callback their order would sit unpaid until it expired. Both
paths confirm through the same locked, idempotent code, so an IPN and a
redirect racing each other confirm the order exactly once. Register the IPN URL
in the SSLCommerz merchant panel as well - it is sent with each session, but
the panel setting is what covers sessions that never got that far.

**A payment that lands after an order was given up on is not taken quietly.**
The attempt is recorded as `validated_after_cancel` and flagged on the order
for staff (`payments[].needs_attention`), but the order stays cancelled: its
stock went back on the shelf when it expired and may since have been sold.
Somebody has to decide whether to refund the money or reinstate the order by
hand.

**Refunds** go back through the gateway the money came in by. They may be
partial and repeated, never adding up to more than was paid
(`409 REFUND_NOT_POSSIBLE`), and the order's `payment_status` becomes
`partially_refunded` or `refunded` accordingly. SSLCommerz processes refunds in
its own time and never calls back, so a refund stays `processing` until
`payments:poll-refunds` (hourly) asks how it went.

**The home page is one call.** `GET /home` returns every section the owner set
up, in their order, with the products in each already priced. Sections that
have nothing to show are left out rather than sent as empty rows, so the
frontend can render what it gets without checking. The page is cached whole and
rebuilt when a section, banner or product changes - and expires by itself at
the next moment a schedule starts or ends, so a banner set for midnight appears
at midnight. Prices and stock are never cached: they are read fresh on every
request and laid over the cached shape, in one query for the whole page.

Section types: `slider`, `categories`, `brands`, `featured`, `trending`,
`new_arrivals`, `popular`, `best_sellers`, `flash_sale`, `offer_banners`,
`featured_reviews`, `newsletter`, `custom` (hand-picked products) and
`category` (one category, with `settings.mode`: latest, best_selling, popular,
rating or discounted). `GET /admin/home-sections/types` lists them with what
each needs, so the editor does not hard-code the list.

**Reviews are held until somebody reads them.** Only a customer with a
*delivered* order containing the product may review it, one review per product
per order, and a review may be stars alone - insisting on words costs the shop
reviews. A new review is `pending` and invisible; approving it publishes it and
counts it towards the product's rating. Hiding an approved review takes it down
reversibly, which is not the same as rejecting it, and both leave the rating
correct. The shop can also edit a review - the owner asked for this, mostly to
take a phone number out of one - which marks it as edited and keeps the
original wording in the activity log.

**The contact form and the newsletter box** are the only things anyone at all
can write to, so both carry a honeypot field (`website`, which must be empty)
and a tight rate limit. Subscribing answers the same way whether the address
was already on the list or not. Every newsletter carries that reader's own
unsubscribe link, which works without signing in.

**Visitors are counted, not recorded.** `POST /track/view` reduces the caller
to an HMAC of their address, their user agent **and the date**, which is stored
instead of any of those. The date inside the hash is the point: the same person
tomorrow hashes to something unrelated, so nobody can be followed from one day
to the next, and no hash can be turned back into an address. Counting happens
after the response is sent, so no shopper waits for the shop's bookkeeping.

**Revenue means what the shop keeps.** Every figure on the dashboard and in the
reports excludes orders that were cancelled, returned or refunded, and excludes
VAT, which was never the shop's money. The one exception is the order report,
which lists everything - that is the report people reconcile against.

Reports are built from the figures each order recorded at the time - its
prices, VAT rates and costs - never from today's catalogue, so a price rise
cannot change what last month earned. Each comes back as `columns`, `rows` and
`totals`, so one table component in the frontend renders any of them. Asking
for one as a file (`xlsx`, `csv` or `pdf`) queues the work and returns an id to
poll; **money in a file is written in taka, not poisha**, because a person
opens it. Files are deleted after seven days by `reports:prune-exports`.

**The activity log** has four streams (`admin`, `account`, `security`,
`system`), keeps a year, and records the before and after of every change staff
make - not that somebody changed a price, but what it was and what it became.
It never contains passwords, tokens or one-time codes.

**Stock only ever changes through the stock service**, which locks the row,
refuses to go below zero (`409 INSUFFICIENT_STOCK`, with what is left per
variant) and writes a history entry saying what changed it: an opening count,
a purchase, an adjustment, an import, a sale, a cancellation or a return. The
product form, bulk updates and imports all go through it, so the history always
explains the number on the shelf.

**Spreadsheets hold taka, not poisha** (`3500`, `3500.50`), because people edit
them by hand; everything else in the API is poisha. One row per variant, rows
sharing a `slug` (or `name`) are one product, and a row is matched to an
existing product by SKU. An export can be edited and imported straight back.
Unknown brands are created; categories must already exist. Imports run in the
background and report refused rows by line number, so the rest of the file still
goes in. Exporting the whole catalogue (~22,000 rows) takes about five seconds.

**Deleting never erases.** Every `DELETE` marks the record deleted; from then on
it answers `404` and is left out of every list, exactly as if it were gone, but
the data is kept. A deleted account's email address and phone number, and a
deleted role's name, can be used again straight away. (Signing out and revoking
a device do remove the token for real.)

**Money is always an integer number of poisha** (৳12.50 is `1250`) and rates are
integer basis points (15% is `1500`), in requests and responses alike. Format
for display in the frontend.

**The storefront catalogue** (`/categories`, `/brands`, `/products`) shows only
active products in active categories and brands. Product list filters, all
combinable: `category` (slug, includes subcategories), `brand` (slug, repeat for
several), `price_min`/`price_max` (poisha), `option[{option type id}][]=5kg`
(values as `/products/facets` returns them), `rating_min`, `in_stock=1`, `flag`
(`featured`, `trending`, `new_arrival`, `best_seller`, `on_sale`) and `q`
(search, Bangla or English - Bangla digits match ASCII ones). `sort`: `newest`,
`relevance` (default when searching), `price_asc`, `price_desc`, `popular`,
`best_selling`, `rating`, `name`. Up to 48 per page. Prices exclude VAT; each
product page carries its `vat_rate_bp`, added at checkout. These endpoints are
cacheable by a CDN for anonymous visitors and have their own rate limit
(`RATE_LIMIT_CATALOG`, 300/min per IP) so a server-rendered frontend does not
throttle itself.

**Products and variants.** What a shopper buys is a *variant*. A product sold
in one form has `option_type_id: null` and exactly one variant; a product sold
in sizes names its option type (Weight, Size...) and sends one variant per size
with a `value` and optional `unit` (`"5"` + `"kg"`). The first variant is the
default. `GET /admin/products/{id}` returns the same shape `PUT` accepts, so an
edit form can be filled from one and sent to the other.

**Images** are uploaded first, then attached by `id` to whatever they belong to.
The response carries a link per size - `thumb` (200px), `card` (600px) and
`full` (1600px), all WebP - so load the smallest that fits. Uploads nothing
claims within a day are deleted.

There are two health checks, both public:

- `GET /api/v1/health` answers `{"status":"healthy"}` with `200`. Use this one
  for anything that speaks JSON.
- `GET /up` is Laravel's own check and renders HTML. It is not versioned.

Both are liveness checks: they report that the process is serving requests and
deliberately touch no database, cache or queue, so a dependency outage does not
page whoever owns the API.

### Codes, not links

Verification, password reset and contact changes all work by a six digit code
sent by email or SMS, never by a link, so they work the same for an account
that only has a phone number. Nothing the API sends points at a URL.

Text messages go through the SMS driver in `config/sms.php`. Until a gateway is
connected it is `log`: messages, codes included, are written to
`storage/logs` instead of being sent.

---

**While there is no SMS gateway**, set `OTP_MASTER_CODE` (and `APP_ENV` to
anything but `production`) and that code verifies any **mobile number**, so
sign-up by phone can be exercised end to end. It never applies to email
addresses, is ignored outright in production, and every use is recorded in the
security log. See `config/security.php`.

## Authorisation

Users are shoppers or staff; the difference is the roles they hold.

**Permissions are code. Roles are data.**

**Permissions** are the unit of authorisation. Routes and policies check
permissions (`orders.refund`), never roles. The catalogue is fixed in
`app/Enums/PermissionName.php` because each entry corresponds to something the
code actually enforces - nobody can invent one through the API.

**Roles** are created by the super administrator in the back office: he names
one, ticks the actions it may perform, and assigns it to staff. Only two roles
are reserved by the application and shipped in code
(`app/Enums/RoleName.php`):

| Role | Why it is reserved |
| --- | --- |
| `super-admin` | Bypasses every gate through a `Gate::before` hook, so it holds no permission rows and can never fall behind as permissions are added. |
| `customer` | Assigned at registration. Holds nothing; a shopper has no back office access. |

Neither can be renamed, re-cut or deleted through the API - the attempt returns
`403 ROLE_RESERVED`.

`RolePermissionSeeder` projects the permission catalogue and those two roles into
the database. It is idempotent and safe to re-run on every deploy, and it
**never touches a role the owner created** - re-syncing them would silently undo
his configuration.

### The role editor

`GET /api/v1/permissions` returns the catalogue grouped into the pages of the
back office, which is the shape the role editor is drawn from - a section per
page, a checkbox per action, and a "select all" over the section:

```json
{ "data": [
  { "page": "orders", "label": "Orders", "permissions": [
      { "name": "orders.view", "action": "view", "label": "View" },
      { "name": "orders.refund", "action": "refund", "label": "Refund" }
  ]}
]}
```

The grouping is served rather than hard coded in the frontend, so adding a
permission puts it on the right screen without a frontend release.

### Two rules that keep this safe

- **Nobody may grant a permission they do not hold themselves.** Otherwise
  `roles.create` alone would be equivalent to super administrator, since its
  holder could mint a role carrying everything and take it. Violations return
  `403 PERMISSION_ESCALATION`.
- **Changing what a colleague may do requires `roles.assign`,** separately from
  `staff.update`. Fixing someone's name and widening their access are different
  responsibilities.

Staff hold exactly one role, so assigning a second replaces the first. A role
that staff still hold cannot be deleted (`409 ROLE_IN_USE`); reassign them first.

Guarding a route:

```php
Route::middleware('permission:orders.refund')->post('orders/{order}/refund', …);
```

`GET /api/v1/me` returns the caller's effective permission list, which is what
the back office should use to decide what to render.

---

## Security posture

| Concern | How it is handled |
|---|---|
| Password policy | 12 chars, mixed case, digit, symbol, and checked against haveibeenpwned outside local. `config/security.php` |
| Brute force | Per-minute limits on login (by email or number **and** by host), registration, password reset, code requests and code guesses. Every spelling of a mobile number shares one bucket |
| One-time codes | Six digits, stored only as a keyed hash, valid 5 minutes, void after 5 wrong guesses, only the latest works. Sending is capped per address or number (1 a minute, 5 an hour) whether or not an account exists there |
| Account takeover by pre-registration | An unverified sign-up cannot hold an address: registering it again takes the account over, and a Google sign-in wipes any password set on it. Unverified sign-ups are deleted after 48 hours |
| Google sign-in | Only ID tokens issued for this store's own client id, with a Google-verified email, are accepted |
| Probing with bad tokens | A `guest` limiter runs *before* authentication. Laravel's default priority puts `auth` ahead of `throttle`, which would otherwise leave failed authentication entirely unlimited |
| Account enumeration | Login answers identically for a wrong password and an unknown address, and runs a hash comparison either way so the timing matches. Password reset and code resends always answer the same |
| Token theft | Tokens expire; changing a password revokes every other token; resetting one revokes all of them; `/auth/tokens` lists and revokes devices individually |
| Deactivation | `is_active` is re-checked on every request, so revoking access is immediate rather than effective at the next sign in |
| Response hardening | `nosniff`, `DENY`, `no-referrer`, a `default-src 'none'` CSP, and `no-store` on anything user-scoped |
| Transport | `APP_FORCE_HTTPS` forces the scheme on generated and signed URLs; HSTS behind `SECURITY_HSTS_ENABLED` |
| Leak containment | Errors never expose internals unless `APP_DEBUG` is on. Tokens are prefixed `ecom_` so secret scanners recognise them in a commit |
| Behind a proxy | `TRUSTED_PROXIES` restores real client IPs, without which every per-IP limit shares one bucket |

### Before deploying

- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] `APP_FORCE_HTTPS=true`, and `SECURITY_HSTS_ENABLED=true` once TLS covers every subdomain
- [ ] `APP_KEY` set, and not the one from any other environment
- [ ] `CORS_ALLOWED_ORIGINS` listing the exact frontend origins - never `*`
- [ ] `TRUSTED_PROXIES` set if anything sits in front of the app
- [ ] `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`
- [ ] `ADMIN_PASSWORD` cleared from the environment after the first seed
- [ ] `CACHE_STORE`/`QUEUE_CONNECTION`/`SESSION_DRIVER` moved to `redis`
- [ ] `php artisan config:cache route:cache event:cache` in the release step
- [ ] `php artisan storage:link` once, so uploaded images are served
- [ ] A cron entry running `php artisan schedule:run` every minute (activity-log
      pruning, unattached upload cleanup, unpaid-order expiry every five
      minutes - without it, abandoned online payments hold their stock for
      good - hourly refund polling and daily deletion of expired report files)
- [ ] A queue worker running permanently (`php artisan queue:work`) - spreadsheet imports, order emails and SMS need it
- [ ] `SSLCOMMERZ_STORE_ID`/`_STORE_PASSWORD` set and `SSLCOMMERZ_SANDBOX=false`
      for live payments; with no store id the online method is simply not
      offered and the shop still takes cash
- [ ] The IPN URL (`/api/v1/payments/sslcommerz/ipn`) registered in the
      SSLCommerz merchant panel - without it, a shopper who closes the tab
      after paying leaves their order unpaid until it expires
- [ ] `SMS_DRIVER` set to a real gateway before customers sign up by phone - the `log` driver writes codes to the log
- [ ] `GOOGLE_CLIENT_ID` set to the frontend's Google OAuth client id
- [ ] PHP's GD extension built with WebP support (`php -r 'var_dump(gd_info()["WebP Support"]);'`)

> `config:cache` stops `.env` from being read at all. Every setting here is
> reached through `config()`, never `env()` outside a config file, so caching is
> safe - keep it that way.

---

## Moving the frontend to cookie authentication

Planned for when the SPA and the API share a top-level domain. No code change is
needed; Sanctum's stateful middleware is already wired up and lies dormant while
`SANCTUM_STATEFUL_DOMAINS` is empty. To switch:

```dotenv
SANCTUM_STATEFUL_DOMAINS=app.example.com
SESSION_DOMAIN=.example.com
SESSION_SECURE_COOKIE=true
CORS_SUPPORTS_CREDENTIALS=true
CORS_ALLOWED_ORIGINS=https://app.example.com
```

The frontend then calls `GET /sanctum/csrf-cookie` once and sends credentials
with each request. Bearer tokens keep working alongside it, which is what mobile
clients and server-to-server integrations will continue to use.

---

## Development

```sh
composer test          # PHPUnit (sqlite in memory - no MySQL needed)
composer analyse       # PHPStan level 8 via Larastan
composer lint          # Pint, Laravel preset
composer ci            # all three, as CI runs them
```

Run static analysis through `composer analyse` rather than `vendor/bin/phpstan`
directly: the script passes an `--autoload-file` that Larastan needs whenever
the result cache is warm. `phpstan/bootstrap.php` explains why.

Tests that make HTTP calls extend `Tests\ApiTestCase`, which seeds roles and
permissions and issues real bearer tokens. When a test changes who the caller is
mid-way - revoking a token, deactivating an account - call `asFreshRequest()`
before the next request; the test application otherwise reuses the user it has
already resolved.

### Measuring storefront speed

The storefront must stay fast at the store's real size (~10,000 products).
`BenchmarkCatalogSeeder` loads a catalogue that size - nested categories,
brands, a third of the names in Bangla - into a **scratch database**, and
`catalog:benchmark` times each storefront endpoint against it:

```sh
mysql -u root -p -e "CREATE DATABASE ecommerce_api_benchmark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
DB_DATABASE=ecommerce_api_benchmark php artisan migrate --force
DB_DATABASE=ecommerce_api_benchmark php artisan db:seed --class=BenchmarkCatalogSeeder
DB_DATABASE=ecommerce_api_benchmark php artisan catalog:benchmark
```

Never point it at a database with real data. On 2026-09-20, on a MacBook with
MySQL 8.0.39 and the database cache store, every storefront endpoint answered
in under 16 ms warm (median over 15 requests) and under 115 ms cold.

List endpoints are also pinned by tests: `assertQueryCountAtMost()` in
`ApiTestCase` fails a test if an endpoint's query count grows with the number
of rows.

### Layout

```
app/
  Enums/            PermissionName, RoleName, ErrorCode - the vocabulary
  Exceptions/       ApiExceptionRenderer, the one JSON error shape
  Http/
    Controllers/Api/V1/
    Middleware/     request id, forced JSON, security headers, active check
    Requests/       validation, one class per endpoint
    Resources/      response shapes
routes/
  api.php           version registration only
  api/v1.php        every v1 endpoint
```

Adding a version means adding `routes/api/v2.php` beside v1, never editing v1
under a shipped frontend.

---

## Deployment

**[DEPLOYMENT.md](DEPLOYMENT.md) is the step-by-step guide**: packages, MySQL,
the `.env` line by line, nginx, the queue worker, cron, and what changes when
the SMS gateway and SSLCommerz credentials arrive.

Development is native (`php artisan serve`) but nothing is tied to it: every
setting is environment-driven, and there are no host-specific paths, so Docker
or Laravel Sail can be dropped in later without touching application code.
