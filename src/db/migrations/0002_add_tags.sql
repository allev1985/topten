-- Migration: Tags for places
--
-- Adds the shared tags vocabulary and place_tags junction table.
-- Tags belong to places only; list tags are derived on the fly as the
-- union of all place tags for places within that list.
-- See docs/decisions/tags.md.

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

CREATE TABLE "tags" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"       varchar(64) NOT NULL,
  "label"      varchar(64) NOT NULL,
  "is_system"  boolean NOT NULL DEFAULT false,
  "user_id"    text REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- System tags are globally unique by slug.
CREATE UNIQUE INDEX "tags_slug_system_idx" ON "tags" ("slug")          WHERE is_system = true;
-- Custom tags are unique per (user_id, slug) so different users can share the same label.
CREATE UNIQUE INDEX "tags_slug_user_idx"   ON "tags" ("slug", "user_id") WHERE is_system = false;
CREATE INDEX        "tags_is_system_idx"   ON "tags" ("is_system");
CREATE INDEX        "tags_user_id_idx"     ON "tags" ("user_id");

-- ---------------------------------------------------------------------------
-- place_tags
--
-- Hard-delete semantics: rows are removed directly when a tag is unset.
-- Custom user tags are garbage-collected from the tags table when they
-- become unreferenced.
-- ---------------------------------------------------------------------------

CREATE TABLE "place_tags" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "place_id"   uuid NOT NULL REFERENCES "places"("id"),
  "tag_id"     uuid NOT NULL REFERENCES "tags"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "place_tags_place_tag_idx" ON "place_tags" ("place_id", "tag_id");
CREATE INDEX        "place_tags_tag_id_idx"    ON "place_tags" ("tag_id");
