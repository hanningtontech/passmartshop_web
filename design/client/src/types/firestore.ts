/**
 * Types aligned with Firestore collections used by the admin.
 * Categories and products are read-only from the shop.
 */

export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
  /** null for root categories; set for subcategories (tree). */
  parentId?: string | null;
  updatedAt?: unknown;
  createdAt?: unknown;
}

/** Variant (sub-product) as stored by admin: price/stock can be string or number. */
export interface FirestoreSubProduct {
  id: string;
  name: string;
  sku: string;
  price: number | string;
  stockCount: string;
  compareAtPrice?: number | string;
  images?: string[];
  description?: string;
}

export interface FirestoreProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price?: number;
  basePrice?: number;
  compareAtPrice?: number | null;
  originalPrice?: string | null;
  stockCount?: string;
  isNew?: boolean;
  featured?: boolean;
  inStock?: boolean;
  images?: string[];
  /** For search: e.g. ["wireless", "bluetooth", "portable"] */
  tags?: string[];
  /** When true, listing and detail use variant data (price, stock, description, images). */
  hasVariants?: boolean;
  subProducts?: FirestoreSubProduct[];
  /** Kilimall-style: flash sale flag and price */
  flashSale?: boolean;
  flashSalePrice?: number;
  /** Rating 0–5, review count, sold count */
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  /** Local vs overseas stock for shipping badge */
  localStock?: boolean;
  /** Key-value specs for product detail specs tab */
  specifications?: Record<string, string>;
  /** Customer reviews for product detail reviews tab */
  reviews?: Array<{
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  updatedAt?: unknown;
  createdAt?: unknown;
}
