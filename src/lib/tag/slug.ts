/**
 * Tag slug normalisation helpers.
 * @module lib/tag/slug
 */

/** Maximum number of tags allowed on a single entity. */
export const MAX_TAGS_PER_ENTITY = 10;

/** Maximum length of a tag label / slug. */
export const MAX_TAG_LENGTH = 64;

/**
 * Normalise a raw tag label to its canonical slug form.
 *
 * Lower-cases, trims, strips characters outside `[a-z0-9 -]`, collapses
 * whitespace runs to a single hyphen, and collapses repeated hyphens.
 * `"Vegan Friendly!"` → `"vegan-friendly"`.
 *
 * @param raw - Raw label as entered by the user
 * @returns Normalised slug (may be empty if input was entirely stripped)
 */
export function normaliseTagSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_TAG_LENGTH);
}

/**
 * Derive a display label from a raw user input.
 *
 * Trims and collapses internal whitespace, preserving original casing.
 * `"  Vegan   Friendly  "` → `"Vegan Friendly"`.
 *
 * @param raw - Raw label as entered by the user
 * @returns Cleaned display label
 */
export function normaliseTagLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}
