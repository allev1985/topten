-- ============================================================
-- 0001_add_place_indexes
-- Adds two performance indexes required by the Places Service
-- (spec: specs/006-places-service/).
--
-- places_deleted_at_idx     — speeds up isNull(places.deletedAt) filters
--                             used by every Places Service query.
-- list_places_place_id_idx  — speeds up joins/filters on list_places.place_id
--                             used by getAvailablePlacesForList and
--                             ownership checks in addExistingPlaceToList,
--                             updatePlace, and deletePlaceFromList.
-- ============================================================

CREATE INDEX "places_deleted_at_idx" ON "places" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "list_places_place_id_idx" ON "list_places" USING btree ("place_id");
