import { Link } from "wouter";
import { ShoppingCart, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { getLowQualityImageUrl } from "@/lib/imageUtils";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

type ProductCardData = {
  id: string | number;
  name: string;
  basePrice?: string;
  originalPrice?: string;
  price?: number;
  compareAtPrice?: number | null;
  images?: string[];
  imageUrls?: string[];
  primaryImageUrl?: string;
  imagesLow?: string[];
  imageUrlsLow?: string[];
  primaryImageUrlLow?: string;
  featured?: boolean;
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  inStock?: boolean;
  stockCount?: string;
  stockQuantity?: number;
  localStock?: boolean;
  flashSale?: boolean;
  flashSalePrice?: number | string;
  subProducts?: Array<{ id: string; name: string; sku?: string; price?: number }>;
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToCart } = useCart();

  // Normalize price: use flash sale price when product is on flash sale
  const regularPrice =
    typeof product.price === "number"
      ? product.price
      : product.basePrice
      ? parseFloat(product.basePrice)
      : 0;
  const flashPrice =
    product.flashSalePrice != null
      ? typeof product.flashSalePrice === "number"
        ? product.flashSalePrice
        : parseFloat(String(product.flashSalePrice))
      : null;
  const basePrice =
    product.flashSale && flashPrice != null && !Number.isNaN(flashPrice) && flashPrice >= 0
      ? flashPrice
      : regularPrice;

  const rawOriginal =
    product.compareAtPrice ??
    (product.originalPrice ? parseFloat(product.originalPrice) : null);
  const originalPrice =
    typeof rawOriginal === "number" && !Number.isNaN(rawOriginal)
      ? rawOriginal
      : product.flashSale ? regularPrice : null;

  const discount = originalPrice ? Math.round(((originalPrice - basePrice) / originalPrice) * 100) : 0;

  const imageSrc =
    (product.images && product.images[0]) ||
    (product.imageUrls && product.imageUrls[0]) ||
    product.primaryImageUrl ||
    "";
  const imagePlaceholderSrc =
    (product.imagesLow && product.imagesLow[0]) ||
    (product.imageUrlsLow && product.imageUrlsLow[0]) ||
    product.primaryImageUrlLow ||
    (imageSrc ? getLowQualityImageUrl(imageSrc) : null) ||
    null;

  return (
    <Card className="hover:shadow-sm transition-shadow duration-300 overflow-hidden group min-w-0 flex flex-col pt-0">
      <CardContent className="p-0 flex flex-col flex-1 min-h-0 rounded-lg">
        {/* Image – compact aspect and height */}
        <Link href={`/product/${product.id}`} className="block min-w-0 flex-shrink-0">
          {/* Image holder: pure 4:5, scales with card width on any screen */}
          <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100 cursor-pointer">
            {imageSrc ? (
              <>
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                )}
                <ProgressiveImage
                  src={imageSrc}
                  placeholderSrc={imagePlaceholderSrc}
                  alt={product.name}
                  loading="lazy"
                  containerClassName="absolute inset-0 group-hover:scale-110 transition-transform duration-300"
                  className="group-hover:scale-110 transition-transform duration-300"
                  onLoad={() => setImageLoaded(true)}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                No image
              </div>
            )}

            {/* Hover quick-add (desktop) – slides up from bottom; when product has variants, link to product page to choose */}
            {product.inStock && (
              <div
                className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 hidden md:block bg-white/95 border-t border-gray-100 p-2"
                onClick={(e) => e.preventDefault()}
              >
                {product.subProducts != null && product.subProducts.length > 0 ? (
                  <Link href={`/product/${product.id}`}>
                    <a className="block w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded text-center">
                      Choose variant
                    </a>
                  </Link>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(
                        {
                          id: product.id,
                          name: product.name,
                          basePrice: String(basePrice),
                          images: product.images || product.imageUrls || [],
                        },
                        1
                      );
                    }}
                    className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Add to Cart
                  </button>
                )}
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5">
              {product.flashSale && (
                <div className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight whitespace-nowrap">
                  Flash Sale
                </div>
              )}
              {discount > 0 && (
                <div className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight whitespace-nowrap">
                  {discount}% OFF
                </div>
              )}
              {product.featured && (
                <div className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight whitespace-nowrap">
                  Featured
                </div>
              )}
              {product.isNew && (
                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight whitespace-nowrap">
                  NEW
                </div>
              )}
            </div>

            {/* Shipping badge – bottom left */}
            <div className="absolute bottom-1.5 left-1.5 hidden sm:block">
              {product.localStock === true ? (
                <span className="bg-green-600/90 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                  Local Stock
                </span>
              ) : (
                <span className="bg-gray-600/80 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                  Ships from Overseas
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsWishlisted(!isWishlisted);
              }}
              className="absolute top-1.5 left-1.5 bg-white rounded-full p-1 hover:bg-gray-100 transition z-10"
            >
              <Heart
                className={`h-3.5 w-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
              />
            </button>
          </div>
        </Link>

        {/* Content – compact spacing and smaller text */}
        <div className="p-1 sm:p-1.5 flex flex-col min-h-0 flex-1">
          <Link href={`/product/${product.id}`} className="min-w-0">
            <h3 className="font-semibold text-[11px] leading-snug mb-0.5 line-clamp-2 hover:text-orange-500 transition cursor-pointer break-words">
              {product.name}
            </h3>
          </Link>

          {(product.rating != null && product.rating > 0) && (
            <div className="flex items-center gap-0.5 mb-0.5 flex-shrink-0">
              <div className="flex text-yellow-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>{i < Math.round(product.rating || 0) ? "★" : "☆"}</span>
                ))}
              </div>
              <span className="text-[10px] text-gray-600">
                ({product.reviewCount != null ? product.reviewCount : product.rating})
              </span>
            </div>
          )}
          {product.soldCount != null && product.soldCount > 0 && (
            <p className="text-[10px] text-gray-500 mb-0.5">
              {product.soldCount >= 1000
                ? `${(product.soldCount / 1000).toFixed(1)}k sold`
                : `${product.soldCount} sold`}
            </p>
          )}

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 mb-1 min-w-0">
            <span className="text-[12px] font-bold text-orange-600 whitespace-nowrap">
              KSh {basePrice.toFixed(0)}
            </span>
            {originalPrice && (
              <span className="text-[11px] text-gray-500 line-through whitespace-nowrap">
                KSh {originalPrice.toFixed(0)}
              </span>
            )}
          </div>

          <div className="mb-1 flex-shrink-0">
            {product.inStock ? (
              <span className="text-[10px] text-green-600 font-semibold">
                In Stock
                {(() => {
                  const sq = product.stockQuantity;
                  const sc = product.stockCount;
                  if (typeof sq === "number" && Number.isFinite(sq) && sq >= 0) return ` (${sq})`;
                  if (sc != null) {
                    const n = parseInt(String(sc), 10);
                    if (!Number.isNaN(n) && n >= 0) return ` (${n})`;
                  }
                  return "";
                })()}
              </span>
            ) : (
              <span className="text-[10px] text-red-600 font-semibold">Out of Stock</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
