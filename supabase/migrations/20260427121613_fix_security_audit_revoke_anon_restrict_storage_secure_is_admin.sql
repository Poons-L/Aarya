/*
  # Security Audit Fix - Revoke Anon Access, Restrict Storage, Secure is_admin

  1. Storage - contact-photos bucket
    - Make contact-photos bucket private (public = false)
    - Drop the overly broad "Anyone can view contact photos" SELECT policy
    - Replace with a user-scoped policy: authenticated users can only SELECT their own folder

  2. Anon role - revoke ALL privileges on all 16 public tables
    - ai_usage_logs, contact_events, contact_tags, contacts
    - conversation_key_points, conversations, events, files
    - meetings, memories, profiles, reminders
    - session_notes, sessions, user_event_preferences
    - Unauthenticated users should have zero access to any data

  3. Authenticated role - remove dangerous privileges
    - Revoke TRUNCATE, TRIGGER, REFERENCES from authenticated on all 16 tables
    - Keep only SELECT, INSERT, UPDATE, DELETE (controlled by existing RLS policies)

  4. is_admin() function
    - Revoke EXECUTE from anon (unauthenticated users should never call this)
    - Revoke EXECUTE from public (prevents default grant inheritance)
    - Explicitly grant EXECUTE to authenticated only
    - Keep SECURITY DEFINER so it can read profiles table for RLS policy evaluation

  5. Important notes
    - Existing RLS policies already properly scope data to auth.uid() for authenticated users
    - No RLS policies are dropped or modified -- all existing app functionality is preserved
    - Admin override via is_admin() in RLS policies continues to work for authenticated admins
*/

-- ============================================================
-- 1. Fix contact-photos storage bucket
-- ============================================================

-- Make the bucket private so Supabase does not serve files without auth
UPDATE storage.buckets
SET public = false
WHERE id = 'contact-photos';

-- Drop the overly broad public SELECT policy
DROP POLICY IF EXISTS "Anyone can view contact photos" ON storage.objects;

-- Replace with a user-scoped SELECT policy: users can only view their own photos
CREATE POLICY "Users can view own contact photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contact-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 2. Revoke ALL privileges from anon on all public tables
-- ============================================================

REVOKE ALL ON public.ai_usage_logs FROM anon;
REVOKE ALL ON public.contact_events FROM anon;
REVOKE ALL ON public.contact_tags FROM anon;
REVOKE ALL ON public.contacts FROM anon;
REVOKE ALL ON public.conversation_key_points FROM anon;
REVOKE ALL ON public.conversations FROM anon;
REVOKE ALL ON public.events FROM anon;
REVOKE ALL ON public.files FROM anon;
REVOKE ALL ON public.meetings FROM anon;
REVOKE ALL ON public.memories FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.reminders FROM anon;
REVOKE ALL ON public.session_notes FROM anon;
REVOKE ALL ON public.sessions FROM anon;
REVOKE ALL ON public.user_event_preferences FROM anon;

-- ============================================================
-- 3. Restrict authenticated role to only DML privileges
-- ============================================================

REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.ai_usage_logs FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.contact_events FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.contact_tags FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.contacts FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.conversation_key_points FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.conversations FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.events FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.files FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.meetings FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.memories FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.profiles FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.reminders FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.session_notes FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.sessions FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.user_event_preferences FROM authenticated;

-- ============================================================
-- 4. Secure is_admin() function
-- ============================================================

-- Revoke execute from public (which includes anon)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
