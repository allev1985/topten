import { createHash } from "crypto";

/**
 * Returns a short, non-reversible hash of an identifier (email, IP, user ID, etc.)
 * for safe structured logging without exposing PII.
 *
 * Example: hashIdentifier("user@example.com") -> "sha256:3d4f8a1c9e72"
 */
export function hashIdentifier(identifier: string): string {
  const hex = createHash("sha256").update(identifier).digest("hex");
  return `sha256:${hex.slice(0, 12)}`;
}
