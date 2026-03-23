import { z } from "zod";
import { config } from "@/lib/config/client";

/**
 * Schema for a single tag label.
 */
export const tagLabelSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(
    config.tags.maxLabelLength,
    `Tag must be ${config.tags.maxLabelLength} characters or fewer`
  );

/**
 * Schema for the tags field on create/update forms.
 * Accepts a JSON-encoded array of label strings.
 */
export const tagsFieldSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") return [];
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  z
    .array(tagLabelSchema)
    .max(
      config.tags.maxPerEntity,
      `A maximum of ${config.tags.maxPerEntity} tags is allowed`
    )
);

/**
 * Schema for setting tags on an entity.
 */
export const setTagsSchema = z.object({
  entityId: z.string().min(1, "ID is required"),
  tags: tagsFieldSchema,
});

/** Inferred input type for setTags. */
export type SetTagsInput = z.infer<typeof setTagsSchema>;
