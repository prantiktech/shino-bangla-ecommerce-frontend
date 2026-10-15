# Courier integration

How the shop sends orders with **Steadfast**, **Pathao Courier** and **RedX**:
what the client needs, how the server must be set up, what each endpoint takes
and returns, and how the frontend should build the two screens that use it.

Server setup is also covered step by step in `DEPLOYMENT.md` (section
*Couriers*); this file is the complete reference.

---

## Contents

1. [How it works](#1-how-it-works)
2. [What the client needs from each courier](#2-what-the-client-needs-from-each-courier)
3. [Server requirements](#3-server-requirements)
4. [Going live with Steadfast](#4-going-live-with-steadfast)
5. [Permissions](#5-permissions)
6. [Frontend: the Couriers settings screen](#6-frontend-the-couriers-settings-screen)
7. [Frontend: shipping an order](#7-frontend-shipping-an-order)
8. [Frontend: showing the parcel](#8-frontend-showing-the-parcel)
9. [What happens after shipping](#9-what-happens-after-shipping)
10. [Webhooks](#10-webhooks)
11. [Errors](#11-errors)
12. [Limits and things still to confirm](#12-limits-and-things-still-to-confirm)

---

## 1. How it works

```
Owner                     Staff                         Courier
─────                     ─────                         ───────
Enters keys, switches  →  Order is Packed
the courier on            Opens "Ship", picks a courier
                          (and area, for Pathao/RedX)
                          Presses Ship  ───────────────→ Parcel booked
                          Order becomes Shipped  ←──────  consignment id
                                                          ...
                          Order becomes Delivered ←────── "delivered"
                          (cash orders marked Paid)
```

- The owner sets each courier up once, in the back office.
- Staff ship a **packed** order by choosing one of the couriers that are
  switched on.
- The courier is asked first. Only when it accepts does the order become
  **Shipped**. If it refuses, the order stays **Packed** and staff see why.
- After that, the courier moves the order: **Delivered** or **Returned**.
- Shipping by hand (the existing `Shipped` status button) still works, for hand
  deliveries or a courier that isn't integrated.

---

## 2. What the client needs from each courier

| | Steadfast | Pathao | RedX |
|---|---|---|---|
| **Keys** | API key, secret key | Client ID, client secret, merchant email, merchant password | API access token |
| **Where to get them** | Steadfast merchant panel, or Steadfast support | Pathao merchant panel → Developer API | RedX support |
| **Pickup store** | Not needed: Steadfast collects from the merchant account's address | **Required**: picked from the store list once the keys are in | Optional: picked from the store list |
| **Address at booking** | Sent as written | Staff pick a **city** and **zone** (area optional) from Pathao's list | Staff pick an **area** from RedX's list |
| **Test mode** | **None**: every booking is a real parcel | Yes (sandbox) | Yes (sandbox) |
| **Webhook** | Callback URL + auth token, in the merchant panel | Developer API → Webhook Integration | Ask RedX support |

**Steadfast needs nothing beyond the two keys.** The pickup address is the one
on the client's Steadfast account, and API access must be enabled on it (some
accounts have to ask Steadfast support).

---

## 3. Server requirements

Nothing goes in `.env` for the couriers themselves. The keys are entered in the
back office and stored **encrypted** with the application key.

| Requirement | Why |
|---|---|
| `php artisan migrate` | Creates `courier_accounts` and `shipments` |
| `php artisan db:seed --class=RolePermissionSeeder` | Adds `couriers.view` and `couriers.update` |
| `APP_URL` = the real HTTPS address of the API | The webhook address shown to the owner is built from it |
| **Queue worker** running | Webhooks are handled on the queue so the courier gets an instant answer |
| **Scheduler** (cron) running | `shipments:sync` checks parcels every two hours, in case a webhook is lost |
| **`APP_KEY` never changes** | A new key makes the saved courier keys unreadable; they would have to be entered again |

Optional settings (`config/couriers.php`), defaults are fine:

| `.env` | Default | Meaning |
|---|---|---|
| `COURIER_TIMEOUT` | `20` | Seconds to wait for a courier to answer |
| `COURIER_LOOKUP_CACHE_HOURS` | `24` | How long city/zone/area/store lists are kept |
| `COURIER_TRACK_FOR_DAYS` | `45` | Parcels older than this are no longer checked |
| `RATE_LIMIT_COURIER_WEBHOOK` | `600` | Webhook calls per minute per courier address |

---

## 4. Going live with Steadfast

1. Deploy, then run the migration and the seeder (section 3).
2. Back office → **Couriers** → Steadfast: enter the API key and secret key,
   press **Check the keys**, then switch it on.
3. Steadfast merchant panel: paste the **webhook address** from the Couriers
   screen as the callback URL, and the **webhook secret** as the auth token.
4. Ship one **real, low-value order** (to yourself, ideally) and check that:
   - the parcel appears in the Steadfast panel with the right name, phone,
     address and cash amount;
   - the order shows the consignment id and tracking link, and the link opens;
   - when it is delivered, the order becomes **Delivered** and **Paid**.

> **There is no Steadfast test mode, and the API cannot cancel a booking.** A
> parcel booked by mistake must be cancelled through the Steadfast panel or
> support.

---

## 5. Permissions

| Permission | Allows |
|---|---|
| `couriers.view` | See the Couriers settings screen (keys masked) and the pickup store lists |
| `couriers.update` | Change courier settings and check the keys |
| `orders.fulfil` | See which couriers are available, load area lists, ship an order, ask a courier for an update |

A packer with only `orders.fulfil` can ship with a courier but **never sees a
key**. The super admin has all of these.

---

## 6. Frontend: the Couriers settings screen

### List the couriers

`GET /api/v1/admin/couriers` (`couriers.view`)

Always returns all three couriers, in the order Steadfast, Pathao, RedX:

```json
{
  "data": [
    {
      "courier": "steadfast",
      "label": "Steadfast",
      "is_enabled": true,
      "is_sandbox": false,
      "supports_sandbox": false,
      "is_configured": true,
      "credentials": [
        { "key": "api_key", "label": "API key", "is_secret": true, "is_set": true, "preview": "••••3f9a" },
        { "key": "secret_key", "label": "Secret key", "is_secret": true, "is_set": true, "preview": "••••81c2" }
      ],
      "options": [],
      "webhook": {
        "url": "https://api.yourshop.com/api/v1/couriers/steadfast/webhook/Xy7…",
        "secret": "Xy7…"
      },
      "updated_at": "2026-10-11T10:15:00.000000Z"
    },
    {
      "courier": "pathao",
      "label": "Pathao Courier",
      "is_enabled": false,
      "is_sandbox": true,
      "supports_sandbox": true,
      "is_configured": false,
      "credentials": [
        { "key": "client_id", "label": "Client ID", "is_secret": true, "is_set": false, "preview": null },
        { "key": "client_secret", "label": "Client secret", "is_secret": true, "is_set": false, "preview": null },
        { "key": "username", "label": "Merchant email", "is_secret": false, "is_set": false, "preview": null },
        { "key": "password", "label": "Merchant password", "is_secret": true, "is_set": false, "preview": null }
      ],
      "options": [
        { "key": "store_id", "label": "Pickup store", "is_required": true, "value": null }
      ],
      "webhook": { "url": "…", "secret": "…" },
      "updated_at": "…"
    }
  ]
}
```

**How to build the form from this:**

- One card per courier, titled `label`, with an on/off switch (`is_enabled`).
- Show the **test mode** switch only when `supports_sandbox` is `true`.
- One input per `credentials` entry, labelled with `label`:
  - When `is_set` is `true`, show `preview` as the placeholder (e.g.
    `••••3f9a`) and leave the input **empty**.
  - Secret inputs (`is_secret: true`) should be password fields.
  - Non-secret values (the Pathao merchant email) come back in full in
    `preview`.
- One **pickup store** dropdown per `options` entry, filled from the stores
  endpoint below. Mark it required when `is_required` is `true`.
- Show the **webhook address and secret** read-only, with copy buttons, and a
  line telling the owner to paste them into the courier's panel.
- Disable the on/off switch until `is_configured` is `true`, or let the API
  refuse it (it answers 422, see below).

### Save a courier

`PUT /api/v1/admin/couriers/{courier}` (`couriers.update`), where `{courier}`
is `steadfast`, `pathao` or `redx`.

```json
{
  "is_enabled": true,
  "is_sandbox": true,
  "credentials": {
    "client_id": "…",
    "client_secret": "…",
    "username": "merchant@example.com",
    "password": "…"
  },
  "options": { "store_id": 1234 }
}
```

- Every field is optional; send only what changed.
- **Keys are write-only.** Leaving a key out, or sending it empty or `null`,
  keeps the saved one. So send only the inputs the owner actually typed in.
- Only the keys listed for that courier are accepted. Any other key is a 422.
- `options` is only accepted for Pathao (`store_id`) and RedX
  (`pickup_store_id`).
- `is_sandbox` is ignored for Steadfast (always `false`).
- Switching on (`is_enabled: true`) is refused until every key is in and, for
  Pathao, a pickup store is chosen:

```json
{
  "message": "Enter every key Pathao Courier needs, and pick a pickup store if it asks for one, before switching it on.",
  "code": "VALIDATION_FAILED",
  "errors": { "is_enabled": ["Enter every key Pathao Courier needs, …"] }
}
```

The answer is the updated courier, in the same shape as one entry of the list.

### Check the keys

`POST /api/v1/admin/couriers/{courier}/check` (`couriers.update`)

Makes one harmless request to the courier with the saved keys. Put a **Check
the keys** button next to Save.

```json
{ "data": { "courier": "steadfast", "is_sandbox": false, "message": "Steadfast accepted the keys." } }
```

On failure: `502 COURIER_REQUEST_FAILED`, with the courier's reason in
`message`. Show it as is. If the keys aren't entered yet: `409 COURIER_UNAVAILABLE`.

### Pickup stores

`GET /api/v1/admin/couriers/{courier}/stores` (`couriers.view`)

For the Pathao and RedX pickup store dropdown. It asks the courier, so the keys
must be saved first (`409 COURIER_UNAVAILABLE` otherwise). Steadfast returns an
empty list.

```json
{ "data": [ { "id": 1234, "name": "Main warehouse", "address": "House 5, Road 2, Mirpur" } ] }
```

The pickup stores themselves are created in the courier's own merchant panel.

---

## 7. Frontend: shipping an order

Show a **Ship with courier** button on an order whose `status` is `packed` and
whose `shipment` is `null`.

### Step 1: which couriers can be used

`GET /api/v1/admin/couriers/available` (`orders.fulfil`)

Only couriers that are switched on and fully set up:

```json
{
  "data": [
    { "courier": "steadfast", "label": "Steadfast", "is_sandbox": false, "area_fields": [] },
    { "courier": "pathao", "label": "Pathao Courier", "is_sandbox": true, "area_fields": ["city_id", "zone_id", "area_id"] },
    { "courier": "redx", "label": "RedX", "is_sandbox": false, "area_fields": ["area_id"] }
  ]
}
```

- Show them as choices (radio buttons or a dropdown).
- If `is_sandbox` is `true`, mark the choice **TEST**: the parcel goes to the
  courier's test server and nobody will collect it.
- If the list is empty, tell staff that no courier is set up, and offer only
  the manual Shipped button.
- `area_fields` says which place pickers to show (step 2).

### Step 2: the place pickers (Pathao and RedX only)

`GET /api/v1/admin/couriers/{courier}/areas` (`orders.fulfil`)

Every answer is a list of `{ "id", "name", … }`. Lists are cached for a day,
so they are quick after the first load.

**Pathao: three dropdowns, each filling the next.**

| Dropdown | Request | Required |
|---|---|---|
| City | `GET …/couriers/pathao/areas` | yes |
| Zone | `GET …/couriers/pathao/areas?city_id=1` | yes |
| Area | `GET …/couriers/pathao/areas?zone_id=298` | no |

```json
{ "data": [ { "id": 1, "name": "Dhaka" }, { "id": 2, "name": "Chittagong" } ] }
```

Clear the zone and area when the city changes, and the area when the zone
changes.

**RedX: one searchable picker.**

`GET …/couriers/redx/areas?q=dhanm`

```json
{ "data": [ { "id": 2, "name": "Dhanmondi", "post_code": "1205", "district": "Dhaka" } ] }
```

`q` matches the name, post code or district. Without `q`, all of RedX's areas
come back (about a thousand). Search as staff type, after two or three
letters.

**Steadfast** has no list (`area_fields` is empty); its endpoint returns
`{ "data": [] }`.

Pre-fill nothing: the customer's own address (`shipping_address.area` and
`.district` on the order) is shown above the pickers so staff can match it by
eye.

### Step 3: the rest of the form

| Field | Default | Notes |
|---|---|---|
| Weight (kg) | The order's own weight, or 0.5 kg | `weight_kg`, 0.1 to 50 |
| Cash to collect | The order total, or 0 if already paid | `cod_amount`, **in poisha**, 0 to the order total. Show it in taka and convert. |
| Note for the rider | none | `note`, up to 250 characters |

Show the defaults to staff from the order itself (`totals.grand_total`,
`payment_status`, `delivery.weight_grams`), and send a field only if they
change it.

### Step 4: ship

`POST /api/v1/admin/orders/{id}/shipment` (`orders.fulfil`)

```json
{
  "courier": "pathao",
  "city_id": 1,
  "zone_id": 298,
  "area_id": 1532,
  "weight_kg": 1.2,
  "cod_amount": 115250,
  "note": "Call before coming"
}
```

| Courier | Required besides `courier` |
|---|---|
| `steadfast` | nothing |
| `pathao` | `city_id`, `zone_id` |
| `redx` | `area_id` |

**Success: `201`**, with the whole order (same shape as `GET
/admin/orders/{id}`). `status` is now `shipped` and `shipment` is filled in
(section 8). Close the dialog and show the order.

Disable the Ship button while waiting: the courier can take a few seconds. A
second press is refused anyway (`409 ORDER_NOT_SHIPPABLE`), so a double click
can't book two parcels.

Failures (the order is **unchanged** in every case):

| Status | `code` | What to show |
|---|---|---|
| 409 | `ORDER_NOT_SHIPPABLE` | `message`: not packed, already booked, or being booked right now |
| 409 | `COURIER_UNAVAILABLE` | `message`: the courier was switched off meanwhile |
| 422 | `VALIDATION_FAILED` | Field errors: missing city/zone/area, an area the courier doesn't know, weight or cash out of range |
| 502 | `COURIER_REQUEST_FAILED` | `message`: the courier's own reason, e.g. *"Steadfast refused the request: The recipient phone must be 11 digits."* Staff can fix the order and try again. |

### Shipping by scanning instead

The invoice PDF carries the order number as a **Code 128 barcode**. A USB or
Bluetooth barcode scanner types what it reads and presses Enter, so the
shipment screen needs only a courier picker and one text box that submits on
Enter:

`POST /api/v1/admin/shipments/scan` (`orders.fulfil`)

```json
{ "courier": "steadfast", "number": "261012-PZPSD" }
```

| Answer | Meaning | What to show |
|---|---|---|
| `201`, `data.result: "shipped"` | Booked; `data.order` is the order with its `shipment` | A tick, clear the box, ready for the next scan |
| `200`, `data.result: "needs_area"` | Pathao or RedX need a place; `data.missing` lists the fields, `data.order` shows who it is for | The place pickers from step 2, then send the **same scan again** with `city_id`/`zone_id` (Pathao) or `area_id` (RedX) |
| `409 ORDER_NOT_SHIPPABLE` | Not packed yet, or already booked | `message` |
| `404` | No order has that number | "Order not found" |

Leave `courier` out to ship an order **by hand** (it just becomes Shipped). The
other fields (`weight_kg`, `cod_amount`, `note`) work as in step 3.

**Scan to return:** `POST /api/v1/admin/returns/scan` (`orders.refund`) with
`{ "number": "…", "note": "Customer refused" }`. A shipped or delivered order
becomes **Returned**, its stock goes back on the shelf, and its parcel is no
longer tracked. Anything else is `409 INVALID_ORDER_TRANSITION`.

The order list under the scanner is `GET /api/v1/admin/orders`, which now also
filters by `product` (name or SKU) and `courier`, and shows each order's
`shipment`.

---

## 8. Frontend: showing the parcel

### In the back office

Every order detail (`GET /api/v1/admin/orders/{id}`, and the answers from
status and payment changes) now has `shipment`, which is `null` until the
order is booked:

```json
"shipment": {
  "id": 12,
  "courier": "steadfast",
  "courier_label": "Steadfast",
  "is_sandbox": false,
  "consignment_id": "1424107",
  "tracking_code": "15BAEB8A",
  "tracking_url": "https://steadfast.com.bd/t/15BAEB8A",
  "state": "in_transit",
  "courier_status": "pending",
  "cod_amount": 115250,
  "weight_grams": 1200,
  "delivery_charge": 6000,
  "delivery_area": { "city_id": 1, "zone_id": 298 },
  "note": "Call before coming",
  "booked_by": { "id": 3, "name": "Karim" },
  "synced_at": "2026-10-11T12:00:00.000000Z",
  "finished_at": null,
  "created_at": "2026-10-11T10:30:00.000000Z"
}
```

- **`state`** is the shop's own word for where the parcel is. Use it for the
  badge:

  | `state` | Show as |
  |---|---|
  | `booked` | Booked, waiting for pickup |
  | `in_transit` | On the way |
  | `delivered` | Delivered |
  | `partly_delivered` | Partly delivered: check what came back |
  | `returned` | Returned |
  | `cancelled` | Cancelled by the courier before pickup: needs attention |

- **`courier_status`** is the courier's own word (e.g. `Assigned_for_Delivery`,
  `delivered_approval_pending`). Show it as small print beside the badge.
- **`tracking_url`** may be `null` (test parcels). Link it as "Track parcel"
  when present.
- **`delivery_charge`** (poisha) may be `null` until the courier says.
- **`synced_at`** is when the courier was last asked: "updated 5 minutes ago".
- **`is_sandbox: true`**: show a TEST badge.

Add a **Refresh from courier** button while `finished_at` is `null`:

`POST /api/v1/admin/orders/{id}/shipment/sync` (`orders.fulfil`) asks the
courier now and returns the updated order. `404` if the order has no shipment.

### On the customer's order page

`GET /api/v1/me/orders/{number}` now has `tracking`, which is `null` until the
order is shipped with a courier:

```json
"tracking": {
  "courier": "Steadfast",
  "tracking_code": "15BAEB8A",
  "tracking_url": "https://steadfast.com.bd/t/15BAEB8A"
}
```

Show "Shipped with Steadfast · tracking code 15BAEB8A" with a **Track your
parcel** link when `tracking_url` is not `null`.

---

## 9. What happens after shipping

The courier's word moves the order, without anyone pressing a button:

| Courier says | Parcel `state` | Order becomes | Payment |
|---|---|---|---|
| delivered | `delivered` | **Delivered** | Cash on delivery and unpaid → **Paid** ("Cash collected by …") |
| partly delivered | `partly_delivered` | **Delivered** | Left for staff: only part of the cash was collected |
| returned | `returned` | **Returned**, stock goes back on the shelf | unchanged |
| cancelled before pickup | `cancelled` | unchanged (still Shipped) | unchanged |
| anything else | `booked` / `in_transit` | unchanged | unchanged |

- If staff have already moved the order themselves (cancelled it, say), their
  decision stands and only the parcel's status is recorded.
- Every change is in the activity log (`system` stream): `shipment_booked`,
  `shipment_status`, and the resulting order and payment changes.
- The customer gets the usual Delivered / Shipped notifications, as with a
  manual change.

**How each courier's statuses are read:**

| | Booked | Delivered | Partly delivered | Returned | Cancelled |
|---|---|---|---|---|---|
| Steadfast | `in_review` | `delivered` | `partial_delivered` | `cancelled` (Steadfast's word for "not delivered, coming back") | none |
| Pathao | `Pending`, `Pickup_Requested`, `Assigned_for_Pickup` | `Delivered`, `Payment_Invoice` | `Partial_Delivery` | `Return`, `paid_return` | `Pickup_Cancelled` |
| RedX | `pickup-pending` | `delivered`, `paid` | none | `returned` | `cancelled` |

Steadfast's `*_approval_pending` statuses are a rider's report that Steadfast
has not confirmed yet, so they do **not** move the order. They show as
`in_transit` until Steadfast confirms.

---

## 10. Webhooks

`POST /api/v1/couriers/{courier}/webhook/{secret}`. Called by the courier's
server, **never by the frontend**.

- Each courier has its own address with its own secret, shown on the Couriers
  screen. A wrong secret gets `404`, as if the address did not exist.
- **Nothing in a webhook is believed.** Only the parcel's reference is read;
  the courier's API is then asked directly where the parcel is. None of the
  three couriers sign their webhooks in a way that can be checked (Pathao's
  signature is the same for every merchant), so this is the only safe way.
- The answer is `202 Accepted`, whether or not the parcel is known.
- Pathao's "test the address" call (`event: webhook_integration`) is answered
  with the handshake header Pathao requires, so the address can be saved in
  its panel.
- If a webhook never arrives, `shipments:sync` asks the courier every two
  hours, for up to 45 days after booking.

---

## 11. Errors

All errors use the usual `{ message, code, request_id, errors? }` shape.

| `code` | HTTP | When |
|---|---|---|
| `ORDER_NOT_SHIPPABLE` | 409 | The order isn't packed, is already booked, or is being booked right now |
| `COURIER_UNAVAILABLE` | 409 | The courier is switched off, or its keys aren't all entered |
| `COURIER_REQUEST_FAILED` | 502 | The courier refused (its reason is in `message`) or did not answer |
| `VALIDATION_FAILED` | 422 | Bad input, including switching a courier on before it's set up |

`message` is always safe to show to staff as is. It never contains a key.

---

## 12. Limits and things still to confirm

**Limits:**

- **Steadfast has no test mode and no cancel API.** Cancel a mistaken booking in
  the Steadfast panel.
- **A courier cancelling the pickup** leaves the order Shipped. It shows as
  `cancelled` on the parcel, and staff have to sort it out by hand.
- **One parcel per order.** Splitting an order across parcels is not supported.
- **Normal delivery only** for Pathao (not on-demand), and every parcel is sent
  as a "parcel", not a "document".

**Still to confirm against real accounts.** I couldn't reach the couriers'
official documentation, so endpoints and statuses came from widely used
open-source clients and Pathao's own WooCommerce plugin. The tests use
simulated courier answers. Before relying on Pathao or RedX, run one booking
with their **test keys**. These details in particular:

- Pathao's parcel status endpoint (`/aladdin/api/v1/orders/{id}/info`) and the
  field it reports the status in.
- RedX's delivery charge field (`parcel.charge`).
- The public tracking links for all three couriers.

If any of them turns out different, it is a one-line change in the courier's
client (`app/Services/Couriers/`).

**Where the code is:**

| | |
|---|---|
| Courier clients | `app/Services/Couriers/SteadfastClient.php`, `PathaoClient.php`, `RedxClient.php` |
| Booking | `app/Services/Couriers/ShipmentBooker.php` |
| Status updates | `app/Services/Couriers/ShipmentTracker.php`, `app/Jobs/SyncShipment.php`, `app/Console/Commands/SyncShipments.php` |
| Endpoints | `app/Http/Controllers/Api/V1/Admin/CourierController.php`, `ShipmentController.php`, `Couriers/CourierWebhookController.php` |
| Tests | `tests/Feature/Admin/CourierSettingsTest.php`, `ShipmentTest.php` |