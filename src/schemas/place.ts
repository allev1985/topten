import { z } from "zod";
import { tagsFieldSchema } from "./tag";

/**
 * Schema for creating a new place via Google Places selection.
 * All coordinate and ID fields come from the Google Places API response.
 * description and heroImageUrl are optional — not all place types return them.
 */
export const createPlaceSchema = z.object({
  googlePlaceId: z.string().min(1, "Google Place ID is required"),
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
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude"),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid longitude"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .nullable()
    .optional(),
  heroImageUrl: z
    .string()
    .url("Invalid hero image URL")
    .max(2048, "URL must be 2048 characters or fewer")
    .nullable()
    .optional(),
  tags: tagsFieldSchema.optional().default([]),
});

/**
 * Schema for updating an existing place.
 * Only description is editable — all other fields are immutable after creation.
 */
export const updatePlaceSchema = z.object({
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .nullable()
    .optional(),
});

/** Inferred input type for createPlace */
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

/** Inferred input type for updatePlace */
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;
