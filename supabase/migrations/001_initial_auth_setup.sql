-- Migration: 001_initial_auth_setup.sql
-- Description: Configure RLS policies for all tables and link users to Supabase Auth
-- Date: 2025-11-29

-- ============================================
-- Enable RLS on all tables
-- ============================================

-- Enable RLS on users table
-- Rationale: Protect user data - users should only access their own data or public profiles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lists table
-- Rationale: Users can only manage their own lists; published lists are publicly viewable
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Enable RLS on places table
-- Rationale: Places are shared reference data; authenticated users can add/update
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Enable RLS on list_places table
-- Rationale: Junction table access depends on list ownership/visibility
ALTER TABLE list_places ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users table policies
-- ============================================

-- Allow users to select their own full profile
-- Rationale: Users need full access to their own profile data including private fields
CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow anyone to view public profile information (non-deleted users)
-- Rationale: Public profiles (name, bio, avatar, vanity_slug) are viewable by anyone
-- SECURITY NOTE: This policy allows SELECT on all columns. The application layer
-- MUST control which fields are exposed in API responses. For public profiles,
-- only expose: id, name, bio, avatar_url, vanity_slug.
-- DO NOT expose: email (private data).
CREATE POLICY users_select_public ON users
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Allow users to update only their own profile
-- Rationale: Users can only modify their own profile data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (id must match auth.uid())
-- Rationale: Profile creation happens on signup; id must match authenticated user
CREATE POLICY users_insert_own ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: No DELETE policy - use soft deletes via UPDATE (set deleted_at)
-- Hard deletes are prevented by lack of DELETE policy

-- ============================================
-- Lists table policies
-- ============================================

-- Allow users to select their own lists (including unpublished)
-- Rationale: List owners can see all their lists regardless of publish status
CREATE POLICY lists_select_own ON lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Allow anyone to view published lists
-- Rationale: Published lists are publicly viewable by anyone
CREATE POLICY lists_select_published ON lists
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND deleted_at IS NULL);

-- Allow users to insert their own lists
-- Rationale: Users can create lists under their own account
CREATE POLICY lists_insert_own ON lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own lists
-- Rationale: Users can edit their own lists (publish, unpublish, modify)
CREATE POLICY lists_update_own ON lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Places table policies
-- ============================================

-- Allow anyone to view places (public reference data)
-- Rationale: Places are shared across all users; anyone can view them
CREATE POLICY places_select_all ON places
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Allow authenticated users to insert places
-- Rationale: Any authenticated user can add new places (cached from Google Places)
CREATE POLICY places_insert_authenticated ON places
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update places (for refreshing Google Places data)
-- Rationale: Places data may need to be refreshed when Google Places data changes
CREATE POLICY places_update_authenticated ON places
  FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

-- ============================================
-- ListPlaces table policies
-- ============================================

-- Allow viewing list_places based on list visibility
-- Rationale: Can only see list_places if the associated list is visible (published or owned)
CREATE POLICY list_places_select_via_list ON list_places
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.deleted_at IS NULL
      AND (
        lists.is_published = true
        OR (auth.uid() IS NOT NULL AND lists.user_id = auth.uid())
      )
    )
    AND list_places.deleted_at IS NULL
  );

-- Allow list owners to insert into their lists
-- Rationale: Only the list owner can add places to their list
CREATE POLICY list_places_insert_owner ON list_places
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
      AND lists.deleted_at IS NULL
    )
  );

-- Allow list owners to update their list_places
-- Rationale: Only the list owner can modify place order, hero image, etc.
CREATE POLICY list_places_update_owner ON list_places
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
    )
    AND list_places.deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Allow list owners to delete from their lists
-- Rationale: Only the list owner can remove places from their list
CREATE POLICY list_places_delete_owner ON list_places
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- ============================================
-- Foreign key constraint to auth.users
-- ============================================

-- Link users table to Supabase Auth users table
-- Rationale: Ensures referential integrity between application users and auth users
-- Note: Only add this constraint on new deployments or after ensuring
-- all existing users.id values have corresponding auth.users entries.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;
