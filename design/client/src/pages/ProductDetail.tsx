import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ShoppingCart, Heart, ChevronRight, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { getLowQualityImageUrl } from "@/lib/imageUtils";
import { useCart } from "@/contexts/CartContext";
import { useBehavior } from "@/contexts/BehaviorContext";
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
  const [selectedVariant, setSelectedVariant] = useState<{
    id: string;
    name: string;
    sku?: string;
    price?: number;
    stockCount?: string;
    stockQuantity?: number;
  } | null>(null);

  const productId = params?.id ?? null;

  useEffect(() => {
    setSelectedVariant(null);
  }, [productId]);

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

  // Fetch related products for "You May Also Like" – same category, or from user's viewed categories
  useEffect(() => {
    if (!product?.id) {
      setRelatedProducts([]);
      return;
    }
    const viewedCategoryIds = getViewedCategoryIds();
    const categoryIdsToUse =
      viewedCategoryIds.length > 0
        ? [product.categoryId, ...viewedCategoryIds].filter(Boolean).filter((id, i, arr) => arr.indexOf(id) === i).slice(0, 10)
        : product.categoryId
          ? [product.categoryId]
          : [];

    if (categoryIdsToUse.length === 0) {
      setRelatedProducts([]);
      return;
    }

    if (categoryIdsToUse.length === 1) {
      getDocs(
        query(
          collection(db, "products"),
          where("categoryId", "==", categoryIdsToUse[0]),
          limit(9)
        )
      )
        .then((snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p: any) => String(p.id) !== String(product.id))
            .slice(0, 8);
          setRelatedProducts(list);
        })
        .catch(() => setRelatedProducts([]));
      return;
    }

    getDocs(
      query(
        collection(db, "products"),
        where("categoryId", "in", categoryIdsToUse),
        limit(20)
      )
    )
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => String(p.id) !== String(product.id));
        const shuffled = [...list].sort(() => Math.random() - 0.5);
        setRelatedProducts(shuffled.slice(0, 8));
      })
      .catch(() => setRelatedProducts([]));
  }, [product?.id, product?.categoryId, getViewedCategoryIds]);

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
          const data = d.data();
          return {
            id: d.id,
            productId: data.productId ?? "",
            rating: typeof data.rating === "number" ? data.rating : 0,
            comment: data.comment ?? "",
            authorName: data.authorName ?? "Anonymous",
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

  // Stock / cart cap – use variant stock when a variant is selected and product has subProducts
  const availableStock: number | null = product
    ? (() => {
        if (product.subProducts?.length > 0 && selectedVariant) {
          const sq = selectedVariant.stockQuantity;
          const sc = selectedVariant.stockCount;
          if (typeof sq === "number" && Number.isFinite(sq) && sq >= 0) return sq;
          if (sc != null) {
            const n = parseInt(String(sc), 10);
            if (!Number.isNaN(n) && n >= 0) return n;
          }
          return null;
        }
        const sc = product.stockCount;
        const sq = product.stockQuantity;
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

  const basePrice = (() => {
    if (product.subProducts?.length > 0 && selectedVariant && typeof selectedVariant.price === "number")
      return selectedVariant.price;
    return typeof product.price === "number"
      ? product.price
      : product.basePrice
        ? parseFloat(product.basePrice)
        : 0;
  })();
  const originalPrice =
    product.compareAtPrice != null
      ? product.compareAtPrice
      : product.originalPrice
        ? parseFloat(product.originalPrice)
        : null;
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

  const images =
    product.images?.length > 0
      ? product.images
      : product.imageUrls?.length > 0
      ? product.imageUrls
      : product.primaryImageUrl
      ? [product.primaryImageUrl]
      : [];
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

  const hasVariants = (product.subProducts?.length ?? 0) > 0;
  const canAddToCart = !hasVariants || selectedVariant != null;

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
        images,
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
        images,
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
    const authorName =
      reviewForm.postAnonymously || !reviewForm.displayName.trim()
        ? "Anonymous"
        : reviewForm.displayName.trim();
    setReviewSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId,
        rating,
        comment: (reviewForm.comment ?? "").trim().slice(0, 2000),
        authorName,
        userId: null,
        createdAt: serverTimestamp(),
      });
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
      await updateDoc(doc(db, "products", productId), {
        rating: Math.round(avg * 10) / 10,
        reviewCount: count,
      });
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
    } catch (e) {
      toast.error("Could not submit review. Please try again.");
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
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
          {/* Product Images */}
          <div className="w-full max-w-xl mx-auto md:mx-0">
            <div
              className="bg-gray-100 rounded-lg overflow-hidden mb-4 relative aspect-[4/5] max-h-[480px] sm:max-h-[520px] md:max-h-[560px] cursor-zoom-in"
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
            >
              {displayImage ? (
                <div
                  className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
                  style={{
                    transform: imageZoom.active ? "scale(2)" : "scale(1)",
                    transformOrigin: `${imageZoom.originX}% ${imageZoom.originY}%`,
                  }}
                >
                  <ProgressiveImage
                    src={displayImage}
                    placeholderSrc={displayImageLow}
                    alt={product.name}
                    loading="eager"
                    containerClassName="absolute inset-0 h-full w-full"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
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
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

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
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-orange-600">
                KSh {basePrice.toFixed(0)}
              </span>
              {originalPrice != null && (
                <span className="text-2xl text-gray-500 line-through">
                  KSh {originalPrice.toFixed(0)}
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.inStock ? (
                <span className="text-green-600 font-semibold">
                  In Stock{availableStock != null ? ` (${availableStock} available)` : ""}
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>

            {/* Short description (plain teaser) when no full description */}
            {product.shortDescription && !product.description && (
              <p className="text-gray-600 mb-4 leading-relaxed font-medium">
                {product.shortDescription}
              </p>
            )}

            {/* Variants (subProducts) – user must select one before adding to cart */}
            {product.subProducts?.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3">Choose variant</h3>
                <p className="text-sm text-gray-600 mb-3">Select a variant to add to cart.</p>
                <div className="flex flex-wrap gap-2">
                  {product.subProducts.map((sp: { id: string; name: string; sku?: string; price?: number; stockCount?: string; stockQuantity?: number }) => {
                    const isSelected = selectedVariant?.id === sp.id;
                    const stockNum =
                      typeof sp.stockQuantity === "number"
                        ? sp.stockQuantity
                        : sp.stockCount != null
                          ? parseInt(String(sp.stockCount), 10)
                          : null;
                    const inStock = stockNum === null || stockNum > 0;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setSelectedVariant(sp)}
                        className={`px-4 py-3 rounded-lg border-2 text-left transition ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 text-orange-900"
                            : "border-gray-200 bg-white hover:border-orange-300 text-gray-800"
                        } ${!inStock ? "opacity-60 cursor-not-allowed" : ""}`}
                        disabled={!inStock}
                      >
                        <span className="font-medium block">{sp.name}</span>
                        {sp.sku && <span className="text-xs text-gray-500 block">{sp.sku}</span>}
                        <span className="text-sm font-semibold text-orange-600 block mt-0.5">
                          {typeof sp.price === "number" ? `KSh ${sp.price.toFixed(0)}` : "—"}
                        </span>
                        {stockNum !== null && (
                          <span className="text-xs text-gray-500">
                            {inStock ? `${stockNum} in stock` : "Out of stock"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Selected: {selectedVariant.name}
                    {selectedVariant.sku ? ` (${selectedVariant.sku})` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Quantity – capped by available stock (and already in cart) */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
                />
                <button
                  onClick={() =>
                    setQuantity(maxCanAdd != null ? Math.min(quantity + 1, maxCanAdd) : quantity + 1)
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                size="lg"
                className="flex-1 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleAddToCart}
                disabled={!canAddToCart || !product.inStock || (maxCanAdd != null && maxCanAdd <= 0)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 min-w-[140px]"
                onClick={handleBuyNow}
                disabled={!canAddToCart || !product.inStock || (maxCanAdd != null && maxCanAdd <= 0)}
              >
                Buy Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Shipping & delivery info panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-8">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Fast Delivery</p>
                  <p className="text-gray-600 text-xs">Delivered within 2–5 business days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Secure Payment</p>
                  <p className="text-gray-600 text-xs">Pay via M-Pesa, Card, or Cash on Delivery</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Easy Returns</p>
                  <p className="text-gray-600 text-xs">30-day return policy</p>
                </div>
              </div>
            </div>

            {/* Tabbed: Description, Specifications, Reviews */}
            <Tabs defaultValue="description" className="mb-8">
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
                {product.description ? (
                  <div className="prose prose-gray max-w-none text-gray-600 prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0">
                    <ReactMarkdown>{product.description}</ReactMarkdown>
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
                <div className="space-y-8">
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
