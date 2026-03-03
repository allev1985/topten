-- ============================================================
-- 0000_initial_schema
-- Creates all application tables and the auth.users → public.users
-- profile trigger. Tables are in the public schema; auth.users is
-- owned by Supabase and referenced here via a cross-schema FK only.
-- ============================================================

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"bio" text,
	"avatar_url" varchar(2048),
	"vanity_slug" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_vanity_slug_unique" UNIQUE("vanity_slug")
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_place_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "places_google_place_id_unique" UNIQUE("google_place_id")
);
--> statement-breakpoint
CREATE TABLE "list_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"hero_image_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_auth_users_id_fk"
	FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "list_places" ADD CONSTRAINT "list_places_list_id_lists_id_fk"
	FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "list_places" ADD CONSTRAINT "list_places_place_id_places_id_fk"
	FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "users_vanity_slug_idx" ON "users" USING btree ("vanity_slug");
--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "lists_user_slug_idx" ON "lists" USING btree ("user_id", "slug");
--> statement-breakpoint
CREATE INDEX "lists_user_deleted_at_idx" ON "lists" USING btree ("user_id", "deleted_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "places_google_place_id_idx" ON "places" USING btree ("google_place_id");
--> statement-breakpoint
CREATE INDEX "list_places_list_position_idx" ON "list_places" USING btree ("list_id", "position");
--> statement-breakpoint
CREATE UNIQUE INDEX "list_places_list_place_idx" ON "list_places" USING btree ("list_id", "place_id");
--> statement-breakpoint

-- ============================================================
-- Trigger: auto-create a public.users profile row for every new
-- auth.users row (email/password signup, OAuth, admin API, etc.).
--
-- The signup server action must pass `name` and `vanity_slug` via
-- supabase.auth.signUp({ options: { data: { name, vanity_slug } } })
-- so the trigger can read them from raw_user_meta_data.
--
-- Fallbacks:
--   name         → email prefix (e.g. "alice" from "alice@example.com")
--                  → auth user UUID if email is also absent
--   vanity_slug  → requested slug if available, otherwise auth user UUID
--                  (pre-checked to avoid unique conflicts; app can prompt
--                  the user to personalise it later)
--
-- Conflict handling:
--   ON CONFLICT (id) DO NOTHING  — silently skips if a profile row already
--     exists (e.g. pre-seeded in tests or a retried auth insert).
--   vanity_slug conflicts — resolved before the INSERT via an existence
--     check; falls back to the auth UUID which cannot conflict with an
--     existing slug because it matches this row's own PK.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, vanity_slug)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      CASE
        WHEN NEW.email IS NULL OR NEW.email = '' THEN NULL
        ELSE split_part(NEW.email, '@', 1)
      END,
      NEW.id::text
    ),
    CASE
      WHEN NULLIF(NEW.raw_user_meta_data->>'vanity_slug', '') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.users
          WHERE vanity_slug = NEW.raw_user_meta_data->>'vanity_slug'
        )
      THEN NEW.raw_user_meta_data->>'vanity_slug'
      ELSE NEW.id::text
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint

-- ============================================================
-- Row Level Security (RLS)
-- Protects public tables from unauthenticated/unauthorized
-- access via PostgREST (Supabase anon key).
-- Server-side code that uses the service_role key or a direct
-- DATABASE_URL connection bypasses RLS automatically.
-- ============================================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lists" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "places" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "list_places" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- users: anyone can read non-deleted profiles (needed for /@vanity_slug routes)
CREATE POLICY "users_select_public" ON "users"
  FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint

-- users: the trigger (SECURITY DEFINER) handles profile creation on signup;
-- this policy covers direct inserts (admin tooling, tests) where auth context is set
CREATE POLICY "users_insert_own" ON "users"
  FOR INSERT WITH CHECK (auth.uid() = id);
--> statement-breakpoint

-- users: only the account owner can update their own profile;
-- WITH CHECK prevents reassigning id to a different auth user
CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
--> statement-breakpoint

-- lists: public can read published non-deleted lists; owner can also read their own drafts
CREATE POLICY "lists_select_public_or_owner" ON "lists"
  FOR SELECT USING (
    deleted_at IS NULL AND (is_published = true OR user_id = auth.uid())
  );
--> statement-breakpoint

-- lists: authenticated users can create lists for themselves
CREATE POLICY "lists_insert_own" ON "lists"
  FOR INSERT WITH CHECK (user_id = auth.uid());
--> statement-breakpoint

-- lists: only the list owner can update their own lists;
-- WITH CHECK prevents transferring a list to a different user
CREATE POLICY "lists_update_own" ON "lists"
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint

-- places: anyone can read non-deleted places (public reference / cached Google Places data)
CREATE POLICY "places_select_public" ON "places"
  FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint

-- places: any authenticated user can cache a new place from the Google Places API
CREATE POLICY "places_insert_authenticated" ON "places"
  FOR INSERT TO authenticated WITH CHECK (true);
--> statement-breakpoint

-- places: any authenticated user can refresh cached Google Places data
CREATE POLICY "places_update_authenticated" ON "places"
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);
--> statement-breakpoint

-- list_places: public can read entries for published lists; list owner can read all their entries
CREATE POLICY "list_places_select_public_or_owner" ON "list_places"
  FOR SELECT USING (
    deleted_at IS NULL AND EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
        AND lists.deleted_at IS NULL
        AND (lists.is_published = true OR lists.user_id = auth.uid())
    )
  );
--> statement-breakpoint

-- list_places: only the list owner can add entries to their lists
CREATE POLICY "list_places_insert_own" ON "list_places"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
        AND lists.user_id = auth.uid()
    )
  );
--> statement-breakpoint

-- list_places: only the list owner can update entries in their lists;
-- WITH CHECK prevents moving an entry to a list owned by a different user
CREATE POLICY "list_places_update_own" ON "list_places"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
        AND lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
        AND lists.user_id = auth.uid()
    )
  );
