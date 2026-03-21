/**
 * PII-safe obfuscation helpers for structured logging.
 *
 * Values are one-way hashed so they cannot be reversed, but remain
 * consistent within a log session for correlation purposes.
 *
 * @module lib/services/logging/obfuscate
 */

import { createHash } from "crypto";

/**
 * Returns a short, one-way SHA-256 hash of a potentially sensitive value
 * (e.g. email address, IP address, user ID) safe to include in log fields.
 *
 * @param value - The PII value to obfuscate
 * @returns First 8 hex characters of the SHA-256 digest
 */
export function obfuscate(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
