import { z } from "zod";

/**
 * Schema for creating a new list.
 * Only title is accepted — slug is system-assigned.
 */
export const createListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
});

/**
 * Schema for updating an existing list's metadata.
 * At least one of title or description must be provided.
 * Slug is never accepted — it is immutable after creation.
 */
export const updateListSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(255, "Title must be 255 characters or fewer")
      .optional(),
    description: z
      .string()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.description !== undefined,
    {
      message: "At least one field (title or description) must be provided",
    }
  );

/** Inferred input type for createList */
export type CreateListInput = z.infer<typeof createListSchema>;

/** Inferred input type for updateList */
export type UpdateListInput = z.infer<typeof updateListSchema>;
