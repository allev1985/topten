import { z } from "zod";

/**
 * Schema for updating the user's display name.
 * Maps directly to the `users.name` column (varchar 255).
 */
export const updateNameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name is too long")
    .trim(),
});

/**
 * Schema for updating the user's vanity slug (profile URL).
 * Enforces format: lowercase alphanumeric and hyphens only,
 * must start and end with an alphanumeric character, 2–50 chars.
 */
export const updateSlugSchema = z.object({
  vanitySlug: z
    .string()
    .min(1, "Profile URL is required")
    .min(2, "URL must be at least 2 characters")
    .max(50, "URL must be 50 characters or fewer")
    .regex(
      /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/,
      "URL can only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number"
    ),
});

/**
 * Success data returned by updateNameAction.
 */
export interface UpdateNameSuccessData {
  /** The saved name value */
  name: string;
}

/**
 * Success data returned by updateSlugAction.
 */
export interface UpdateSlugSuccessData {
  /** The saved vanity slug value */
  vanitySlug: string;
}
