/*
  # Convert is_admin() from SECURITY DEFINER to SECURITY INVOKER

  ## Problem
  - The `is_admin()` function is SECURITY DEFINER, meaning it runs with the
    privileges of the function owner (superuser) rather than the calling user.
  - This is exposed via /rest/v1/rpc/is_admin to all authenticated users.
  - SECURITY DEFINER bypasses RLS, which is a privilege escalation risk.

  ## Solution
  1. Rewrite `is_admin()` as SECURITY INVOKER
     - The function now runs with the caller's privileges and respects RLS
  2. Fix the circular dependency on the `profiles` table
     - The profiles SELECT and UPDATE policies previously called `is_admin()`,
       which itself queries profiles, creating infinite recursion under SECURITY INVOKER
     - Replace `is_admin()` in profiles policies with an inline subquery that
       checks the user's role directly (using auth.uid() = id to read own row,
       which avoids recursion since it doesn't call is_admin())
  3. All other RLS policies (contacts, events, reminders, etc.) continue using
     `is_admin()` unchanged -- they work because is_admin() queries profiles,
     and the profiles SELECT policy no longer calls is_admin()

  ## Tables modified
  - `profiles` - SELECT and UPDATE policies replaced with inline admin check

  ## Functions modified
  - `is_admin()` - Changed from SECURITY DEFINER to SECURITY INVOKER

  ## Security impact
  - is_admin() can no longer bypass RLS when called via the REST API
  - Admin functionality in RLS policies is preserved
  - No data access changes for normal users or admins
*/

-- ============================================================
-- 1. Fix profiles policies to remove is_admin() dependency
--    (must be done BEFORE changing is_admin to SECURITY INVOKER)
-- ============================================================

-- Drop existing profiles SELECT policy that uses is_admin()
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

-- Create new profiles SELECT policy with inline admin check
-- Users can read their own profile. Admins (role='admin') can read all profiles.
-- The admin check uses a subquery on profiles with id = auth.uid() which is
-- allowed by the self-access part of THIS SAME policy (no recursion).
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = ( SELECT auth.uid() )
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = ( SELECT auth.uid() ) AND p.role = 'admin'
    )
  );

-- Drop existing profiles UPDATE policy that uses is_admin()
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;

-- Create new profiles UPDATE policy with inline admin check
CREATE POLICY "Users can update own profile or admins can update all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = ( SELECT auth.uid() )
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = ( SELECT auth.uid() ) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    id = ( SELECT auth.uid() )
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = ( SELECT auth.uid() ) AND p.role = 'admin'
    )
  );

-- ============================================================
-- 2. Recreate is_admin() as SECURITY INVOKER
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Ensure grants are correct: only authenticated can execute
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
