/*
  # Fix "infinite recursion detected in policy for relation profiles"

  ## Problem (production outage)
  - 20260427125440 rewrote the profiles SELECT/UPDATE policies with an inline
    `EXISTS (SELECT 1 FROM public.profiles ...)` admin check, and made is_admin()
    SECURITY INVOKER. A policy on profiles that queries profiles re-triggers the
    same policy, so Postgres aborts with error 42P17.
  - Every policy that calls is_admin() (contacts, reminders, conversations, ...)
    queries profiles too, so signed-in users get HTTP 500 loading their profile,
    contacts and reminders. The app then retries creating the profile and gets
    duplicate-key (409) errors.

  ## Fix
  - is_admin() becomes SECURITY DEFINER again, so its lookup of the caller's own
    role is not subject to RLS and can't recurse. It only ever returns a boolean
    about the caller (auth.uid()), so exposing it via RPC reveals nothing else.
    search_path is pinned to '' and every name is schema-qualified.
  - profiles SELECT/UPDATE policies use is_admin() instead of the inline subquery.
  - Role changes stay blocked by the protect_profile_role trigger (20261007115615).
*/

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
CREATE POLICY "Users can update own profile or admins can update all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());
