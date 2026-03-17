import { useState, useEffect, useRef } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  MessageCircle,
  Share2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { buildSrcSet, formatCurrency, getLowQualityImageUrl } from "@/lib/imageUtils";
import {
  getDisplayCompareAtPrice,
  getDisplayDescription,
  getDisplayImages,
  getDisplayPrice,
  getDisplayStock,
  getPrimaryVariant,
  type Variant,
} from "@/lib/productUtils";
import { useCart } from "@/contexts/CartContext";
import { useBehavior } from "@/contexts/BehaviorContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ProductCard from "@/components/ProductCard";

export default function ProductDetail() {
  const [match, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const { addToCart, items: cartItems } = useCart();
  const { recordProductView, getViewedCategoryIds } = useBehavior();
  const { user, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categoryMeta, setCategoryMeta] = useState<{ name: string; slug?: string } | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Array<{ id: string; productId: string; rating: number; comment?: string; authorName: string; createdAt: any }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", displayName: "", postAnonymously: true });
  const [imageZoom, setImageZoom] = useState({ active: false, originX: 50, originY: 50 });
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  const productId = params?.id ?? null;

  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");
  const reviewsRef = useRef<HTMLDivElement | null>(null);

  // Whenever the product changes (or route id changes), set primary variant id
  // so that variant-based products always show a concrete price and state by default.
  useEffect(() => {
    if (product?.subProducts && product.subProducts.length > 0) {
      const primary = getPrimaryVariant(product);
      setSelectedVariantId((prevId) => {
        if (prevId && product.subProducts.some((sp: Variant) => String(sp.id) === String(prevId)))
          return prevId;
        return primary?.id;
      });
      setSelectedImageIndex(0);
      setQuantity(1);
    } else {
      setSelectedVariantId(undefined);
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [productId, product?.subProducts]);

  const selectedVariant: Variant | undefined =
    product?.hasVariants && Array.isArray(product.subProducts) && product.subProducts.length > 0
      ? product.subProducts.find((sp: Variant) => String(sp.id) === String(selectedVariantId)) ??
        getPrimaryVariant(product)
      : undefined;

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImageZoom({ active: true, originX: x, originY: y });
  };
  const handleImageMouseLeave = () => setImageZoom((z) => ({ ...z, active: false }));

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDoc(doc(db, "products", productId))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        } else {
          setProduct(null);
        }
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Record product view for behavior (tags + You may also like)
  useEffect(() => {
    if (product?.id) {
      recordProductView(String(product.id), product.categoryId ?? null);
    }
  }, [product?.id, product?.categoryId, recordProductView]);

  // Fetch category for breadcrumb
  useEffect(() => {
    if (!product?.categoryId) {
      setCategoryMeta(null);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "categories", product.categoryId))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        setCategoryMeta({ name: d?.name ?? "", slug: d?.slug ?? snap.id });
      })
      .catch(() => setCategoryMeta(null));
    return () => { cancelled = true; };
  }, [product?.categoryId]);

  // Fetch related products for "You May Also Like"
  // Primary signal: overlapping tags with this product.
  // Fallback: same category when tags are missing.
  useEffect(() => {
    if (!product?.id) {
      setRelatedProducts([]);
      return;
    }
    const productTags: string[] = Array.isArray(product.tags)
      ? (product.tags as string[]).map((t) => String(t).toLowerCase())
      : [];
    const hasTags = productTags.length > 0;

    // Fetch a small pool of candidates: same category first.
    const q = product.categoryId
      ? query(
          collection(db, "products"),
          where("categoryId", "==", product.categoryId),
          limit(30)
        )
      : query(collection(db, "products"), limit(30));

    getDocs(q)
      .then((snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => String(p.id) !== String(product.id));

        let scored: Array<{ p: any; score: number }> = [];
        if (hasTags) {
          for (const p of all) {
            const tags: string[] = Array.isArray(p.tags)
              ? (p.tags as string[]).map((t) => String(t).toLowerCase())
              : [];
            const overlap = tags.filter((t) => productTags.includes(t));
            if (overlap.length === 0) continue;
            scored.push({ p, score: overlap.length });
          }
          // If no tag matches, fall back to category-based list
          if (scored.length === 0) {
            scored = all.map((p) => ({ p, score: 1 }));
          }
        } else {
          scored = all.map((p) => ({ p, score: 1 }));
        }

        scored.sort((a, b) => b.score - a.score);
        setRelatedProducts(scored.slice(0, 8).map((s) => s.p));
      })
      .catch(() => setRelatedProducts([]));
  }, [product?.id, product?.categoryId, product?.tags, getViewedCategoryIds]);

  // Fetch reviews for this product (Firestore `reviews` collection)
  useEffect(() => {
    if (!productId) {
      setReviews([]);
      return;
    }
    setReviewsLoading(true);
    getDocs(query(collection(db, "reviews"), where("productId", "==", productId)))
      .then((snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          const authorName =
            (data.username as string | undefined) ??
            (data.authorName as string | undefined) ??
            "Anonymous";
          return {
            id: d.id,
            productId: data.productId ?? "",
            rating: typeof data.rating === "number" ? data.rating : 0,
            comment: data.comment ?? "",
            authorName,
            createdAt: data.createdAt,
          };
        });
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [productId]);

  const displayStock = product ? getDisplayStock(product, selectedVariant) : undefined;
  const availableStock: number | null = product
    ? (() => {
        if (displayStock !== undefined && !Number.isNaN(displayStock)) return displayStock;
        const sq = product.stockQuantity;
        const sc = product.stockCount;
        if (typeof sq === "number" && Number.isFinite(sq) && sq >= 0) return sq;
        if (sc != null) {
          const n = parseInt(String(sc), 10);
          if (!Number.isNaN(n) && n >= 0) return n;
        }
        return null;
      })()
    : null;
  const inCartQty = product
    ? (cartItems || []).reduce((sum, i) => {
        if (String(i.id) !== String(product.id)) return sum;
        if (product.subProducts?.length > 0 && selectedVariant) {
          return i.variantId === selectedVariant.id ? sum + i.quantity : sum;
        }
        return (i.variantId == null || i.variantId === "") ? sum + i.quantity : sum;
      }, 0)
    : 0;
  const maxCanAdd = availableStock != null ? Math.max(0, availableStock - inCartQty) : null;

  // Clamp quantity when maxCanAdd drops (e.g. after adding to cart) – must run every render (no conditional hooks)
  useEffect(() => {
    if (maxCanAdd != null && quantity > maxCanAdd) setQuantity(maxCanAdd);
  }, [maxCanAdd, quantity]);

  if (!match || !productId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">Product not found</p>
        <Button onClick={() => setLocation("/shop")} className="mt-4">
          Back to Shop
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-96 w-full mb-8" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">Product not found</p>
        <Button onClick={() => setLocation("/shop")} className="mt-4">
          Back to Shop
        </Button>
      </div>
    );
  }

  const basePrice = getDisplayPrice(product, selectedVariant);
  const originalPrice =
    getDisplayCompareAtPrice(product, selectedVariant) ??
    (product.compareAtPrice != null
      ? Number(product.compareAtPrice)
      : product.originalPrice
        ? parseFloat(product.originalPrice)
        : null);
  const discount =
    originalPrice != null
      ? Math.round(((originalPrice - basePrice) / originalPrice) * 100)
      : 0;

  // Rating from reviews (Firestore) or fallback to product fields
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      : (product.rating != null ? Number(product.rating) : 0);
  const displayRating = reviewCount > 0 ? averageRating : (product.rating ?? 0);
  const displayReviewCount = reviewCount > 0 ? reviewCount : (product.reviewCount ?? 0);

  const hasVariants =
    product.hasVariants === true || (product.subProducts?.length ?? 0) > 0;
  const images: string[] = getDisplayImages(product, selectedVariant);
  const displayDescription = getDisplayDescription(product, selectedVariant);
  const imagesLowExplicit =
    product.imagesLow?.length > 0
      ? product.imagesLow
      : product.imageUrlsLow?.length > 0
      ? product.imageUrlsLow
      : product.primaryImageUrlLow
      ? [product.primaryImageUrlLow]
      : [];
  const displayImage = images[selectedImageIndex] ?? null;
  const displayImageLow =
    imagesLowExplicit[selectedImageIndex] ??
    (displayImage ? getLowQualityImageUrl(displayImage) : null);
  const getImageLow = (img: string, idx: number) =>
    imagesLowExplicit[idx] ?? getLowQualityImageUrl(img);
  const hasMultipleImages = images.length > 1;
  const goPrevImage = () => {
    if (!hasMultipleImages) return;
    setSelectedImageIndex((i) => (i - 1 + images.length) % images.length);
  };
  const goNextImage = () => {
    if (!hasMultipleImages) return;
    setSelectedImageIndex((i) => (i + 1) % images.length);
  };

  const canAddToCart = !hasVariants || selectedVariant != null;
  const imagesForCart: string[] = Array.isArray(images)
    ? images.filter(Boolean)
    : [];

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    const toAdd = maxCanAdd != null ? Math.min(quantity, maxCanAdd) : quantity;
    if (toAdd <= 0) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        basePrice: String(basePrice),
        images: imagesForCart,
        ...(selectedVariant && {
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          variantSku: selectedVariant.sku,
        }),
      },
      toAdd
    );
    toast.success(`Added ${toAdd} item(s) to cart`);
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    const toAdd = maxCanAdd != null ? Math.min(quantity, maxCanAdd) : quantity;
    if (toAdd <= 0) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        basePrice: String(basePrice),
        images: imagesForCart,
        ...(selectedVariant && {
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          variantSku: selectedVariant.sku,
        }),
      },
      toAdd
    );
    setLocation("/checkout");
  };

  const handleSubmitReview = async () => {
    if (!productId || reviewSubmitting) return;
    const rating = Math.min(5, Math.max(1, Math.round(reviewForm.rating)));
    const trimmedName = reviewForm.displayName.trim();
    const resolvedNameFromForm = trimmedName || profile?.username || profile?.displayName || "";
    const shouldBeAnonymous = reviewForm.postAnonymously || !resolvedNameFromForm;
    const username =
      !shouldBeAnonymous && profile?.username
        ? profile.username
        : !shouldBeAnonymous && trimmedName
        ? trimmedName
        : undefined;
    const authorName = shouldBeAnonymous
      ? "Anonymous"
      : username ?? "Anonymous";
    setReviewSubmitting(true);
    try {
      // 1) Save the review (this is the primary action)
      await addDoc(collection(db, "reviews"), {
        productId,
        rating,
        comment: (reviewForm.comment ?? "").trim().slice(0, 2000),
        authorName,
        username: username ?? null,
        userId: user?.uid ?? null,
        createdAt: serverTimestamp(),
      });

      // 2) Refresh local reviews list
      const snap = await getDocs(
        query(collection(db, "reviews"), where("productId", "==", productId))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        rating: number;
        comment?: string;
        authorName?: string;
        createdAt: any;
      }>;
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      const count = list.length;
      const avg = count > 0 ? list.reduce((s, r) => s + r.rating, 0) / count : 0;

      // 3) Best-effort: update product aggregates. This often requires elevated permissions,
      // so it must not block the user from submitting a review.
      try {
        await updateDoc(doc(db, "products", productId), {
          rating: Math.round(avg * 10) / 10,
          reviewCount: count,
        });
      } catch (e) {
        console.warn("[Reviews] Saved review, but could not update product aggregates:", e);
      }
      setReviews(
        list.map((r) => ({
          id: r.id,
          productId,
          rating: r.rating,
          comment: r.comment ?? "",
          authorName: r.authorName ?? "Anonymous",
          createdAt: r.createdAt,
        }))
      );
      setProduct((prev: any) =>
        prev ? { ...prev, rating: Math.round(avg * 10) / 10, reviewCount: count } : prev
      );
      setReviewForm({ rating: 5, comment: "", displayName: "", postAnonymously: true });
      toast.success("Review submitted. Thank you!");
    } catch (e: any) {
      const msg =
        typeof e?.message === "string" && e.message.length > 0
          ? e.message
          : "Could not submit review. Please try again.";
      toast.error(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb: Home > Shop > [Category] > Product */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
          <Link href="/">
            <a className="hover:text-orange-600 transition">Home</a>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Link href="/shop">
            <a className="hover:text-orange-600 transition">Shop</a>
          </Link>
          {categoryMeta && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Link href={`/shop?category=${encodeURIComponent(categoryMeta.slug ?? product.categoryId)}`}>
                <a className="hover:text-orange-600 transition">{categoryMeta.name}</a>
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          {/* Product Images */}
          <div className="w-full max-w-sm sm:max-w-md mx-auto md:mx-0">
            <div
              className="bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center"
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.name}
                  loading="eager"
                  className="w-full h-auto max-h-[260px] sm:max-h-[360px] md:max-h-[520px] object-contain"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}

              {/* Prev/Next controls */}
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goPrevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-800" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goNextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-800" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {hasMultipleImages && (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square w-full rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === idx
                        ? "border-orange-500"
                        : "border-gray-300"
                    }`}
                  >
                    <ProgressiveImage
                      src={img}
                      placeholderSrc={getImageLow(img, idx)}
                      alt={`${product.name} ${idx + 1}`}
                      loading="lazy"
                      containerClassName="w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-[14px] sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">
              {product.name}
            </h1>

            {/* Rating – from reviews or product */}
            {(displayRating > 0 || displayReviewCount > 0) && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(Number(displayRating) || 0)
                          ? "fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  ({displayReviewCount} {displayReviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-2 mb-3 sm:mb-5">
              <span className="text-[12px] sm:text-2xl md:text-3xl font-bold text-orange-600">
                KSh {formatCurrency(basePrice)}
              </span>
              {originalPrice != null && (
                <span className="text-base sm:text-lg md:text-xl text-gray-500 line-through">
                  KSh {formatCurrency(originalPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-sm font-semibold">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Stock Status – variant-aware when hasVariants */}
            <div className="mb-6">
              {(() => {
                const inStock =
                  availableStock != null
                    ? availableStock > 0
                    : displayStock !== undefined
                      ? displayStock > 0
                      : product.inStock;
                return inStock ? (
                  <span className="text-green-600 font-semibold">
                    In Stock{availableStock != null ? ` (${availableStock} available)` : displayStock != null ? ` (${displayStock} available)` : ""}
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">Out of Stock</span>
                );
              })()}
            </div>

            {/* Short description (plain teaser) when no full display description */}
            {product.shortDescription && !displayDescription && (
              <p className="text-gray-600 mb-4 leading-relaxed font-medium">
                {product.shortDescription}
              </p>
            )}

            {/* Variants (subProducts) – user must select one before adding to cart */}
            {product.subProducts?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-sm">Choose variant</h3>
                <p className="text-xs text-gray-600 mb-2">Select a variant to add to cart.</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.subProducts.map((sp: Variant) => {
                    const isSelected = selectedVariant?.id === sp.id;
                    const stockNum =
                      typeof (sp as any).stockQuantity === "number"
                        ? (sp as any).stockQuantity
                        : sp.stockCount != null
                          ? parseInt(String(sp.stockCount), 10)
                          : null;
                    const inStock = stockNum === null || stockNum > 0;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(sp.id);
                          setSelectedImageIndex(0);
                          setQuantity(1);
                        }}
                        className={`px-3 py-2 rounded-md border text-left transition text-xs ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 text-orange-900"
                            : "border-gray-200 bg-white hover:border-orange-300 text-gray-800"
                        } ${!inStock ? "opacity-60 cursor-not-allowed" : ""}`}
                        disabled={!inStock}
                      >
                        <span className="font-medium block truncate">{sp.name}</span>
                        {sp.sku && <span className="text-[10px] text-gray-500 block truncate">{sp.sku}</span>}
                        <span className="text-xs font-semibold text-orange-600 block mt-0.5">
                          {typeof sp.price === "number" ? `KSh ${sp.price.toFixed(0)}` : "—"}
                        </span>
                        {stockNum !== null && (
                          <span className="text-[10px] text-gray-500">
                            {inStock ? `${stockNum} in stock` : "Out of stock"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    Selected: {selectedVariant.name}
                    {selectedVariant.sku ? ` (${selectedVariant.sku})` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Quantity – capped by available stock (and already in cart) */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-[12px] sm:text-base">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxCanAdd ?? undefined}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const next = Number.isNaN(v) ? 1 : Math.max(1, v);
                    const cap = maxCanAdd != null ? Math.min(next, maxCanAdd) : next;
                    setQuantity(cap);
                  }}
                  className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-center text-sm"
                />
                <button
                  onClick={() =>
                    setQuantity(maxCanAdd != null ? Math.min(quantity + 1, maxCanAdd) : quantity + 1)
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={maxCanAdd != null && quantity >= maxCanAdd}
                >
                  +
                </button>
              </div>
              {maxCanAdd != null && maxCanAdd < (availableStock ?? 0) && inCartQty > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {inCartQty} already in cart; you can add up to {maxCanAdd} more.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                size="sm"
                className="flex-1 min-w-[120px] sm:min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white py-2 sm:py-2.5"
                onClick={handleAddToCart}
                disabled={!canAddToCart || !product.inStock || (maxCanAdd != null && maxCanAdd <= 0)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 min-w-[120px] sm:min-w-[140px] py-2 sm:py-2.5 text-sm"
                onClick={handleBuyNow}
                disabled={!canAddToCart || !product.inStock || (maxCanAdd != null && maxCanAdd <= 0)}
              >
                Buy Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="px-2.5 py-2"
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="px-2.5 py-2"
                onClick={() => {
                  const url =
                    typeof window !== "undefined"
                      ? window.location.href
                      : `${window.location.origin}/product/${product.id}`;
                  const shareText = `Check out this product on Passmartshop: ${product.name}`;
                  if (navigator.share) {
                    navigator
                      .share({
                        title: product.name,
                        text: shareText,
                        url,
                      })
                      .catch(() => {
                        // Swallow errors (user cancelled, etc.)
                      });
                  } else if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(url).catch(() => {});
                  }
                }}
              >
                <Share2 className="h-5 w-5 mr-1" />
                Share
              </Button>
            </div>

            {/* WhatsApp order button + rating summary */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-2 sm:py-2.5 text-sm"
                onClick={() => {
                  const qty = Math.max(1, quantity);
                  const message = `Hi, I'm interested in this product:%0A- Name: ${encodeURIComponent(
                    product.name
                  )}%0A- Price: KSh ${basePrice.toFixed(
                    0
                  )}%0A- Quantity: ${qty}%0A%0APlease assist with my order.`;
                  window.open(`https://wa.me/254740730781?text=${message}`, "_blank");
                }}
              >
                <MessageCircle className="h-5 w-5" />
                Order on WhatsApp
              </Button>

              {(displayRating > 0 || displayReviewCount > 0) && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-orange-600 transition"
                  onClick={() => {
                    setActiveTab("reviews");
                    setTimeout(() => {
                      reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
                >
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(Number(displayRating) || 0)
                            ? "fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {displayRating.toFixed(1)}
                    <span className="ml-1 text-xs text-gray-500">
                      ({displayReviewCount} {displayReviewCount === 1 ? "rating" : "ratings"})
                    </span>
                  </span>
                </button>
              )}
            </div>

            {/* Shipping & delivery info panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 mb-8">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-[12px] sm:text-sm">Fast Delivery</p>
                  <p className="text-gray-600 text-xs">Delivered within 2–5 business days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-[12px] sm:text-sm">Secure Payment</p>
                  <p className="text-gray-600 text-xs">Pay via M-Pesa, Card, or Cash on Delivery</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-[12px] sm:text-sm">Easy Returns</p>
                  <p className="text-gray-600 text-xs">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description / Specifications / Reviews (full width) */}
        <div className="max-w-5xl mx-auto mt-10">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-8">
            <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0 gap-6">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              {displayDescription ? (
                <div className="prose prose-gray max-w-none text-gray-600 prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0">
                  <ReactMarkdown>{displayDescription}</ReactMarkdown>
                </div>
              ) : product.shortDescription ? (
                <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>
              ) : (
                <p className="text-gray-600">No description available.</p>
              )}
            </TabsContent>
            <TabsContent value="specifications" className="mt-4">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key} className="bg-white">
                          <td className="px-4 py-3 font-medium text-gray-700 w-1/3">{key}</td>
                          <td className="px-4 py-3 text-gray-600">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No specifications available.</p>
              )}
            </TabsContent>
            <TabsContent value="reviews" className="mt-4">
              <div ref={reviewsRef} className="space-y-8">
                {/* Write a review */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Write a review</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700">Rating</Label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setReviewForm((f) => ({ ...f, rating: star }))
                            }
                            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                            aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= reviewForm.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="review-comment" className="text-gray-700">
                        Comment (optional)
                      </Label>
                      <Textarea
                        id="review-comment"
                        placeholder="Share your experience with this product..."
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((f) => ({ ...f, comment: e.target.value }))
                        }
                        className="mt-1 min-h-[100px]"
                        maxLength={2000}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="review-anonymous"
                        checked={reviewForm.postAnonymously}
                        onCheckedChange={(checked) =>
                          setReviewForm((f) => ({
                            ...f,
                            postAnonymously: checked === true,
                          }))
                        }
                      />
                      <Label
                        htmlFor="review-anonymous"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Post as Anonymous
                      </Label>
                    </div>
                    {!reviewForm.postAnonymously && (
                      <div>
                        <Label htmlFor="review-name" className="text-gray-700">
                          Display name
                        </Label>
                        <Input
                          id="review-name"
                          placeholder="Your name (e.g. John)"
                          value={reviewForm.displayName}
                          onChange={(e) =>
                            setReviewForm((f) => ({
                              ...f,
                              displayName: e.target.value,
                            }))
                          }
                          className="mt-1 max-w-xs"
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {reviewSubmitting ? "Submitting…" : "Submit review"}
                    </Button>
                  </div>
                </div>

                {/* Review list */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {displayReviewCount} {displayReviewCount === 1 ? "review" : "reviews"}
                  </h4>
                  {reviewsLoading ? (
                    <p className="text-gray-500 text-sm">Loading reviews…</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                  ) : (
                    <ul className="space-y-4">
                      {reviews.map((r) => (
                        <li
                          key={r.id}
                          className="p-4 bg-white rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                              {r.authorName}
                            </span>
                            <span className="text-yellow-500 text-sm">
                              {"★".repeat(Math.round(r.rating))}
                              {"☆".repeat(5 - Math.round(r.rating))}
                            </span>
                            <span className="text-xs text-gray-500">
                              {r.createdAt?.toDate?.()
                                ? new Date(r.createdAt.toDate()).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : ""}
                            </span>
                          </div>
                          {r.comment ? (
                            <p className="text-gray-600 text-sm">{r.comment}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {relatedProducts.map((p) => (
                <div key={p.id} className="flex-shrink-0 w-[180px] sm:w-[200px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
