/*
  # Optimize RLS Policies - Part 1: Profiles and Contacts

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale
    
  2. Tables Updated
    - profiles: All policies optimized
    - contacts: All policies optimized
    - contact_tags: All policies optimized
    - contact_events: All policies optimized

  3. Security
    - No change to security model
    - Same access controls, better performance
*/

-- Profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON profiles;
CREATE POLICY "Users can view own profile or admins can view all"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id OR is_admin());

DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON profiles;
CREATE POLICY "Users can update own profile or admins can update all"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id OR is_admin())
  WITH CHECK ((select auth.uid()) = id OR is_admin());

-- Contacts policies
DROP POLICY IF EXISTS "Users can view own contacts or admins can view all" ON contacts;
CREATE POLICY "Users can view own contacts or admins can view all"
  ON contacts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can insert own contacts or admins can insert all" ON contacts;
CREATE POLICY "Users can insert own contacts or admins can insert all"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can update own contacts or admins can update all" ON contacts;
CREATE POLICY "Users can update own contacts or admins can update all"
  ON contacts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Users can delete own contacts or admins can delete all" ON contacts;
CREATE POLICY "Users can delete own contacts or admins can delete all"
  ON contacts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- Contact tags policies
DROP POLICY IF EXISTS "Users can view tags for own contacts" ON contact_tags;
CREATE POLICY "Users can view tags for own contacts"
  ON contact_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert tags for own contacts" ON contact_tags;
CREATE POLICY "Users can insert tags for own contacts"
  ON contact_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete tags for own contacts" ON contact_tags;
CREATE POLICY "Users can delete tags for own contacts"
  ON contact_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );

-- Contact events policies
DROP POLICY IF EXISTS "Users can view contact events for their contacts" ON contact_events;
CREATE POLICY "Users can view contact events for their contacts"
  ON contact_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can create contact events for their contacts" ON contact_events;
CREATE POLICY "Users can create contact events for their contacts"
  ON contact_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update contact events for their contacts" ON contact_events;
CREATE POLICY "Users can update contact events for their contacts"
  ON contact_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete contact events for their contacts" ON contact_events;
CREATE POLICY "Users can delete contact events for their contacts"
  ON contact_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = (select auth.uid())
    ) OR is_admin()
  );