-- Migration: Tags for lists and places
--
-- Adds the shared tags vocabulary plus list_tags and place_tags junction
-- tables. See docs/decisions/tags.md.

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

CREATE TABLE "tags" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"       varchar(64) NOT NULL,
  "label"      varchar(64) NOT NULL,
  "is_system"  boolean NOT NULL DEFAULT false,
  "user_id"    text REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE UNIQUE INDEX "tags_slug_idx"      ON "tags" ("slug");
CREATE INDEX        "tags_is_system_idx" ON "tags" ("is_system");
CREATE INDEX        "tags_user_id_idx"   ON "tags" ("user_id");

-- ---------------------------------------------------------------------------
-- list_tags
-- ---------------------------------------------------------------------------

CREATE TABLE "list_tags" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "list_id"    uuid NOT NULL REFERENCES "lists"("id"),
  "tag_id"     uuid NOT NULL REFERENCES "tags"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE UNIQUE INDEX "list_tags_list_tag_idx" ON "list_tags" ("list_id", "tag_id");
CREATE INDEX        "list_tags_tag_id_idx"   ON "list_tags" ("tag_id");

-- ---------------------------------------------------------------------------
-- place_tags
-- ---------------------------------------------------------------------------

CREATE TABLE "place_tags" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "place_id"   uuid NOT NULL REFERENCES "places"("id"),
  "tag_id"     uuid NOT NULL REFERENCES "tags"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE UNIQUE INDEX "place_tags_place_tag_idx" ON "place_tags" ("place_id", "tag_id");
CREATE INDEX        "place_tags_tag_id_idx"    ON "place_tags" ("tag_id");
