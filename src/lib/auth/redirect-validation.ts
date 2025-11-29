import { REDIRECT_ROUTES } from "@/lib/config";

/**
 * Validates that a URL is safe for redirection.
 * Prevents open redirect attacks by only allowing relative paths.
 *
 * Validation rules:
 * 1. Must be a non-empty string
 * 2. Must start with '/' but not '//'
 * 3. Must not contain protocol handlers (javascript:, data:, etc.)
 * 4. URL-decoded version must also pass validation
 * 5. Double-encoded URLs are rejected
 */
export function isValidRedirect(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();

  // Must start with / but not //
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }

  // Check for null byte injection
  if (trimmed.includes("\0") || trimmed.includes("\x00")) {
    return false;
  }

  // Block protocol handlers (javascript:, data:, etc.)
  // Check for : before the first / after the initial /
  const pathPart = trimmed.slice(1); // Remove leading /
  const colonIndex = pathPart.indexOf(":");
  const slashIndex = pathPart.indexOf("/");

  if (colonIndex !== -1 && (slashIndex === -1 || colonIndex < slashIndex)) {
    return false;
  }

  // Try decoding and re-validating (with depth limit to prevent DoS)
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed) {
      // Re-validate decoded version (single decode only to prevent infinite recursion)
      // Additional decoding attempts would indicate malicious input
      try {
        const reDecoded = decodeURIComponent(decoded);
        if (reDecoded !== decoded) {
          // Double-encoded URL - reject as potentially malicious
          return false;
        }
      } catch {
        // Error during second decode - this is fine, continue validation
      }

      // Check for null byte in decoded version
      if (decoded.includes("\0") || decoded.includes("\x00")) {
        return false;
      }

      // Check the decoded version with basic validation
      if (!decoded.startsWith("/") || decoded.startsWith("//")) return false;
      const decodedPath = decoded.slice(1);
      const decodedColon = decodedPath.indexOf(":");
      const decodedSlash = decodedPath.indexOf("/");
      if (
        decodedColon !== -1 &&
        (decodedSlash === -1 || decodedColon < decodedSlash)
      ) {
        return false;
      }
    }
  } catch {
    // Invalid URL encoding - reject
    return false;
  }

  return true;
}

/**
 * Returns a validated redirect URL or the default.
 * Always returns a safe URL for redirection.
 */
export function getValidatedRedirect(url: string | undefined | null): string {
  return isValidRedirect(url) ? url!.trim() : REDIRECT_ROUTES.default;
}
