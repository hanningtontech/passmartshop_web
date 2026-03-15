# Admin Update Guide – Storefront Changes

This document describes **Firestore fields and behavior** added or used by the Passmartshop storefront so the **admin app** can support them when creating and editing products and categories.

---

## 1. Summary of storefront updates

The storefront now uses:

- **Product tags** from Firestore for the header tag chips (no static list).
- **Shipping/source badge** on product cards: “Local Stock” vs “Ships from Overseas” from a real field.
- **Flash sale** section and product flags.
- **Ratings, review count, sold count** on cards and detail.
- **Specifications** and **reviews** on the product detail page (tabs).
- **Category slug** for URLs and breadcrumbs.

All new fields are **optional**. The shop hides or falls back when they are missing.

---

## 2. Categories

| Field        | Type    | Required | Storefront use |
|-------------|---------|----------|----------------|
| `name`      | string  | Yes      | Display name in nav, filters, breadcrumbs. |
| `slug`      | string  | Yes      | URLs: `/shop?category=<slug>`, product breadcrumb links. Must be unique and URL-safe. |
| `description` | string | No   | For future use. |
| `displayOrder` | number | No   | Order in nav/filters. |
| `active`    | boolean | No   | Filter inactive categories if needed. |
| `parentId`  | string \| null | No | Root categories: `null`. Subcategories: parent category ID. |

**Admin:** Ensure every category has a **slug** (e.g. `electronics`, `home-appliances`). Slug is used in shop URLs and product detail breadcrumbs.

---

## 3. Products – core fields (unchanged)

| Field          | Type    | Storefront use |
|----------------|---------|----------------|
| `name`         | string  | Title everywhere. |
| `description`  | string  | Product detail; Markdown supported. |
| `shortDescription` | string | No | Optional teaser. |
| `categoryId`   | string  | Category assignment; breadcrumb; “You may also like”. |
| `price` / `basePrice` | number | Main price. |
| `compareAtPrice` / `originalPrice` | number / string | Compare-at price; discount badge. |
| `stockCount` / `stockQuantity` | string / number | Stock display; “In Stock (X available)”. |
| `inStock`      | boolean | In-stock vs out-of-stock. |
| `images`       | string[] | Image URLs; order = display order. |
| `isNew`        | boolean | “NEW” badge. |
| `featured`     | boolean | Featured sections. |
| `subProducts`  | array   | Variants table on product detail. |
| `tags`         | string[] | **Important:** Used for search and **header tag chips**. |

---

## 4. Products – shipping / source (real “shipped” option)

The storefront shows a **shipping/source badge** on each product card and uses a single Firestore field.

| Field         | Type    | Storefront use |
|--------------|---------|----------------|
| **`localStock`** | boolean | **When `true`:** green badge “Local Stock”. **When `false` or missing:** gray badge “Ships from Overseas”. |

This is the **real** option: it comes from Firestore, not hardcoded. The admin must be able to set it when uploading or editing a product.

**Admin UI suggestion:**

- Add a control when creating/editing a product, e.g.:
  - **“Stock location”** or **“Shipping source”**:  
    - **Local stock** → save `localStock: true`  
    - **Ships from overseas** → save `localStock: false` (or omit the field)
- Persist this field in the product document so the storefront can show the correct badge.

---

## 5. Products – tags (header chips)

| Field  | Type     | Storefront use |
|--------|----------|----------------|
| `tags` | string[] | Search; **header tag chips** are built from **all unique tags** across products (from a sample of the catalog). |

**Admin:** When uploading/editing a product, allow adding **tags** (e.g. “Ramtons”, “Vacuum Cleaner”, “RM/553”). Each tag should be a string; store as an array of strings. The storefront shows these as clickable chips that search for that term.

---

## 6. Products – flash sale

| Field            | Type    | Storefront use |
|------------------|---------|----------------|
| `flashSale`      | boolean | When `true`, product appears on Flash Sale page and in flash sale sections. |
| `flashSalePrice` | number  | Price shown during flash sale (e.g. discounted). |

**Admin:** Add checkboxes/toggles for “On flash sale” and a field for “Flash sale price” when enabled.

---

## 7. Products – ratings and social proof

| Field         | Type   | Storefront use |
|---------------|--------|----------------|
| `rating`      | number | 0–5; stars on card and product detail. |
| `reviewCount` | number | Shown next to rating, e.g. “(12)”. |
| `soldCount`   | number | e.g. “2k sold” / “X sold” on card. |

**Admin:** Optional numeric fields for rating, review count, and sold count (can be manual or synced from another system later).

---

## 8. Products – specifications and reviews (product detail tabs)

| Field            | Type   | Storefront use |
|------------------|--------|----------------|
| `specifications` | object | Key-value map, e.g. `{ "Weight": "2.5 kg", "Color": "Black" }`. Shown in **Specifications** tab as a table. |
| `reviews`        | array  | List of review objects. Shown in **Reviews** tab. |

**Review object shape:**

```ts
{
  author: string;
  rating: number;   // 0–5
  comment: string;
  date: string;     // e.g. "2025-01-15"
}
```

**Admin:** Optional “Specifications” (key/value pairs) and “Reviews” (list of author, rating, comment, date) when editing a product. If missing, the storefront shows “No specifications available” and “No reviews yet”.

---

## 9. Quick checklist for admin

When updating the admin app, ensure it can:

1. **Categories**
   - Set and edit **slug** for every category (used in URLs and breadcrumbs).

2. **Products – shipping**
   - Set **`localStock`** (true = “Local Stock”, false/omit = “Ships from Overseas”) so the shipping badge is real.

3. **Products – tags**
   - Manage **`tags`** (string array) so header chips and search use real catalog tags.

4. **Products – optional**
   - **Flash sale:** `flashSale` (boolean), `flashSalePrice` (number).
   - **Social proof:** `rating`, `reviewCount`, `soldCount`.
   - **Detail tabs:** `specifications` (object), `reviews` (array of `{ author, rating, comment, date }`).

All of the above are optional except slug (for categories) and the need to support `localStock` and `tags` if you want the new storefront behavior (real shipping badge and real tag chips). The storefront already reads these fields; the admin only needs to expose them when creating/editing documents.

---

## 10. Orders – payment method and status (backend/DB)

**Important: orders are stored in MySQL, not Firestore.** You do **not** need to create any Firestore collection for orders. The storefront calls the backend tRPC `orders.create`, which writes to the **MySQL** `orders` and `orderItems` tables. If orders are not being created, ensure MySQL is set up and migrations have been run (see below).

Checkout now supports **M-Pesa** and **Cash on Delivery**. Orders created from the storefront include:

| Field | Type | Use |
|-------|------|-----|
| `paymentMethod` | `'M-Pesa'` \| `'Cash on Delivery'` | How the customer chose to pay. |
| `mpesaTransactionCode` | string (optional) | Filled when payment method is M-Pesa; from customer’s M-Pesa confirmation SMS. |
| `paymentStatus` | enum | `pending` (CoD), `awaiting_verification` (M-Pesa), then `completed` / `failed` / `refunded` as you process. |

- **M-Pesa:** Customer enters the M-Pesa transaction code at checkout. Order is stored with `paymentStatus: awaiting_verification`. Admin should verify the payment against the Till/Paybill (0740730781) and then set `paymentStatus` to `completed` or `failed`.
- **Cash on Delivery:** No code; order is stored with `paymentStatus: pending`. Mark as `completed` when cash is collected on delivery.

The storefront sends these fields via the `orders.create` tRPC mutation. Ensure the backend/DB schema has columns for `paymentMethod`, `mpesaTransactionCode`, and an extended `paymentStatus` enum (e.g. `pending`, `awaiting_verification`, `completed`, `failed`, `refunded`).

**Order reference number**

- All new orders use the prefix **PSM** (e.g. `PSM-1773489579631-PNEN6IMRX`). Format: `PSM-<timestamp ms>-<9 random chars>`.

**Shipping (delivery area)**

- **Free:** Nairobi and Thika (customer selects from dropdown).
- **Outside Nairobi & Thika:** KSh 200 or more (by location/parcel company). Customer selects “Other” and enters city/town.
- Orders store `shippingCity` (Nairobi, Thika, or the entered city). For future auto-detection of Nairobi/Thika from a typed address, integrate a Maps/Geocoding API and check if the result falls within those areas.

**Loading orders in the admin (MySQL only)**

Orders live in MySQL. Use tRPC to load them:

1. **List all orders (admin only)**  
   - **tRPC:** `trpc.orders.list.useQuery()` or `trpc.orders.list.query({ limit: 200 })`. Requires an authenticated admin user. Returns an array of orders, newest first, with fields such as `id`, `orderNumber`, `customerName`, `customerEmail`, `total`, `status`, `paymentMethod`, `paymentStatus`, `mpesaTransactionCode`, `createdAt`, etc.

2. **Single order with line items**  
   - **tRPC:** `trpc.orders.getById.query({ id: orderId })`. Returns the order plus an `items` array (product name, quantity, price, etc.). Use for “Track order” and for the admin order detail page.

To update payment status (e.g. after verifying M-Pesa or marking CoD paid), use the `orders.updateStatus` tRPC mutation (MySQL).

**If orders are not being created**

1. **No Firestore setup needed for orders** – orders are not stored in Firestore.
2. **MySQL must be running** and the `orders` / `orderItems` tables must exist. Follow **MIGRATION_SETUP.md** in the `design` folder:
   - Start MySQL (e.g. from Services or XAMPP).
   - In `design/.env`, set `DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/passmartshop` (create the `passmartshop` database in MySQL if needed).
   - From the `design` folder run: `pnpm run db:migrate` (or apply the manual SQL from `drizzle/APPLY_PAYMENT_COLUMNS_MANUAL.sql` and the base schema if the tables don’t exist yet).
3. Restart the backend after setting `DATABASE_URL` so it can connect to MySQL. Then place a test order from the storefront; it should create a row in MySQL.

---

## 11. Do we need to seed anything in Firestore?

**You don’t have to.** The storefront works with empty categories and products (empty shop, no tag chips). Data can come entirely from the admin when you create categories and products.

**If you use the existing seed script** (`design/scripts/seedFirestore.ts`):

- It already seeds **categories** (with `slug`) and **products** (with `tags`, `price`, `images`, etc.).
- It has been updated to also set:
  - **`localStock`** on some products (so the “Local Stock” / “Ships from Overseas” badge is real from day one).
  - **`images`** (same as `imageUrls`) and **`stockCount`** (string) for storefront compatibility.
  - **`flashSale`**, **`flashSalePrice`**, **`soldCount`** on a few sample products so the flash sale page and “X sold” badges have data.

**When to run the seed:**

- **New project:** Run the seed once to get sample categories and products (set `GOOGLE_APPLICATION_CREDENTIALS` and `B2_BASE_URL` first).
- **Existing project:** Re-running with `merge: true` updates existing docs and adds new fields (e.g. `localStock`) without wiping data. You can also skip seeding and manage everything from the admin.

**Optional seed-only fields:** `specifications` and `reviews` are not in the seed; add them in the admin when editing products if you want the product detail tabs populated.

---

## 12. Firestore security

No change required for these fields: the storefront only **reads** `categories` and `products`. The admin continues to write with its existing rules; ensure new fields are allowed in your admin write rules if you use strict validation.
