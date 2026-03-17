import { Link } from "wouter";
import { ShoppingCart, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { buildSrcSet, formatCurrency, getLowQualityImageUrl } from "@/lib/imageUtils";

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

type ProductCardSize = "default" | "small";

export default function ProductCard({
  product,
  size = "default",
}: {
  product: ProductCardData;
  size?: ProductCardSize;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToCart } = useCart();

  const isSmall = size === "small";

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
  const cardImageSrc = imageSrc;
  const cardImageLow = cardImageSrc ? getLowQualityImageUrl(cardImageSrc) : null;
  const cardImageSrcSet = cardImageSrc
    ? buildSrcSet(cardImageSrc, isSmall ? [160, 240, 320, 400] : [240, 360, 480, 640])
    : undefined;

  return (
    <Card className="hover:shadow-sm transition-shadow duration-300 overflow-hidden group min-w-0 flex flex-col pt-0 h-full">
      <CardContent className="p-0 flex flex-col flex-1 min-h-0 rounded-lg h-full">
        {/* Image – compact aspect and height */}
        <Link href={`/product/${product.id}`} className="block min-w-0 flex-shrink-0">
          {/* Image holder: pure 4:5, scales with card width on any screen */}
          <div className={`relative w-full ${isSmall ? "aspect-square" : "aspect-[4/5]"} overflow-hidden bg-gray-100 cursor-pointer`}>
            {cardImageSrc ? (
              <>
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                )}
                <ProgressiveImage
                  src={cardImageSrc}
                  placeholderSrc={cardImageLow}
                  alt={product.name}
                  loading="lazy"
                  /* Rough responsive hint: cards are 50vw on small, 33vw on sm, 25vw on lg, 20vw on xl */
                  sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  srcSet={cardImageSrcSet}
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

            {/* Top-right badges (discount / featured) */}
            <div className={`absolute ${isSmall ? "top-1 right-1" : "top-1.5 right-1.5"} flex flex-col gap-0.5 items-end`}>
              {discount > 0 && (
                <div className={`bg-red-500 text-white ${isSmall ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]"} rounded font-semibold leading-tight whitespace-nowrap`}>
                  {discount}% OFF
                </div>
              )}
              {product.featured && (
                <div className={`bg-amber-500 text-white ${isSmall ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]"} rounded font-semibold leading-tight whitespace-nowrap`}>
                  Featured
                </div>
              )}
            </div>

            {/* NEW badge – top-left */}
            {product.isNew && (
              <div className={`absolute ${isSmall ? "top-1 left-1 px-1 py-0.5 text-[9px]" : "top-1.5 left-1.5 px-1.5 py-0.5 text-[10px]"} bg-green-600 text-white rounded font-semibold leading-tight whitespace-nowrap`}>
                NEW
              </div>
            )}

            {/* Flash sale – bottom-right with flame icon */}
            {product.flashSale && (
              <div className={`absolute ${isSmall ? "bottom-1 right-1 px-1 py-0.5" : "bottom-1.5 right-1.5 px-1.5 py-0.5"} flex items-center gap-0.5 bg-orange-600/95 text-white rounded-sm`}>
                <Flame className="h-3 w-3" />
              </div>
            )}
          </div>
        </Link>

        {/* Content – compact spacing and fixed height to keep cards consistent */}
        <div
          className={`${
            isSmall ? "px-1 pt-1 pb-0.5" : "px-1 pt-1 pb-1.5 sm:px-1.5 sm:pt-1.5 sm:pb-2"
          } flex flex-col flex-1 min-h-0 ${isSmall ? "h-[80px]" : "h-[100px]"} overflow-hidden`}
        >
          <Link href={`/product/${product.id}`} className="min-w-0">
            <h3 className={`font-semibold ${isSmall ? "text-[12px]" : "text-[13px]"} leading-snug mb-0.5 line-clamp-2 hover:text-orange-500 transition cursor-pointer break-words`}>
              {product.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 mb-1 min-w-0">
            <span className={`${isSmall ? "text-[12px]" : "text-[13px]"} font-bold text-orange-600 whitespace-nowrap`}>
              KSh {formatCurrency(basePrice)}
            </span>
            {originalPrice && (
              <span className={`${isSmall ? "text-[11px]" : "text-[12px]"} text-gray-500 line-through whitespace-nowrap`}>
                KSh {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          <div className="mt-auto flex-shrink-0">
            {product.inStock ? (
              <span className={`${isSmall ? "text-[11px]" : "text-[12px]"} text-green-600 font-semibold`}>
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
              <span className={`${isSmall ? "text-[11px]" : "text-[12px]"} text-red-600 font-semibold`}>Out of Stock</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
