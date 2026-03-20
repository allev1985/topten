-- Initial schema for myfaves (BetterAuth + standard PostgreSQL)
--
-- Tables: users, sessions, accounts, verifications (BetterAuth)
--         lists, places, list_places (application data)

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE TABLE "users" (
  "id"             text         PRIMARY KEY,
  "name"           varchar(255) NOT NULL,
  "email"          varchar(255) NOT NULL UNIQUE,
  "email_verified" boolean      NOT NULL DEFAULT false,
  "image"          varchar(2048),
  "created_at"     timestamptz  NOT NULL,
  "updated_at"     timestamptz  NOT NULL,
  "vanity_slug"    varchar(50)  NOT NULL UNIQUE,
  "bio"            text,
  "deleted_at"     timestamptz
);

CREATE UNIQUE INDEX "users_vanity_slug_idx" ON "users" ("vanity_slug");
CREATE UNIQUE INDEX "users_email_idx"       ON "users" ("email");
CREATE INDEX        "users_deleted_at_idx"  ON "users" ("deleted_at");

-- ---------------------------------------------------------------------------
-- sessions (BetterAuth)
-- ---------------------------------------------------------------------------

CREATE TABLE "sessions" (
  "id"          text        PRIMARY KEY,
  "expires_at"  timestamptz NOT NULL,
  "token"       text        NOT NULL UNIQUE,
  "created_at"  timestamptz NOT NULL,
  "updated_at"  timestamptz NOT NULL,
  "ip_address"  text,
  "user_agent"  text,
  "user_id"     text        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");

-- ---------------------------------------------------------------------------
-- accounts — credential + OAuth providers (BetterAuth)
-- ---------------------------------------------------------------------------

CREATE TABLE "accounts" (
  "id"                       text        PRIMARY KEY,
  "account_id"               text        NOT NULL,
  "provider_id"              text        NOT NULL,
  "user_id"                  text        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token"             text,
  "refresh_token"            text,
  "id_token"                 text,
  "access_token_expires_at"  timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope"                    text,
  "password"                 text,
  "created_at"               timestamptz NOT NULL,
  "updated_at"               timestamptz NOT NULL
);

CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");

-- ---------------------------------------------------------------------------
-- verifications — email and password-reset tokens (BetterAuth)
-- ---------------------------------------------------------------------------

CREATE TABLE "verifications" (
  "id"          text        PRIMARY KEY,
  "identifier"  text        NOT NULL,
  "value"       text        NOT NULL,
  "expires_at"  timestamptz NOT NULL,
  "created_at"  timestamptz,
  "updated_at"  timestamptz
);

-- ---------------------------------------------------------------------------
-- lists
-- ---------------------------------------------------------------------------

CREATE TABLE "lists" (
  "id"           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"      text         NOT NULL REFERENCES "users"("id"),
  "title"        varchar(255) NOT NULL,
  "slug"         varchar(255) NOT NULL,
  "description"  text,
  "is_published" boolean      NOT NULL DEFAULT false,
  "published_at" timestamptz,
  "created_at"   timestamptz  NOT NULL DEFAULT now(),
  "updated_at"   timestamptz  NOT NULL DEFAULT now(),
  "deleted_at"   timestamptz
);

CREATE UNIQUE INDEX "lists_user_slug_idx"      ON "lists" ("user_id", "slug");
CREATE INDEX        "lists_user_deleted_at_idx" ON "lists" ("user_id", "deleted_at");

-- ---------------------------------------------------------------------------
-- places
-- ---------------------------------------------------------------------------

CREATE TABLE "places" (
  "id"              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"         text          NOT NULL REFERENCES "users"("id"),
  "google_place_id" varchar(255)  NOT NULL,
  "name"            varchar(255)  NOT NULL,
  "address"         varchar(500)  NOT NULL,
  "latitude"        decimal(10,7) NOT NULL,
  "longitude"       decimal(10,7) NOT NULL,
  "description"     text,
  "hero_image_url"  varchar(2048),
  "created_at"      timestamptz   NOT NULL DEFAULT now(),
  "updated_at"      timestamptz   NOT NULL DEFAULT now(),
  "deleted_at"      timestamptz
);

CREATE UNIQUE INDEX "places_user_google_place_id_idx" ON "places" ("user_id", "google_place_id");
CREATE INDEX        "places_user_id_idx"               ON "places" ("user_id");
CREATE INDEX        "places_deleted_at_idx"             ON "places" ("deleted_at");

-- ---------------------------------------------------------------------------
-- list_places — junction table
-- ---------------------------------------------------------------------------

CREATE TABLE "list_places" (
  "id"             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "list_id"        uuid        NOT NULL REFERENCES "lists"("id"),
  "place_id"       uuid        NOT NULL REFERENCES "places"("id"),
  "position"       integer     NOT NULL,
  "hero_image_url" varchar(2048),
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "deleted_at"     timestamptz
);

CREATE INDEX        "list_places_list_position_idx" ON "list_places" ("list_id", "position");
CREATE UNIQUE INDEX "list_places_list_place_idx"    ON "list_places" ("list_id", "place_id");
CREATE INDEX        "list_places_place_id_idx"       ON "list_places" ("place_id");
