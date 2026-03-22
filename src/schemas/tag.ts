import { z } from "zod";

/**
 * Regex for valid tag names: 2-50 lowercase alphanumeric + hyphens,
 * must start and end with alphanumeric.
 */
const TAG_NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/;

/**
 * Schema for a single tag name field.
 */
export const tagNameField = z
  .string()
  .trim()
  .min(2, "Tag name must be at least 2 characters")
  .max(50, "Tag name must be 50 characters or fewer")
  .regex(
    TAG_NAME_REGEX,
    "Tag must be lowercase letters, numbers, and hyphens only"
  );

/**
 * Schema for creating a custom tag.
 */
export const createTagSchema = z.object({
  name: tagNameField,
});

/**
 * Schema for setting tags on a list.
 * Accepts an array of tag names (will be normalised server-side).
 */
export const setListTagsSchema = z.object({
  listId: z.string().uuid("Invalid list ID"),
  tagNames: z
    .array(z.string().trim().min(1))
    .max(20, "Maximum 20 tags per list"),
});

/**
 * Schema for setting tags on a place.
 * Accepts an array of tag names (will be normalised server-side).
 */
export const setPlaceTagsSchema = z.object({
  placeId: z.string().uuid("Invalid place ID"),
  tagNames: z
    .array(z.string().trim().min(1))
    .max(20, "Maximum 20 tags per place"),
});

/**
 * Schema for searching tags (autocomplete).
 */
export const searchTagsSchema = z.object({
  query: z.string().trim().min(1, "Search query is required"),
});

/** Inferred input type for createTag */
export type CreateTagInput = z.infer<typeof createTagSchema>;

/** Inferred input type for setListTags */
export type SetListTagsInput = z.infer<typeof setListTagsSchema>;

/** Inferred input type for setPlaceTags */
export type SetPlaceTagsInput = z.infer<typeof setPlaceTagsSchema>;

/** Inferred input type for searchTags */
export type SearchTagsInput = z.infer<typeof searchTagsSchema>;
