# Storefront: Writing Orders to Firestore for Admin

The storefront writes each new order to **Firestore** (collection `orders`) in addition to the backend (MySQL) so the admin panel can list and manage orders.

## When it runs

After checkout succeeds (tRPC `orders.create` returns), the client calls:

```ts
addDoc(collection(db, "orders"), orderData);
```

The storefront uses the same Firebase app as the rest of the app (e.g. `design/client/src/lib/firebase.ts`). **Use the same Firebase project in the storefront as in the admin** (project `passmartshop`) so the admin sees the same `orders` collection.

## Document shape (Firestore `orders`)

Each document should have at least:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderNumber` | string | No | e.g. `PSM-1773489579631-PNEN6IMRX`. |
| `customerName` | string | No | |
| `customerEmail` | string | No | |
| `customerPhone` | string | No | |
| `shippingAddress` | string | No | |
| `total` | number | **Yes** | Order total. |
| `paymentMethod` | `"M-Pesa"` \| `"Cash on Delivery"` | **Yes** | |
| `paymentStatus` | string | **Yes** | `"awaiting_verification"` (M-Pesa) or `"pending"` (CoD). |
| `mpesaTransactionCode` | string \| null | No | Set when payment method is M-Pesa. |
| `items` | array | **Yes** | `{ productId?, productName, quantity, price }[]` — admin also accepts `name` instead of `productName`. |
| `createdAt` | Firestore Timestamp | No | `serverTimestamp()` recommended. |
| `updatedAt` | Firestore Timestamp | No | `serverTimestamp()` recommended. |

Optional (admin may use for display): `orderId`, `currency`, `shippingCity`, `shippingPostalCode`, `shippingCountry`, `subtotal`, `shippingCost`, `tax`, `status`.

The admin lists orders by **Order**, **Customer** (name/email/phone), **Total**, **Payment method**, **Payment status**, and shows full details (including line items) on the order detail page. Item product name is shown from `item.name` or `item.productName`.

## If orders still don’t show in admin

1. **Same Firebase project** – Storefront must use the same Firebase config as the admin (same `projectId`: `passmartshop`).
2. **Firestore rules** – In Firebase Console → Firestore → Rules, allow read/write on `orders` (e.g. `match /orders/{doc} { allow read, write: if true; }` for dev).
3. **Check the console** – If the Firestore write fails, the storefront may log an error; fix permissions or network so the write succeeds.

Orders are still created in **MySQL** via the backend; the Firestore write is a mirror so the admin (which reads only from Firestore) can display and manage them.
