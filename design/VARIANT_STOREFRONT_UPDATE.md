# Variant support – Storefront update

This document describes how the storefront handles **product variants** (`subProducts`) and how the cart and checkout require and store variant selection.

---

## 1. Product variants (subProducts)

Products can have a **`subProducts`** array (from the admin). Each variant has:

| Field         | Type    | Use |
|---------------|---------|-----|
| `id`          | string  | Unique variant id; used in cart and orders. |
| `name`        | string  | Display name (e.g. "500ml", "Blue"). |
| `sku`         | string  | Optional SKU. |
| `price`       | number  | Price for this variant. |
| `stockCount`  | string  | Optional stock display. |
| `stockQuantity` | number | Optional numeric stock. |

When a product has at least one variant, the storefront **requires the user to select a variant** before adding to cart.

---

## 2. Product detail page

- **Variant selector:** If the product has `subProducts`, a "Choose variant" section shows each variant as a selectable card (name, SKU, price, stock). The user must select one.
- **Price and stock:** When a variant is selected, the displayed price and stock come from that variant.
- **Add to Cart / Buy Now:** Disabled until a variant is selected (when the product has variants). On add, the cart receives the product plus `variantId`, `variantName`, `variantSku`, and the variant’s `price` as `basePrice`.

---

## 3. Cart

- **Cart item identity:** For products with variants, a line item is identified by `(productId, variantId)`. The same product with different variants appears as separate lines.
- **Cart item fields:** Each item may include optional `variantId`, `variantName`, `variantSku`. The cart UI shows variant name and SKU under the product name when present.
- **Quantity and remove:** Update/remove use `(productId, variantId)` so the correct line is updated or removed.

---

## 4. Product cards (shop grid)

- If a product has **variants** (`subProducts.length > 0`), the hover quick-add shows **"Choose variant"** and links to the product page instead of adding to cart. This forces variant selection on the detail page.
- Products without variants still show **"Add to Cart"** and add directly.

---

## 5. Checkout and orders

- **Order items** include:
  - `productName`: When a variant is selected, stored as `"Product Name (Variant Name)"` so the full description is visible.
  - Optional `variantId`, `variantName`, `variantSku` are sent in the payload and stored in the Firestore order mirror so the admin can see which variant was ordered.
- Backend (tRPC `orders.create`) receives `productName` (with variant in parentheses when applicable), `quantity`, `price`; optional variant fields can be added to the API/schema if the backend needs to store them explicitly.

---

## 6. Admin alignment

Ensure the admin:

1. Saves **`subProducts`** on the product with at least `id`, `name`, and preferably `price`, `sku`, `stockCount` or `stockQuantity`.
2. Uses the same variant `id` format (string) so the storefront and orders stay consistent.

The storefront reads `subProducts` from the product document and does not use a separate collection for variants.
