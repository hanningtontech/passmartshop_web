/**
 * Variant (sub-product) type aligned with admin Firestore.
 * price/stockCount can be string or number from Firestore.
 */
export type Variant = {
  id: string;
  name: string;
  sku?: string;
  price?: number | string;
  stockCount?: number | string;
  compareAtPrice?: number | string;
  images?: string[];
  description?: string;
};

/** Base product shape used by listing and detail. */
export type ProductWithVariants = {
  description?: string;
  price?: number;
  basePrice?: number | string;
  stockCount?: number | string;
  compareAtPrice?: number | null;
  originalPrice?: string | null;
  images?: string[];
  imageUrls?: string[];
  primaryImageUrl?: string;
  hasVariants?: boolean;
  subProducts?: Variant[];
};

/** Primary variant when no specific variant is selected (e.g. first variant). */
export function getPrimaryVariant(p: ProductWithVariants): Variant | undefined {
  if (!p.hasVariants || !Array.isArray(p.subProducts) || p.subProducts.length === 0) {
    return undefined;
  }
  return p.subProducts[0];
}

/** Display price: from selected/primary variant, else product basePrice/price. */
export function getDisplayPrice(p: ProductWithVariants, selected?: Variant | null): number {
  const v = selected ?? getPrimaryVariant(p);
  if (v && v.price !== undefined && v.price !== "") {
    const n = Number(v.price);
    if (!Number.isNaN(n)) return n;
  }
  if (typeof p.basePrice === "number" && !Number.isNaN(p.basePrice)) return p.basePrice;
  if (typeof p.basePrice === "string") {
    const n = parseFloat(p.basePrice);
    if (!Number.isNaN(n)) return n;
  }
  if (typeof p.price === "number" && !Number.isNaN(p.price)) return p.price;
  return 0;
}

/** Display stock: from selected/primary variant, else product stockCount. */
export function getDisplayStock(
  p: ProductWithVariants,
  selected?: Variant | null
): number | undefined {
  const v = selected ?? getPrimaryVariant(p);
  if (v && v.stockCount !== undefined && v.stockCount !== "") {
    const n = Number(v.stockCount);
    if (!Number.isNaN(n)) return n;
  }
  if (p.stockCount !== undefined && p.stockCount !== "") {
    const n = Number(p.stockCount);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/** Display description: variant description if present, else product description. */
export function getDisplayDescription(
  p: ProductWithVariants,
  selected?: Variant | null
): string {
  const v = selected ?? getPrimaryVariant(p);
  if (v?.description && String(v.description).trim()) return String(v.description).trim();
  return p.description ?? "";
}

/** Thumbnail image: variant images first, then product images. */
export function getThumbnail(p: ProductWithVariants, selected?: Variant | null): string | undefined {
  const v = selected ?? getPrimaryVariant(p);
  if (v?.images && v.images.length > 0) return v.images[0];
  if (p.images && p.images.length > 0) return p.images[0];
  if (p.imageUrls && p.imageUrls.length > 0) return p.imageUrls[0];
  if (p.primaryImageUrl) return p.primaryImageUrl;
  return undefined;
}

/** Compare-at (original) price for display: variant first, then product. */
export function getDisplayCompareAtPrice(
  p: ProductWithVariants,
  selected?: Variant | null
): number | null {
  const v = selected ?? getPrimaryVariant(p);
  if (v?.compareAtPrice !== undefined && v.compareAtPrice !== "") {
    const n = Number(v.compareAtPrice);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  if (p.compareAtPrice != null) {
    const n = Number(p.compareAtPrice);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  if (p.originalPrice) {
    const n = parseFloat(p.originalPrice);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

/** Gallery images: selected variant images if any, else product images. */
export function getDisplayImages(
  p: ProductWithVariants,
  selected?: Variant | null
): string[] {
  const v = selected ?? getPrimaryVariant(p);
  if (v?.images && v.images.length > 0) return v.images.filter(Boolean);
  if (p.images && p.images.length > 0) return p.images;
  if (p.imageUrls && p.imageUrls.length > 0) return p.imageUrls;
  if (p.primaryImageUrl) return [p.primaryImageUrl];
  return [];
}
