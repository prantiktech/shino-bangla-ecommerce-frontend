export type ImageSize = "thumb" | "card" | "full";

export interface ApiImage {
  id: number;
  url: string;
  sizes?: Partial<Record<ImageSize, string>>;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  mime_type?: string;
  size?: number;
}

export type ImageLike = ApiImage | string | null | undefined;

/**
 * Rewrites legacy/raw-IP backend storage URLs (`http://13.140.181.253/...`,
 * `http://api.nogodbazar.com/...`, `http://nogodbazar.com/...`) to HTTPS on
 * `https://api.nogodbazar.com` / `https://nogodbazar.com` so browsers never
 * block images as Mixed Content in production.
 */
export function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/^https?:\/\/13\.140\.181\.253(?::\d+)?(?=\/|$)/i, "https://api.nogodbazar.com")
    .replace(/^http:\/\/api\.nogodbazar\.com(?::\d+)?(?=\/|$)/i, "https://api.nogodbazar.com")
    .replace(/^http:\/\/(www\.)?nogodbazar\.com(?::\d+)?(?=\/|$)/i, "https://$1nogodbazar.com");
}

/**
 * Safely extracts an image URL from an ApiImage object or plain URL string,
 * falling back through `sizes[size]` -> `url` -> `fallback`.
 * Matches IMAGES_API.md Section 4.1.
 */
export function imageSrc(
  image: ImageLike,
  size: ImageSize = "card",
  fallback = "/placeholder.svg"
): string {
  if (!image) return fallback;
  if (typeof image === "string") {
    const trimmed = image.trim();
    if (!trimmed || trimmed === "[object Object]") return fallback;
    return normalizeMediaUrl(trimmed);
  }
  if (typeof image === "object") {
    const candidate = image.sizes?.[size] ?? image.url;
    if (typeof candidate === "string" && candidate.trim()) {
      return normalizeMediaUrl(candidate);
    }
  }
  return fallback;
}

/**
 * Safely extracts alt text from an ApiImage object, falling back to `fallback`.
 */
export function imageAlt(image: ImageLike, fallback = ""): string {
  if (image && typeof image === "object" && typeof image.alt === "string" && image.alt.trim()) {
    return image.alt.trim();
  }
  return fallback;
}

/**
 * Checks whether a string looks like an image URL or path (rather than a Lucide icon name).
 */
export function isImageUrl(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/")
  );
}
