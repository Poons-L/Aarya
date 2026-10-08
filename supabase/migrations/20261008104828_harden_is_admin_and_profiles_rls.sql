/*
# Harden is_admin function and tighten profiles RLS policies

## Summary
1. Recreates `public.is_admin()` as a SECURITY DEFINER, STABLE SQL function
   with a locked-down `search_path = ''` so it cannot be hijacked via
   search-path manipulation.
2. Revokes execution from `public` and `anon` — only `authenticated` can call it.
3. Replaces the profiles SELECT and UPDATE policies so that:
   - Users can read/update their own profile, OR
   - Admins (as determined by `is_admin()`) can read/update any profile.
   This enables the admin dashboard to list all profiles without granting
   blanket access to unauthenticated users.

## Security changes
- `is_admin()`: SECURITY DEFINER, `search_path = ''`, execution limited to
  `authenticated` only. The function checks `profiles.role = 'admin'` for the
  calling user.
- profiles SELECT policy: `id = auth.uid() OR public.is_admin()`
- profiles UPDATE policy: same predicate in USING and WITH CHECK.
- Both policies scoped `TO authenticated` (anon gets no access to profiles).

## Important notes
1. The `protect_profile_role` trigger from the previous migration still guards
   against role changes — this migration only changes who can *read/update*
   profile rows, not how the role column itself is protected.
2. `is_admin()` uses a subquery `(SELECT auth.uid())` to avoid inlining issues
   in policy expressions.
3. Safe to re-run — policies are dropped before recreation.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
CREATE POLICY "Users can update own profile or admins can update all" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());
