# Passmartshop – App Documentation

Complete overview of the **Passmartshop** storefront app: features, functionality, and UI structure.

---

## 1. Overview

**Passmartshop** is a full-stack e-commerce storefront. Customers browse products and categories (from **Firebase Firestore**), add items to a cart, and place orders. The app stays in sync with a separate **admin app** that manages categories and products in the same Firebase project.

| Layer        | Stack |
|-------------|--------|
| **Frontend** | React 19, Vite 7, TypeScript, Wouter (routing), Tailwind CSS 4 |
| **UI**       | Radix UI primitives, shadcn/ui-style components, Lucide icons |
| **Data (shop)** | Firebase (Auth, Firestore) – read-only `categories` & `products` |
| **Backend**  | Express, tRPC, Drizzle ORM, MySQL (e.g. orders) |
| **State**    | React context (Cart, Theme), localStorage (cart persistence) |

---

## 2. Features & Functionality

### 2.1 Product catalog (Firestore)

- **Products** and **categories** are read from Firestore; the shop does not write to these collections.
- **Categories**: Root categories only in nav/filters; full tree used for search (category path). Fields: `name`, `slug`, `description`, `displayOrder`, `active`, `parentId`.
- **Products**: Fields include `name`, `description` (Markdown), `categoryId`, `price` / `basePrice`, `compareAtPrice` / `originalPrice`, `stockCount` / `stockQuantity`, `inStock`, `isNew`, `featured`, `images` (array of URLs), `tags`, `subProducts` (variants).

### 2.2 Home page

- **Hero**: Headline, short copy, “Shop Now” CTA.
- **Shop by category**: Grid of root categories (name only); links to `/shop?category=<slug>`.
- **Featured products**: Up to 4 products with `featured === true`.
- **New arrivals**: Up to 4 products with `isNew === true`.
- **Trust**: Fast delivery, secure payment, support, returns.
- **CTA**: Newsletter sign-up (email input + button).

### 2.3 Shop page (`/shop`)

- **Product grid**: All products from Firestore; paginated (e.g. 20 per page).
- **Filters (sidebar)**  
  - **Search**: Matches product **name**, **description**, **tags**, and **category path** (term-by-term).  
  - **Category**: Dropdown of root categories; products in that root or any subcategory are shown.  
  - **Price range (optional)**: Min/max price; **no default** – only applied when the user enters values (products above 10,000 show until the user sets a max).
- **Sort**: Newest, Price low→high, Price high→low, Top rated.
- **URL**: `/shop?category=<slug>` pre-selects category from slug.
- **Error**: If Firestore read fails, an amber banner explains Firebase project / rules.

### 2.4 Product detail page (`/product/:id`)

- **Gallery**: Main image + thumbnail strip from `product.images` (order = admin order); fallbacks for `imageUrls` / `primaryImageUrl`.
- **Info**: Name, rating (if present), price, compare-at price and discount badge, **In Stock (X available)** or Out of Stock (stock from `stockCount` / `stockQuantity`).
- **Description**: Rendered as **Markdown** (headings, lists, bold) via `react-markdown`; fallback to short description or “No description available.”
- **Variants**: If `product.subProducts` exists, a **table** (Name, SKU, Price, Stock) is shown.
- **Quantity**: Number input + − / +; **capped by available stock minus quantity already in cart** (user cannot add more than remaining stock).
- **Add to cart**: Disabled when out of stock or when `maxCanAdd <= 0`; adds at most the remaining allowed quantity. Toast confirms added count.
- **Wishlist**: Heart icon (UI only; no backend).

### 2.5 Product cards (listing & home)

- **Image**: First image from `product.images` (or fallbacks); aspect ratio ~4:5; hover zoom.
- **Badges**: Discount %, “Featured”, “NEW” when applicable.
- **Wishlist**: Heart (UI only).
- **Title**, **price**, **compare-at price**, **In Stock (X)** or Out of Stock.
- **View details**: Links to `/product/:id`; button disabled when out of stock.

### 2.6 Cart

- **Storage**: In-memory + **localStorage** (persists across sessions).
- **List**: Product image, name, unit price (KES), quantity (adjustable), line total, remove.
- **Summary**: Subtotal, link to checkout; optional “Clear cart”.
- **Empty state**: Message + “Continue Shopping” to `/shop`.

### 2.7 Checkout

- **Form**: Customer name, email, phone; shipping address (address, city, postal code, country).
- **Order creation**: Sent to backend via **tRPC** (`orders.create`) with line items (productId, name, quantity, price); tax and shipping logic (e.g. 10% tax, free shipping over threshold).
- **Success**: Confirmation message, order ID, cart cleared; toast notification.
- **Errors**: Toasts on failure; form remains editable.

### 2.8 Static & policy pages

- **About** (`/about`): Brand story and values.
- **Contact** (`/contact`): Contact form / info.
- **Privacy Policy** (`/privacy-policy`).
- **Terms & Conditions** (`/terms`).
- **Refund Policy** (`/refund-policy`).
- **Shipping Policy** (`/shipping-policy`).
- **404** (`/404` or fallback): “Not found” + link back.

---

## 3. UI Structure & Layout

### 3.1 Global layout

- **Announcement bar**: Orange strip – e.g. “We Deliver Countrywide! Free shipping on orders over $50”.
- **Header (sticky)**  
  - Logo “PS” / “Passmartshop” → `/`.  
  - **Search** (desktop): Input + search button; submit → `/shop?search=<query>`.  
  - **Cart**: Icon + badge (total item count); link to `/cart`.  
  - **Mobile**: Hamburger opens nav + search; same links.
- **Nav links**: Home, Shop, About Us, Contact.
- **Main**: Full-width content area; each route renders its page.
- **Footer**  
  - About Passmartshop, Quick links (Shop, About, Contact, Track Order), Policies (Privacy, Terms, Refund, Shipping), Contact (phone, email, address).  
  - Social (Facebook, Twitter, Instagram), copyright.

### 3.2 Theming & styling

- **Tailwind CSS 4**: Utility-first; `@theme` in `index.css` for radii and semantic colors (e.g. `background`, `foreground`, `primary`, `muted`, `destructive`).
- **ThemeProvider**: Optional light/dark (e.g. `defaultTheme="light"`); `next-themes`-style support.
- **Primary accent**: Orange (`orange-500` / `orange-600`) for CTAs, links, highlights.
- **Neutrals**: White, slate, gray for backgrounds and text.
- **Components**: Buttons, inputs, cards, selects, dialogs, etc. from `components/ui` (Radix-based, consistent tokens).

### 3.3 Responsive behavior

- **Breakpoints**: Tailwind defaults (sm, md, lg, xl).
- **Header**: Search and nav collapse into mobile menu on small screens; cart always visible.
- **Shop**: Filters in sidebar on desktop; “Filters” toggle + overlay/sheet on mobile.
- **Product grid**: 2–5 columns by breakpoint (e.g. 2 on mobile, 5 on xl).
- **Footer**: Single column on mobile; multi-column on md+.

### 3.4 Key components

| Component       | Role |
|----------------|------|
| **Layout**     | Announcement, header, nav, footer, main slot. |
| **ProductCard**| Product thumbnail, badges, price, stock, CTA. |
| **ProgressiveImage** | Image with optional low-res placeholder. |
| **ErrorBoundary** | Catches React errors; prevents full-app crash. |
| **ThemeContext**  | Theme state for app. |
| **CartContext**   | Cart items, add/remove/update, totals, persistence. |

---

## 4. Data & Backend

### 4.1 Firebase (client)

- **Config**: From env (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.).
- **Firestore**: `db` used to read `categories` and `products`; no writes from the shop.
- **Auth**: `auth` exported for future use (e.g. login).

### 4.2 Types (Firestore)

- **FirestoreCategory**: `id`, `name`, `slug`, `description`, `displayOrder`, `active`, `parentId`, timestamps.
- **FirestoreProduct**: `id`, `name`, `description`, `categoryId`, pricing fields, `stockCount`, `inStock`, `images`, `tags`, `subProducts`, timestamps.
- **FirestoreSubProduct**: `id`, `name`, `sku`, `price`, `stockCount`.

### 4.3 Server (Express + tRPC)

- **Orders**: e.g. `orders.create` mutation for checkout (customer + shipping + line items).
- **DB**: Drizzle ORM (e.g. MySQL) for orders and related data.
- **Scripts**: `seed:firestore`, `seed:new-firestore` for seeding Firestore (categories/products).

---

## 5. Routes Summary

| Path | Page | Purpose |
|------|------|--------|
| `/` | Home | Hero, categories, featured, new arrivals, CTA |
| `/shop` | Shop | Product grid, filters, sort, pagination |
| `/product/:id` | ProductDetail | Gallery, description (Markdown), variants, quantity, add to cart |
| `/cart` | Cart | Cart list, quantity edit, remove, subtotal, checkout link |
| `/checkout` | Checkout | Customer + shipping form, place order (tRPC) |
| `/about` | About | About the brand |
| `/contact` | Contact | Contact info / form |
| `/privacy-policy` | PrivacyPolicy | Privacy policy |
| `/terms` | Terms | Terms & conditions |
| `/refund-policy` | RefundPolicy | Refund policy |
| `/shipping-policy` | ShippingPolicy | Shipping policy |
| `/404` | NotFound | 404 fallback |

---

## 6. Scripts & Environment

- **`pnpm dev`**: Start dev server (Vite + Express watch).
- **`pnpm build`**: Vite build + esbuild server bundle.
- **`pnpm start`**: Run production server.
- **`pnpm check`**: TypeScript check.
- **`pnpm test`**: Vitest.
- **`pnpm seed:firestore`** / **`pnpm seed:new-firestore`**: Seed Firestore.

**Environment**: `.env` (and optionally `.env.example`) with Firebase client vars (`VITE_FIREBASE_*`) and any server/DB vars. The shop must use the **same Firebase project** as the admin so products and categories appear correctly.

---

## 7. Sync with admin (USER_WEB_UPDATE_PROMPT / SHOP_UPDATE_GUIDE)

The storefront is designed to align with the admin app and the guides in the repo:

- **Firebase**: Same project; read-only `categories` and `products`.
- **Categories**: Root-only in filters; full path for search; `displayOrder`, `active`, `slug`, `parentId`.
- **Products**: All listed fields; description as Markdown; images from `product.images` only; variants (`subProducts`) as table; stock count shown and used to cap add-to-cart.
- **Search**: Name, description, tags, category path; no default price filter so products above 10,000 show until the user sets filters.

For the full, copy-paste spec (Firestore fields, store behaviour, images, variants, tags), see **`USER_WEB_UPDATE_PROMPT.md`** (in the admin repo). For a user-facing guide (variants, search, tags, checklist), see **`SHOP_UPDATE_GUIDE.md`**.
