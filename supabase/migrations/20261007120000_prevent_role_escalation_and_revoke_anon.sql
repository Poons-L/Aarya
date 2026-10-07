/*
  # Prevent self-promotion to admin, and close remaining anon grants

  ## Problem 1 (critical): any user could make themselves admin
  - profiles has an UPDATE policy allowing a user to update their own row, and an
    INSERT policy allowing them to insert their own row. Neither restricts columns.
  - So a signed-in user could send `PATCH /rest/v1/profiles?id=eq.<own id>` with
    `{"role":"admin"}` (or insert their profile with role 'admin' on first sign-in).
  - is_admin() then returns true, and every "... or admins can ..." policy on
    contacts, reminders, conversations, memories, files, meetings, sessions, etc.
    grants them read/write access to ALL users' data.

  ## Fix
  - A BEFORE INSERT/UPDATE trigger on profiles. For requests made through the API
    as an end user (JWT role 'authenticated' or 'anon'):
      - INSERT: role is forced to 'user'
      - UPDATE: changing role is rejected
  - Requests with the service_role key and direct SQL (dashboard / migrations)
    are unaffected, so promoting an admin still works from the Supabase dashboard.

  ## Problem 2: tables created after the April security audit kept default anon grants
  - RLS already returns no rows to anon on these tables, but the anon role should
    hold no privileges at all, matching the other tables.

  ## Afterwards: check no one already promoted themselves
      SELECT id, email, role, updated_at FROM public.profiles WHERE role = 'admin';
*/

-- ============================================================
-- 1. Lock the role column against end-user changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
BEGIN
  -- Only constrain end-user API requests; service_role and direct SQL pass through
  IF jwt_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing role is not allowed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ============================================================
-- 2. Revoke anon privileges on tables created after the April audit
-- ============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contact_insights',
    'contact_interactions',
    'generated_talking_points',
    'feedback'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
      EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
