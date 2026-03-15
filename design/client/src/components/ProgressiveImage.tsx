import { useState } from "react";

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='16' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E";

type ProgressiveImageProps = {
  /** Full-quality image URL (e.g. main Backblaze bucket) */
  src: string;
  /** Low-quality placeholder URL (e.g. separate Backblaze bucket with small duplicates) – used for fast first paint */
  placeholderSrc?: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Optional wrapper class (e.g. for aspect ratio / overflow) */
  containerClassName?: string;
  /** Called when the full-quality image has loaded (e.g. to hide skeleton) */
  onLoad?: () => void;
};

/**
 * Renders the low-quality image first for fast load, then the full-quality image on top when ready.
 * Shows a fallback placeholder when the image fails to load (e.g. 404, missing file in Backblaze).
 */
export function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  className = "",
  loading = "lazy",
  containerClassName = "",
  onLoad,
}: ProgressiveImageProps) {
  const [fullLoaded, setFullLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleFullLoad = () => {
    setFullLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onLoad?.(); // still hide skeleton
  };

  if (hasError) {
    return (
      <div className={`${containerClassName}`}>
        <div
          className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center"
          role="img"
          aria-label={alt}
        >
          <img
            src={PLACEHOLDER_SVG}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClassName}`}>
      <div className="relative w-full h-full overflow-hidden bg-gray-100">
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-contain object-center ${className} ${fullLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            loading={loading}
            decoding="async"
          />
        )}
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={handleFullLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-contain object-center ${className} ${fullLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        />
      </div>
    </div>
  );
}
