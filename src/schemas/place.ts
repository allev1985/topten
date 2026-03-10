import { z } from "zod";

/**
 * Schema for creating a new place and attaching it to a list.
 * googlePlaceId is system-assigned (crypto.randomUUID).
 * latitude/longitude are stored as "0" until Google Places integration.
 */
export const createPlaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must be 500 characters or fewer"),
});

/**
 * Schema for updating an existing place.
 * At least one of name or address must be provided.
 * googlePlaceId is immutable and never accepted as input.
 */
export const updatePlaceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(255, "Name must be 255 characters or fewer")
      .optional(),
    address: z
      .string()
      .trim()
      .max(500, "Address must be 500 characters or fewer")
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.address !== undefined,
    {
      message: "At least one field (name or address) must be provided",
    }
  );

/** Inferred input type for createPlace */
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

/** Inferred input type for updatePlace */
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;
