/*
  # Optimize RLS Policies - Part 2: Memories and Reminders

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Optimizes memories and reminders table policies
    
  2. Tables Updated
    - memories: All policies optimized
    - reminders: All policies optimized

  3. Performance
    - Prevents auth function re-evaluation per row
    - Improves query performance significantly at scale
*/

-- Memories policies
DROP POLICY IF EXISTS "Users can view own memories or admins can view all" ON memories;
CREATE POLICY "Users can view own memories or admins can view all"
  ON memories FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own memories or admins can insert all" ON memories;
CREATE POLICY "Users can insert own memories or admins can insert all"
  ON memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own memories or admins can update all" ON memories;
CREATE POLICY "Users can update own memories or admins can update all"
  ON memories FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own memories or admins can delete all" ON memories;
CREATE POLICY "Users can delete own memories or admins can delete all"
  ON memories FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- Reminders policies
DROP POLICY IF EXISTS "Users can view own reminders or admins can view all" ON reminders;
CREATE POLICY "Users can view own reminders or admins can view all"
  ON reminders FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own reminders or admins can insert all" ON reminders;
CREATE POLICY "Users can insert own reminders or admins can insert all"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own reminders or admins can update all" ON reminders;
CREATE POLICY "Users can update own reminders or admins can update all"
  ON reminders FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own reminders or admins can delete all" ON reminders;
CREATE POLICY "Users can delete own reminders or admins can delete all"
  ON reminders FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());