-- ============================================================
-- 0003_add_place_google_fields
--
-- Adds description and hero_image_url columns to the places
-- table to support Google Places API integration.
--
-- Changes:
--   1. Add places.description (nullable text) — user-editable
--      notes about the place; the only field editable after
--      creation.
--   2. Add places.hero_image_url (nullable varchar 2048) —
--      resolved from Google Places photo resource name at
--      creation time; immutable after creation.
-- ============================================================

ALTER TABLE "places" ADD COLUMN "description" text;
--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "hero_image_url" varchar(2048);
