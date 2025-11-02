/*
  # Optimize RLS Policies - Part 4: Sessions, Files, Meetings, and Session Notes

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Optimizes remaining table policies
    
  2. Tables Updated
    - sessions: All policies optimized
    - files: All policies optimized
    - meetings: All policies optimized
    - session_notes: All policies optimized

  3. Performance
    - Prevents auth function re-evaluation per row
    - Completes RLS optimization across all tables
*/

-- Sessions policies
DROP POLICY IF EXISTS "Users can view sessions or admins can view all" ON sessions;
CREATE POLICY "Users can view sessions or admins can view all"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert sessions or admins can insert all" ON sessions;
CREATE POLICY "Users can insert sessions or admins can insert all"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update sessions or admins can update all" ON sessions;
CREATE POLICY "Users can update sessions or admins can update all"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = (select auth.uid())
    ) OR is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete sessions or admins can delete all" ON sessions;
CREATE POLICY "Users can delete sessions or admins can delete all"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.user_id = (select auth.uid())
    ) OR is_admin()
  );

-- Files policies
DROP POLICY IF EXISTS "Users can view own files or admins can view all" ON files;
CREATE POLICY "Users can view own files or admins can view all"
  ON files FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own files or admins can insert all" ON files;
CREATE POLICY "Users can insert own files or admins can insert all"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own files or admins can update all" ON files;
CREATE POLICY "Users can update own files or admins can update all"
  ON files FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own files or admins can delete all" ON files;
CREATE POLICY "Users can delete own files or admins can delete all"
  ON files FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- Meetings policies
DROP POLICY IF EXISTS "Users can view own meetings or admins can view all" ON meetings;
CREATE POLICY "Users can view own meetings or admins can view all"
  ON meetings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own meetings or admins can insert all" ON meetings;
CREATE POLICY "Users can insert own meetings or admins can insert all"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own meetings or admins can update all" ON meetings;
CREATE POLICY "Users can update own meetings or admins can update all"
  ON meetings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own meetings or admins can delete all" ON meetings;
CREATE POLICY "Users can delete own meetings or admins can delete all"
  ON meetings FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- Session notes policies
DROP POLICY IF EXISTS "Users can view own session notes or admins can view all" ON session_notes;
CREATE POLICY "Users can view own session notes or admins can view all"
  ON session_notes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own session notes or admins can insert all" ON session_notes;
CREATE POLICY "Users can insert own session notes or admins can insert all"
  ON session_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own session notes or admins can update all" ON session_notes;
CREATE POLICY "Users can update own session notes or admins can update all"
  ON session_notes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own session notes or admins can delete all" ON session_notes;
CREATE POLICY "Users can delete own session notes or admins can delete all"
  ON session_notes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());