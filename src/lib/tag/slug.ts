/**
 * Tag slug normalisation helpers.
 * @module lib/tag/slug
 */

import { config } from "@/lib/config/client";

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
    .slice(0, config.tags.maxLabelLength);
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
  return raw.trim().replace(/\s+/g, " ").slice(0, config.tags.maxLabelLength);
}
