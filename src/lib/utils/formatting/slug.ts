/**
 * Generates a URL-safe vanity slug from a display name or email local part.
 *
 * Appends a short random suffix so duplicate names don't collide on insert.
 * Max length is capped at 50 characters to match the DB column.
 */
export function generateVanitySlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 40) || "user";

  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}
