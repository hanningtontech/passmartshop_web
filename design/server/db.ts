import { eq, like, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  categories,
  orders,
  orderItems,
  reviews,
  productVariants,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PRODUCTS ============

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categories).orderBy(asc(categories.displayOrder));
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getProducts(filters?: {
  categoryId?: number;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "rating";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  if (filters?.search) {
    conditions.push(
      like(products.name, `%${filters.search}%`)
    );
  }

  if (filters?.featured) {
    conditions.push(eq(products.featured, true));
  }

  if (filters?.isNew) {
    conditions.push(eq(products.isNew, true));
  }

  if (filters?.minPrice !== undefined) {
    conditions.push(gte(products.basePrice, filters.minPrice.toString()));
  }

  if (filters?.maxPrice !== undefined) {
    conditions.push(lte(products.basePrice, filters.maxPrice.toString()));
  }

  let query: any = db.select().from(products);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Sorting
  if (filters?.sortBy === "price_asc") {
    query = query.orderBy(asc(products.basePrice));
  } else if (filters?.sortBy === "price_desc") {
    query = query.orderBy(desc(products.basePrice));
  } else if (filters?.sortBy === "newest") {
    query = query.orderBy(desc(products.createdAt));
  } else if (filters?.sortBy === "rating") {
    query = query.orderBy(desc(products.rating));
  }

  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return query;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId));
}

// ============ ORDERS ============

export async function createOrder(orderData: {
  orderNumber: string;
  userId?: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  total: number;
  paymentMethod: "M-Pesa" | "Cash on Delivery";
  mpesaTransactionCode?: string;
  paymentStatus: "pending" | "awaiting_verification";
  items: Array<{
    productId: number;
    variantId?: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Skipping SQL createOrder: database not available");
    // Fall back to a generated ID so the tRPC mutation can still succeed
    // and the Firestore mirroring on the client can proceed.
    return Date.now();
  }

  const baseValues = {
    orderNumber: orderData.orderNumber,
    userId: orderData.userId,
    customerEmail: orderData.customerEmail,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    shippingAddress: orderData.shippingAddress,
    shippingCity: orderData.shippingCity,
    shippingPostalCode: orderData.shippingPostalCode,
    shippingCountry: orderData.shippingCountry,
    subtotal: orderData.subtotal.toString(),
    shippingCost: (orderData.shippingCost || 0).toString(),
    tax: (orderData.tax || 0).toString(),
    total: orderData.total.toString(),
  };

  let orderId: number;

  try {
    const result = await db.insert(orders).values({
      ...baseValues,
      paymentMethod: orderData.paymentMethod,
      mpesaTransactionCode: orderData.mpesaTransactionCode ?? null,
      paymentStatus: orderData.paymentStatus,
    });
    orderId = result[0].insertId;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isUnknownColumnOrEnum =
      /Unknown column|paymentStatus|paymentMethod|mpesaTransactionCode|invalid.*enum/i.test(msg);
    if (isUnknownColumnOrEnum) {
      const result = await db.insert(orders).values(baseValues);
      orderId = result[0].insertId;
    } else {
      throw err;
    }
  }

  for (const item of orderData.items) {
    const productId = Number(item.productId);
    await db.insert(orderItems).values({
      orderId: Number(orderId),
      productId: Number.isFinite(productId) ? productId : 0,
      variantId: item.variantId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price.toString(),
    });
  }

  return orderId;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (order.length === 0) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return {
    ...order[0],
    items,
  };
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

/** All orders (for admin). Newest first. */
export async function getAllOrders(limit = 200) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function updateOrderStatus(
  orderId: number,
  status: string,
  paymentStatus?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { status };
  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
  }

  return db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));
}

// ============ REVIEWS ============

export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(reviewData: {
  productId: number;
  userId?: number;
  customerName: string;
  rating: number;
  title?: string;
  comment?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(reviews).values({
    productId: reviewData.productId,
    userId: reviewData.userId,
    customerName: reviewData.customerName,
    rating: reviewData.rating,
    title: reviewData.title,
    comment: reviewData.comment,
  });
}
