/*
  # Add Admin Role System

  1. Changes
    - Add `role` column to `profiles` table with values: 'user', 'admin'
    - Default role is 'user'
    - Update all RLS policies to allow admin users full access to all data
    
  2. Security
    - Admin users (role = 'admin') can view and manage all data across all users
    - Regular users (role = 'user') can only access their own data
    - Users cannot change their own role (must be done via database)
    
  3. Tables Affected
    - profiles: Add role column
    - All tables: Update RLS policies to include admin bypass
*/

-- Add role column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' NOT NULL;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile or admins can view all"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile or admins can update all"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Update RLS policies for contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts or admins can view all"
  ON contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
CREATE POLICY "Users can insert own contacts or admins can insert all"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
CREATE POLICY "Users can update own contacts or admins can update all"
  ON contacts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Users can delete own contacts or admins can delete all"
  ON contacts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for memories
DROP POLICY IF EXISTS "Users can view own memories" ON memories;
CREATE POLICY "Users can view own memories or admins can view all"
  ON memories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
CREATE POLICY "Users can insert own memories or admins can insert all"
  ON memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own memories" ON memories;
CREATE POLICY "Users can update own memories or admins can update all"
  ON memories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own memories" ON memories;
CREATE POLICY "Users can delete own memories or admins can delete all"
  ON memories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders or admins can view all"
  ON reminders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
CREATE POLICY "Users can insert own reminders or admins can insert all"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
CREATE POLICY "Users can update own reminders or admins can update all"
  ON reminders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
CREATE POLICY "Users can delete own reminders or admins can delete all"
  ON reminders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations or admins can view all"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
CREATE POLICY "Users can insert own conversations or admins can insert all"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations or admins can update all"
  ON conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
CREATE POLICY "Users can delete own conversations or admins can delete all"
  ON conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for events
DROP POLICY IF EXISTS "Users can view own events" ON events;
CREATE POLICY "Users can view own events or admins can view all"
  ON events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events or admins can insert all"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events or admins can update all"
  ON events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events or admins can delete all"
  ON events FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for sessions
DROP POLICY IF EXISTS "Users can view sessions for their events" ON sessions;
CREATE POLICY "Users can view sessions or admins can view all"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert sessions for their events" ON sessions;
CREATE POLICY "Users can insert sessions or admins can insert all"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update sessions for their events" ON sessions;
CREATE POLICY "Users can update sessions or admins can update all"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = auth.uid()
    ) OR is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete sessions for their events" ON sessions;
CREATE POLICY "Users can delete sessions or admins can delete all"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = auth.uid()
    ) OR is_admin()
  );

-- Update RLS policies for files
DROP POLICY IF EXISTS "Users can view own files" ON files;
CREATE POLICY "Users can view own files or admins can view all"
  ON files FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own files" ON files;
CREATE POLICY "Users can insert own files or admins can insert all"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own files" ON files;
CREATE POLICY "Users can update own files or admins can update all"
  ON files FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own files" ON files;
CREATE POLICY "Users can delete own files or admins can delete all"
  ON files FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for meetings
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
CREATE POLICY "Users can view own meetings or admins can view all"
  ON meetings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own meetings" ON meetings;
CREATE POLICY "Users can insert own meetings or admins can insert all"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
CREATE POLICY "Users can update own meetings or admins can update all"
  ON meetings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
CREATE POLICY "Users can delete own meetings or admins can delete all"
  ON meetings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Update RLS policies for session_notes
DROP POLICY IF EXISTS "Users can view own session notes" ON session_notes;
CREATE POLICY "Users can view own session notes or admins can view all"
  ON session_notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own session notes" ON session_notes;
CREATE POLICY "Users can insert own session notes or admins can insert all"
  ON session_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own session notes" ON session_notes;
CREATE POLICY "Users can update own session notes or admins can update all"
  ON session_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own session notes" ON session_notes;
CREATE POLICY "Users can delete own session notes or admins can delete all"
  ON session_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());