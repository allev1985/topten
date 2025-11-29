/**
 * Masks email address for safe logging
 * Shows first 2 characters and domain only
 * Example: "test@example.com" -> "te***@example.com"
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  const local = parts[0] ?? "";
  const domain = parts[1];
  if (!domain || local.length <= 2) {
    return `${local.slice(0, 2)}***@${domain ?? "unknown"}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}
