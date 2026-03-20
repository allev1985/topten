-- Migration: Add email-based MFA support
--
-- Adds two_factor_enabled flag to users and the two_factor table
-- required by BetterAuth's twoFactor plugin.
-- Existing users have MFA enabled immediately so all logins require
-- an email code from first use.

-- ---------------------------------------------------------------------------
-- users: add twoFactorEnabled flag
-- ---------------------------------------------------------------------------

ALTER TABLE "users"
  ADD COLUMN "two_factor_enabled" boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- two_factor (BetterAuth twoFactor plugin)
-- ---------------------------------------------------------------------------

CREATE TABLE "two_factor" (
  "id"           text PRIMARY KEY,
  "secret"       text NOT NULL,
  "backup_codes" text NOT NULL,
  "user_id"      text NOT NULL REFERENCES "users"("id")
);

CREATE INDEX "two_factor_secret_idx"  ON "two_factor" ("secret");
CREATE INDEX "two_factor_user_id_idx" ON "two_factor" ("user_id");

-- ---------------------------------------------------------------------------
-- Enable MFA for all existing users
-- ---------------------------------------------------------------------------

UPDATE "users" SET "two_factor_enabled" = true;
