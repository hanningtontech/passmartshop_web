import { Link } from "wouter";

type Product = {
  id: string | number;
  name: string;
  basePrice?: string;
  originalPrice?: string;
  price?: number;
  compareAtPrice?: number | null;
  images?: string[];
  imageUrls?: string[];
  primaryImageUrl?: string;
  flashSale?: boolean;
  flashSalePrice?: number | string;
};

export default function FlashSaleCompactCard({ product }: { product: Product }) {
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
  const displayPrice =
    product.flashSale && flashPrice != null && !Number.isNaN(flashPrice) && flashPrice >= 0
      ? flashPrice
      : regularPrice;

  const rawOriginal =
    product.compareAtPrice ??
    (product.originalPrice ? parseFloat(product.originalPrice) : null);
  const compareAtPrice =
    typeof rawOriginal === "number" && !Number.isNaN(rawOriginal)
      ? rawOriginal
      : product.flashSale ? regularPrice : null;

  const imageSrc =
    (product.images && product.images[0]) ||
    (product.imageUrls && product.imageUrls[0]) ||
    product.primaryImageUrl ||
    "";

  return (
    <Link href={`/product/${product.id}`}>
      <a className="block w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:border-orange-400 hover:shadow-md aspect-square relative">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
            —
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-6 px-1.5 pb-1">
          <p className="text-[10px] sm:text-xs font-medium text-white truncate leading-tight">
            {product.name}
          </p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-[10px] sm:text-xs font-bold text-orange-300">
              KSh {displayPrice.toFixed(0)}
            </span>
            {compareAtPrice != null && compareAtPrice > displayPrice && (
              <span className="text-[9px] text-white/80 line-through">
                KSh {compareAtPrice.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </a>
    </Link>
  );
}
