/**
 * Validates and sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * Only allows relative URLs (paths starting with /).
 *
 * @param url - The URL to validate
 * @param fallback - The fallback URL if validation fails (default: "/dashboard")
 * @returns A safe redirect URL
 */
export function getSafeRedirectUrl(
  url: string | undefined | null,
  fallback: string = "/dashboard",
): string {
  if (!url) {
    return fallback;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Must start with a single forward slash (not //)
  // This prevents protocol-relative URLs like //evil.com
  if (!trimmedUrl.startsWith("/") || trimmedUrl.startsWith("//")) {
    return fallback;
  }

  // Block javascript: and data: schemes that could be encoded
  const lowerUrl = trimmedUrl.toLowerCase();
  if (
    lowerUrl.includes("javascript:") ||
    lowerUrl.includes("data:") ||
    lowerUrl.includes("vbscript:")
  ) {
    return fallback;
  }

  // Don't redirect to auth pages to prevent loops
  if (
    trimmedUrl.startsWith("/auth/signin") ||
    trimmedUrl.startsWith("/auth/signup")
  ) {
    return fallback;
  }

  return trimmedUrl;
}
