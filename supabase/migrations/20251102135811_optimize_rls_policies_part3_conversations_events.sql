/*
  # Optimize RLS Policies - Part 3: Conversations and Events

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Optimizes conversations, conversation_key_points, and events policies
    
  2. Tables Updated
    - conversations: All policies optimized
    - conversation_key_points: All policies optimized
    - events: All policies optimized
    - user_event_preferences: All policies optimized

  3. Performance
    - Prevents auth function re-evaluation per row
    - Improves scalability
*/

-- Conversations policies
DROP POLICY IF EXISTS "Users can view own conversations or admins can view all" ON conversations;
CREATE POLICY "Users can view own conversations or admins can view all"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own conversations or admins can insert all" ON conversations;
CREATE POLICY "Users can insert own conversations or admins can insert all"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own conversations or admins can update all" ON conversations;
CREATE POLICY "Users can update own conversations or admins can update all"
  ON conversations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own conversations or admins can delete all" ON conversations;
CREATE POLICY "Users can delete own conversations or admins can delete all"
  ON conversations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- Conversation key points policies
DROP POLICY IF EXISTS "Users can view key points for own conversations" ON conversation_key_points;
CREATE POLICY "Users can view key points for own conversations"
  ON conversation_key_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_key_points.conversation_id
      AND conversations.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert key points for own conversations" ON conversation_key_points;
CREATE POLICY "Users can insert key points for own conversations"
  ON conversation_key_points FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_key_points.conversation_id
      AND conversations.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete key points for own conversations" ON conversation_key_points;
CREATE POLICY "Users can delete key points for own conversations"
  ON conversation_key_points FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_key_points.conversation_id
      AND conversations.user_id = (select auth.uid())
    ) OR is_admin()
  );

-- Events policies
DROP POLICY IF EXISTS "Users can view own events or admins can view all" ON events;
CREATE POLICY "Users can view own events or admins can view all"
  ON events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own events or admins can insert all" ON events;
CREATE POLICY "Users can insert own events or admins can insert all"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own events or admins can update all" ON events;
CREATE POLICY "Users can update own events or admins can update all"
  ON events FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own events or admins can delete all" ON events;
CREATE POLICY "Users can delete own events or admins can delete all"
  ON events FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- User event preferences policies
DROP POLICY IF EXISTS "Users can view own event preferences" ON user_event_preferences;
CREATE POLICY "Users can view own event preferences"
  ON user_event_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can create own event preferences" ON user_event_preferences;
CREATE POLICY "Users can create own event preferences"
  ON user_event_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own event preferences" ON user_event_preferences;
CREATE POLICY "Users can update own event preferences"
  ON user_event_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own event preferences" ON user_event_preferences;
CREATE POLICY "Users can delete own event preferences"
  ON user_event_preferences FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());