-- ============================================================
-- 0002_add_user_id_to_places
--
-- Adds user_id to the places table so that each place is
-- directly owned by a user, rather than ownership being
-- derived indirectly through list_places → lists → user_id.
--
-- Changes:
--   1. Add places.user_id (NOT NULL, FK → users.id)
--   2. Drop the global unique constraint on google_place_id
--      (the same Google Place may now exist once per user)
--   3. Add composite unique index (user_id, google_place_id)
--   4. Add index on user_id for efficient per-user queries
--
-- NOTE: step 1 requires the table to be empty (or backfilled)
-- because user_id is NOT NULL. In a production migration with
-- existing rows, add the column as nullable, backfill, then
-- apply the NOT NULL constraint in a separate statement.
-- ============================================================

ALTER TABLE "places" ADD COLUMN "user_id" uuid NOT NULL REFERENCES "users"("id");
--> statement-breakpoint
ALTER TABLE "places" DROP CONSTRAINT "places_google_place_id_unique";
--> statement-breakpoint
DROP INDEX "places_google_place_id_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "places_user_google_place_id_idx" ON "places" USING btree ("user_id","google_place_id");
--> statement-breakpoint
CREATE INDEX "places_user_id_idx" ON "places" USING btree ("user_id");
