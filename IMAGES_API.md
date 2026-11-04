# Images and file uploads: server setup and API guide for the frontend

This guide covers every image the store has: product images, category and
brand images, home page banners, review photos, and the store logo and
favicon. It explains how to set up the server so they are served, how the back
office uploads them, and what the shop receives when it loads a product.
[Section 9](#9-other-uploads) covers the two uploads that are not images: the
product spreadsheet import and the wholesale application documents.

`API.md` has the generated reference for every endpoint mentioned here.

---

## Contents

1. [The short answer: what the API sends](#1-the-short-answer)
2. [Server setup](#2-server-setup)
3. [Uploading images from the back office](#3-uploading-images-from-the-back-office)
4. [What the shop receives](#4-what-the-shop-receives)
5. [Using the images in the frontend](#5-using-the-images-in-the-frontend)
6. [The store logo and favicon](#6-the-store-logo-and-favicon)
7. [Review photos from customers](#7-review-photos-from-customers)
8. [Things to know](#8-things-to-know)
9. [Other uploads: spreadsheets and documents](#9-other-uploads)

---

## 1. The short answer

**Every image arrives as a full, absolute URL.** The frontend never builds a
path, never adds a domain, and never needs to know where files live. Put the
link straight into `<img src>`.

```
https://api.yourdomain.com/storage/media/2026/11/01JBX3K9Q2M7Z8R4T6V0W5YHNC/card.webp
└──────── APP_URL ───────┘└─ disk ─┘└──────────────── file ────────────────────┘
```

Catalogue images come as an **image object**, with a link per size:

```json
{
  "id": 412,
  "url": "https://api.yourdomain.com/storage/media/2026/11/01JBX3.../full.webp",
  "sizes": {
    "thumb": "https://api.yourdomain.com/storage/media/2026/11/01JBX3.../thumb.webp",
    "card":  "https://api.yourdomain.com/storage/media/2026/11/01JBX3.../card.webp",
    "full":  "https://api.yourdomain.com/storage/media/2026/11/01JBX3.../full.webp"
  },
  "width": 1600,
  "height": 1200,
  "alt": "Red cotton t-shirt, front"
}
```

| Size | Longest edge | Use it for |
|---|---|---|
| `thumb` | 200 px | cart, mini cart, search suggestions, order history, admin tables |
| `card` | 600 px | product cards in lists and grids |
| `full` | 1600 px | the product page and zoom; same as `url` |

- Every size is **WebP**, whatever was uploaded.
- Images are only ever scaled **down**. A 500 px upload has a 500 px `card` and
  a 500 px `full`.
- `width` and `height` are of `full`. Use them for the aspect ratio so the page
  does not jump while images load.
- `alt` may be `null`. Fall back to the product name.

A few places send a **plain URL string** instead of an object (home page
banners, order items, the store logo). They are listed in
[section 4](#4-what-the-shop-receives).

---

## 2. Server setup

Images are stored on the API server's own disk and served directly by nginx.
PHP is not involved in serving them. `DEPLOYMENT.md` has the full server guide;
these are the steps that matter for images.

### 2.1 `APP_URL` must be the final public address

The links are built from `APP_URL` **at the moment of upload** and saved in the
database as they are. So set it correctly before anyone uploads a real image:

```ini
APP_URL=https://api.yourdomain.com
```

- Use `https`, not `http`. An `http` link on an `https` shop is blocked by the
  browser as mixed content.
- No trailing slash.
- After editing `.env`, run `php artisan config:cache`.

Changing `APP_URL` later does **not** update links already saved. See
[section 8](#8-things-to-know) for how to fix that if the domain ever changes.

### 2.2 The rest of `.env`

These are the defaults; there is normally nothing to change.

```ini
MEDIA_DRIVER=local            # the only driver today
MEDIA_DISK=public             # storage/app/public, served as /storage
MEDIA_MAX_UPLOAD_KB=5120      # 5 MB per image
MEDIA_MAX_DIMENSION=8000      # pixels per side
MEDIA_WEBP_QUALITY=80
MEDIA_UNATTACHED_TTL_HOURS=24 # uploads never attached to anything are erased after this
```

### 2.3 The storage link

Run once per server (and again if the `public/storage` folder is ever deleted):

```bash
php artisan storage:link
```

It makes `public/storage` point at `storage/app/public`, which is where the
images are written. Without it every image link returns 404.

### 2.4 Permissions

nginx and PHP-FPM run as `www-data` and must be able to write to `storage/`.
If every upload fails with a 500, this is the cause.

```bash
sudo chown -R deploy:www-data /var/www/ecommerce-api
sudo chmod -R ug+rwx /var/www/ecommerce-api/storage
```

### 2.5 PHP and nginx limits

Both must allow the request size, or larger uploads fail before Laravel sees
them (nginx answers `413 Request Entity Too Large`).

`php.ini` (for PHP-FPM):

```ini
upload_max_filesize = 25M
post_max_size = 25M
```

nginx, inside the `server { }` block:

```nginx
client_max_body_size 25M;

# Uploaded images, served straight off disk through the storage symlink.
location /storage {
    expires 30d;
    add_header Cache-Control "public";
}
```

File names are random and never reused, so long browser and CDN caching is
safe. A replaced image gets a new link.

### 2.6 GD with WebP

Images are resized with PHP's GD extension, which must be built with WebP
support. Check:

```bash
php -r 'var_dump(gd_info()["WebP Support"] ?? false);'   # must print bool(true)
```

### 2.7 The scheduler

An image is uploaded first and attached to a product when the product is saved
([section 3](#3-uploading-images-from-the-back-office)). Uploads that were
never attached (a form that was abandoned) are erased by a nightly job at 03:00.
That needs the Laravel scheduler cron, which the app needs anyway:

```cron
* * * * * cd /var/www/ecommerce-api && php artisan schedule:run >> /dev/null 2>&1
```

### 2.8 Backups

The images are files in `storage/app/public`. They are **not** in the database
backup. Back that folder up as well.

### 2.9 Quick check after deploying

1. Upload an image through `POST /api/v1/admin/media`.
2. Open the `url` from the response in a browser. It should show the image and
   start with `https://` and your API domain.
3. If it 404s: `storage:link` is missing, or the nginx `location /storage`
   block is wrong.
4. If the link has `localhost` or `http://` in it: `APP_URL` is wrong, or
   `config:cache` was not re-run after changing it.

---

## 3. Uploading images from the back office

All images (product, variant, gallery, category, brand, banner) work the same
way, in **two steps**:

1. **Upload the file** to `POST /api/v1/admin/media`. The response has an `id`.
2. **Save the record** (product, category...) with that `id` in the right field.

Upload as soon as the user picks a file, so you can show a preview from the
returned `sizes.thumb` while they fill in the rest of the form.

### 3.1 Upload

```
POST /api/v1/admin/media
Authorization: Bearer <token>
Content-Type: multipart/form-data
Permission: media.upload
```

| Field | Rules |
|---|---|
| `file` | required. JPEG, PNG or WebP. Max 5 MB, max 8000 px per side. |
| `alt` | optional text, max 255 characters |

SVG and GIF are refused: SVG can carry script, and only the first frame of a
GIF would survive.

```ts
async function uploadImage(file: File, alt?: string): Promise<AdminMedia> {
  const body = new FormData();
  body.append('file', file);
  if (alt) body.append('alt', alt);

  const res = await fetch(`${API}/api/v1/admin/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body, // do NOT set Content-Type yourself; the browser adds the boundary
  });
  if (!res.ok) throw await res.json();
  return (await res.json()).data;
}
```

Response `201`:

```json
{
  "data": {
    "id": 412,
    "url": "https://api.yourdomain.com/storage/media/2026/11/01JBX3.../full.webp",
    "sizes": { "thumb": "...", "card": "...", "full": "..." },
    "width": 1600,
    "height": 1200,
    "mime_type": "image/webp",
    "size_bytes": 184233,
    "alt": "Red cotton t-shirt, front",
    "is_attached": false,
    "created_at": "2026-11-02T10:15:00+06:00"
  }
}
```

A file that is not really an image (renamed, corrupt) is refused with `422`.

### 3.2 Attach: the field for each image

| Record | Endpoint | Field | Shape |
|---|---|---|---|
| Product main image | `POST/PUT /admin/products` | `main_image_id` | one id |
| Product gallery | same | `gallery_image_ids` | ordered array of ids, max 50 |
| Variant image | same, inside `variants[]` | `variants.*.image_id` | one id |
| Category icon | `POST/PUT /admin/categories` | `icon_image_id` | one id |
| Category banner | same | `banner_image_id` | one id |
| Brand logo | `POST/PUT /admin/brands` | `logo_image_id` | one id |
| Brand banner | same | `banner_image_id` | one id |
| Banner (slider / offer) | `POST/PUT /admin/banners` | `image_id` (required) | one id |
| Banner, mobile version | same | `mobile_image_id` | one id, optional |

When saving:

- **Field left out** → the image stays as it is.
- **Field sent as `null`** → the image is removed.
- **`gallery_image_ids`** is the whole gallery, in display order. To reorder,
  send the ids in the new order. To remove one, send the list without it.
- **One image belongs to one record.** Sending an id already used by another
  product is refused with `422`: *"That image does not exist or is already used
  elsewhere. Upload it again."* To use the same picture twice, upload it twice.

### 3.3 Delete

```
DELETE /api/v1/admin/media/{id}      Permission: media.delete     → 204
```

The image disappears from wherever it was attached. You do not need to call
this when the user simply removes an image from a form; saving the form
without it is enough, and the detached upload is cleaned up automatically.

### 3.4 Bulk upload by SKU

```
POST /api/v1/admin/products/images/bulk
Permission: products.update and media.upload
```

Send up to 20 files in `files[]`, each named after a product SKU:
`TSHIRT-RED-M.jpg` becomes that product's main image, `TSHIRT-RED-M_2.jpg`,
`TSHIRT-RED-M_3.jpg`... its gallery. Each file's result is reported separately,
so one bad file does not fail the rest.

The whole request must fit inside the server's 25 MB body limit
(section 2.5). Twenty 5 MB photos is 100 MB, which nginx refuses. **Split the
batch by total size** (keep each request under ~20 MB), not just by count.

### 3.5 Showing images in the admin

Admin endpoints (`/admin/products`, `/admin/categories`, `/admin/brands`,
`/admin/banners`) return the same image object as the shop
([section 1](#1-the-short-answer)) under `main_image`, `gallery`, `image`,
`icon`, `logo`, `banner` and `mobile_image`. Use `sizes.thumb` in tables.

---

## 4. What the shop receives

All of these are public; no token is needed.

### 4.1 Image objects (`{ id, url, sizes, width, height, alt }`)

| Endpoint | Field(s) |
|---|---|
| `GET /api/v1/products` (list) | `data[].image` (main image) |
| `GET /api/v1/products/{slug}/related` | `data[].image` |
| `GET /api/v1/products/suggest` | `image` on each suggestion |
| `GET /api/v1/products/{slug}` (detail) | `main_image`, `gallery[]`, `variants[].image`, `brand.logo` |
| `GET /api/v1/categories`, `/categories/{slug}` | `icon`, `banner` |
| `GET /api/v1/brands`, `/brands/{slug}` | `logo`, `banner` |
| `GET /api/v1/cart` | `image` on each item |
| `GET /api/v1/products/{slug}/reviews` | `photos[]` on each review |

Any of them can be `null` (no image uploaded); `gallery` and `photos` can be
`[]`. Always have a placeholder.

Product list item:

```json
{
  "id": 17,
  "name": "Cotton T-shirt",
  "slug": "cotton-t-shirt",
  "image": {
    "id": 412,
    "url": "https://api.yourdomain.com/storage/media/2026/11/01JBX3.../full.webp",
    "sizes": { "thumb": "...thumb.webp", "card": "...card.webp", "full": "...full.webp" },
    "width": 1600,
    "height": 1200,
    "alt": null
  },
  "price": { "min": 59000, "max": 69000, "compare_at": 75000, "discount_percent": 21 }
}
```

Product detail (image fields only):

```json
{
  "main_image": { "id": 412, "url": "...", "sizes": { ... }, "width": 1600, "height": 1200, "alt": null },
  "gallery": [
    { "id": 413, "url": "...", "sizes": { ... }, "width": 1600, "height": 1067, "alt": null },
    { "id": 414, "url": "...", "sizes": { ... }, "width": 1200, "height": 1600, "alt": null }
  ],
  "variants": [
    { "id": 51, "sku": "TS-RED-M", "label": "Red", "image": { "id": 415, "url": "...", "sizes": { ... } } },
    { "id": 52, "sku": "TS-BLU-M", "label": "Blue", "image": null }
  ],
  "brand": { "id": 3, "name": "Acme", "slug": "acme", "logo": { "id": 20, "url": "...", "sizes": { ... } } }
}
```

`main_image` is **not** repeated in `gallery`. The product page shows
`main_image` first, then `gallery` in order. When a shopper picks a variant
that has its own `image`, switch to it; when its `image` is `null`, keep
showing `main_image`.

### 4.2 Plain URL strings

These send one link as a string (the `full` size), not an object:

| Endpoint | Field(s) |
|---|---|
| `GET /api/v1/home` | `banners[].image`, `banners[].mobile_image` |
| `GET /api/v1/settings` | `logo_url`, `favicon_url` |
| `GET /api/v1/me/orders`, `/me/orders/{number}` | `items[].image` |

- `mobile_image` is never empty when `image` is set: it falls back to the
  desktop image. Use `<picture>` to switch between them.
- An order item's `image` is the picture at the time the order was placed. It
  does not change when the product's picture changes later. It can be `null`.

---

## 5. Using the images in the frontend

### 5.1 TypeScript types

```ts
export type ImageSize = 'thumb' | 'card' | 'full';

export interface ApiImage {
  id: number;
  url: string;                          // absolute; same as sizes.full
  sizes: Partial<Record<ImageSize, string>>;
  width: number | null;
  height: number | null;
  alt: string | null;
}

/** Smallest size that fits, falling back to `url`. */
export function imageSrc(image: ApiImage | null, size: ImageSize): string | null {
  return image ? image.sizes[size] ?? image.url : null;
}
```

Type `sizes` as partial and fall back to `url`: the sizes are set in server
config, so code that assumes a key always exists breaks if one is ever added
or renamed.

### 5.2 Plain `<img>` with `srcset`

```tsx
function ProductCardImage({ image, name }: { image: ApiImage | null; name: string }) {
  if (!image) return <img src="/placeholder.webp" alt={name} />;

  return (
    <img
      src={image.sizes.card ?? image.url}
      srcSet={[
        image.sizes.thumb && `${image.sizes.thumb} 200w`,
        image.sizes.card && `${image.sizes.card} 600w`,
        image.sizes.full && `${image.sizes.full} 1600w`,
      ].filter(Boolean).join(', ')}
      sizes="(max-width: 640px) 50vw, 300px"
      width={image.width ?? undefined}
      height={image.height ?? undefined}
      alt={image.alt ?? name}
      loading="lazy"
    />
  );
}
```

The `200w / 600w / 1600w` numbers are the longest edge, which equals the width
for landscape and square photos. That is close enough for `srcset`.

### 5.3 Next.js `<Image>`

The images are already resized and WebP, so Next.js does not need to process
them again. Two options:

**a) Let Next.js load them as they are** (simplest, and no work for the
frontend server):

```tsx
<Image src={imageSrc(image, 'card')!} alt={image.alt ?? name}
       width={image.width ?? 600} height={image.height ?? 600} unoptimized />
```

**b) Let Next.js optimise them**: allow the API domain in `next.config.ts`,
otherwise `<Image>` refuses the link:

```ts
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.yourdomain.com', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' }, // dev
    ],
  },
};
export default nextConfig;
```

Option (b) means the frontend server downloads and re-encodes every image, so
it costs CPU and disk there. Option (a) is recommended.

### 5.4 CORS

Showing an image with `<img>` or `<Image>` needs no CORS setting. CORS only
matters if the frontend reads image **bytes** with `fetch()` or draws them on a
`<canvas>`, which a shop normally never does.

---

## 6. The store logo and favicon

These are not catalogue images. They are kept exactly as uploaded (no
resizing, no WebP), because a favicon must stay an `.ico` and the invoice logo
goes into PDFs.

Upload (back office):

```
POST /api/v1/admin/settings/assets/logo
POST /api/v1/admin/settings/assets/favicon
POST /api/v1/admin/settings/assets/invoice-logo
Content-Type: multipart/form-data       Permission: settings.update
```

| Field | Rules |
|---|---|
| `file` | required. PNG, JPEG, WebP or ICO. Max 2 MB. SVG is refused. |

This is **one step**: no media id. The file replaces the old one immediately,
and the response is the full settings object with the new link.

Read (shop):

```
GET /api/v1/settings
```

```json
{
  "data": {
    "store_name": "...",
    "logo_url": "https://api.yourdomain.com/storage/system/logo-k3j9x0a1b2c3.png",
    "favicon_url": "https://api.yourdomain.com/storage/system/favicon-p8q7r6s5t4u3.ico"
  }
}
```

Both can be `null` before anything is uploaded. The file name changes on every
upload, so a new logo shows at once even with long caching. The invoice logo
is not public; it is only used inside invoices.

---

## 7. Review photos from customers

A signed-in customer can add up to 5 photos to a review. Same two steps:

1. `POST /api/v1/me/reviews/photos` (multipart, field `file`, JPEG/PNG/WebP,
   max 2 MB) → returns `id`. Rate limited per customer.
2. `POST /api/v1/me/reviews` with `photo_ids: [id, id, ...]`.

They come back on `GET /api/v1/products/{slug}/reviews` as `photos[]`, each an
image object ([section 1](#1-the-short-answer)).

---

## 8. Things to know

- **Never build image links yourself.** Always use what the API sends. Image
  storage can later move to an external service or CDN, and the links will
  then point to a different domain. The frontend will not need to change, as
  long as it uses the links as given.
- **Do not cache API responses longer than the images live.** A deleted image
  vanishes from the API at once, but its link may keep working for a while.
- **Uploads are re-encoded.** Location and camera data (EXIF) in phone photos
  is removed. Orientation is applied first, so photos taken sideways come out
  the right way up.
- **Unused uploads disappear after 24 hours.** If a back office form keeps an
  uploaded id for longer than that before saving (a draft left open
  overnight), the save fails with the "Upload it again" message. Upload again.
- **If the API domain ever changes**, links saved before the change still point
  to the old domain. Back up the database, then run (replacing both
  addresses):

  ```sql
  UPDATE media
     SET url   = REPLACE(url,   'https://old-api.example.com', 'https://api.yourdomain.com'),
         sizes = REPLACE(sizes, 'https://old-api.example.com', 'https://api.yourdomain.com');

  UPDATE order_items
     SET image_url = REPLACE(image_url, 'https://old-api.example.com', 'https://api.yourdomain.com');

  UPDATE incomplete_order_items
     SET image_url = REPLACE(image_url, 'https://old-api.example.com', 'https://api.yourdomain.com');

  UPDATE settings
     SET value = REPLACE(value, 'https://old-api.example.com', 'https://api.yourdomain.com')
   WHERE `key` IN ('logo_url', 'favicon_url', 'invoice_logo_url');
  ```

  then `php artisan cache:clear` so the cached home page and catalogue pick up
  the new links. Also move the files themselves (`storage/app/public`) if the
  server changed.

---

## 9. Other uploads

Only two endpoints accept files that are not images. Nothing else does: there
is no general file upload, no video upload (a product video is a link in
`video_url`, such as a YouTube URL), and no attachments on products, orders or
expenses.

| What | Endpoint | Who | File types | Limit |
|---|---|---|---|---|
| Product import | `POST /api/v1/admin/product-imports` | staff with `products.import` | `.xlsx`, or `.csv` in UTF-8 | 20 MB, 20,000 rows |
| Wholesale application | `POST /api/v1/business-applications` | anyone, signed in or not | JPG, PNG, WebP or PDF | 4 MB per file, 5 files |

Neither gets a public link, and neither goes through the image pipeline: the
files are kept exactly as uploaded, on the API's private storage
(`storage/app/private`), not under `/storage`.

### 9.1 Product import (back office)

**Step 1: get the template.**

```
GET /api/v1/admin/product-imports/template?format=xlsx     (or format=csv)
Permission: products.import
```

The response is the file itself: a blank spreadsheet with the columns and
example rows, one row per variant, prices in taka. Staff fill it in.
`GET /api/v1/admin/products/export` (permission `products.export`) downloads
the existing products in the same layout, so they can be edited and imported
back. It takes the same `format`, plus optional filters `status`,
`category_id` and `brand_id`.

Both are downloads behind a bearer token, so a plain `<a href>` will not work.
Fetch with the token and save the result (see 9.3).

**Step 2: upload it.**

```
POST /api/v1/admin/product-imports
Content-Type: multipart/form-data       Permission: products.import
```

| Field | Rules |
|---|---|
| `file` | required. `.xlsx` or `.csv` (UTF-8). Max 20 MB. |

The API answers `202` immediately and imports in the background, however big
the file:

```json
{
  "data": {
    "id": 31,
    "status": "pending",
    "file": "products-november.xlsx",
    "total_rows": null,
    "products_created": 0,
    "products_updated": 0,
    "rows_failed": 0,
    "errors": [],
    "started_at": null,
    "finished_at": null,
    "created_at": "2026-11-02T10:15:00+06:00"
  }
}
```

**Step 3: poll for the result.**

```
GET /api/v1/admin/product-imports/{id}      Permission: products.import
```

Poll every 2-3 seconds until `status` is `completed` or `failed`
(`pending` → `processing` → `completed` / `failed`). Then show the counts and
the refused rows:

```json
"errors": [
  { "row": 14, "sku": "TS-RED-XL", "messages": ["The price must be at least 0."] },
  { "row": 0,  "sku": null,        "messages": ["The file could not be read. Save it as .xlsx or UTF-8 .csv and try again."] }
]
```

`row` is the row number in the spreadsheet, so staff can find it; `row: 0`
means a problem with the whole file. Rows are matched to existing products by
SKU (then by slug), so re-importing updates products rather than duplicating
them. Each product is saved or refused as a whole: a mistake in one product
does not stop the rest of the file. Categories must already exist; a brand
that does not exist yet is created.

```ts
async function importProducts(file: File): Promise<ProductImport> {
  const body = new FormData();
  body.append('file', file);
  let res = await fetch(`${API}/api/v1/admin/product-imports`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, body,
  });
  if (!res.ok) throw await res.json();
  let item: ProductImport = (await res.json()).data;

  while (item.status === 'pending' || item.status === 'processing') {
    await new Promise((r) => setTimeout(r, 2500));
    res = await fetch(`${API}/api/v1/admin/product-imports/${item.id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    item = (await res.json()).data;
  }
  return item;
}
```

**Server:** the import runs on the **queue worker**. If the worker is not
running (supervisor, see `DEPLOYMENT.md`), imports stay `pending` forever.
That is the first thing to check when an import never finishes.

Product images are not part of the spreadsheet. Upload them afterwards with
the bulk upload by SKU ([section 3.4](#34-bulk-upload-by-sku)).

### 9.2 Wholesale (business) application (shop)

A public form where a business applies to buy wholesale. The details and the
documents are sent **together, in one multipart request**. There is no
separate upload step and no media id.

```
POST /api/v1/business-applications
Content-Type: multipart/form-data
Authorization: optional (a signed-in customer's application is linked to their account)
```

| Document field | Rules |
|---|---|
| `trade_license[]` | required, 1 to 3 files. A single `trade_license` file is accepted too. |
| `nid_front` | required, one file: front of the national ID card |
| `nid_back` | required, one file: back of the national ID card |

Each file: JPG, PNG, WebP or PDF, max 4 MB. Five files at 4 MB fit inside the
server's 25 MB request limit.

The text fields go in the same `FormData`:

- **Required:** `business_name`, `business_type`, `trade_license_number`,
  `business_address`, `district_id`, `contact_name`, `phone`.
- **Optional:** `bin_tin`, `interested_in`, `designation`, `email`,
  `alternate_phone`, `message`.
- **`website`** is a hidden trap for bots. Render it hidden, or not at all,
  and never fill it; a request where it has a value is refused.

```ts
const body = new FormData();
body.append('business_name', form.businessName);
// ...the other text fields
form.tradeLicense.forEach((file) => body.append('trade_license[]', file));
body.append('nid_front', form.nidFront);
body.append('nid_back', form.nidBack);

const res = await fetch(`${API}/api/v1/business-applications`, {
  method: 'POST', headers: { Accept: 'application/json' }, body,
});
```

Response `201`:

```json
{ "data": { "id": 8, "message": "Thank you. We have received your application and will be in touch." } }
```

- `409` with code `BUSINESS_APPLICATION_EXISTS`: this mobile number already
  has an application being dealt with.
- `429`: rate limited, 5 applications per hour per IP.
- Check the file types and sizes in the browser before sending, so a customer
  is not told a file is too big only after uploading 20 MB.

**Opening the documents in the back office.**
`GET /api/v1/admin/business-applications/{id}` (permission
`business-applications.view`) lists the application's `documents`:

```json
"documents": [
  {
    "id": 21,
    "type": "trade_license",
    "label": "Trade licence",
    "original_name": "licence.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 812345,
    "url": "https://api.yourdomain.com/api/v1/admin/business-applications/8/documents/21"
  }
]
```

That `url` is an API endpoint, not a public file. It **needs the bearer
token**, so it cannot be put straight into `<img src>`, `<iframe>` or
`<a href>`. Fetch it with the token and show the result (9.3). Every opening
is recorded in the activity log, and deleting the application erases the
files.

### 9.3 Showing or saving a file that needs the token

The import template, the product export and the application documents are all
behind the bearer token. Fetch them, then hand the browser a temporary link:

```ts
async function openProtectedFile(url: string, saveAs?: string): Promise<void> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Could not load file (${res.status})`);

  const blobUrl = URL.createObjectURL(await res.blob());

  if (saveAs) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = saveAs; // e.g. 'product-import-template.xlsx'
    a.click();
  } else {
    window.open(blobUrl, '_blank'); // images and PDFs open in a new tab
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
```

For a document preview inside the page, set the blob URL as the `src` of an
`<img>` (images) or `<iframe>` (PDFs), using `mime_type` to choose.

When the API moves to cookie sessions (planned once the shop and API share a
domain), these links will work directly in `<a href>` and `<iframe>`, because
the browser will send the session cookie itself.
