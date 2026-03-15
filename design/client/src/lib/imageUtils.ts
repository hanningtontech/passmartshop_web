/**
 * Base URL for the low-quality image bucket (e.g. separate Backblaze bucket).
 * If set, the low-quality URL is derived by replacing the main bucket base with this.
 * Example: VITE_LOW_QUALITY_IMAGE_BASE=https://f005.backblazeb2.com/file/my-bucket-low
 */
const LOW_QUALITY_BASE = import.meta.env.VITE_LOW_QUALITY_IMAGE_BASE as string | undefined;

/**
 * Derives the low-quality image URL for fast loading.
 *
 * 1. Different bucket (recommended): Set VITE_LOW_QUALITY_IMAGE_BASE to your low-quality
 *    Backblaze bucket base URL. Same path structure is assumed (e.g. products/123/abc.png).
 *
 * 2. Same bucket, -low filename: If no base is set, uses xyz.png → xyz-low.png convention.
 */
export function getLowQualityImageUrl(fullUrl: string): string {
  if (!fullUrl || typeof fullUrl !== "string") return fullUrl;

  if (LOW_QUALITY_BASE) {
    try {
      const u = new URL(fullUrl);
      const pathParts = u.pathname.split("/").filter(Boolean);
      // Backblaze B2: /file/bucket-name/path/to/file.png
      if (pathParts.length >= 3) {
        const pathAfterBucket = pathParts.slice(2).join("/");
        const base = LOW_QUALITY_BASE.replace(/\/+$/, "");
        return `${base}/${pathAfterBucket}`;
      }
      // Other CDNs: use full path
      if (pathParts.length >= 1) {
        const base = LOW_QUALITY_BASE.replace(/\/+$/, "");
        return `${base}/${pathParts.join("/")}`;
      }
    } catch {
      // Invalid URL, fall through to filename convention
    }
  }

  // Same bucket: xyz.png → xyz-low.png
  return fullUrl.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "-low.$1");
}
