/*
# Protect profile role and revoke excess table privileges

## Summary
Hardens the database against privilege escalation and excess grants:
1. Adds a trigger that forces new profiles to role = 'user' and blocks
   authenticated/anon users from changing the `role` column on `profiles`.
2. Revokes ALL privileges from `anon` on four sensitive tables.
3. Removes TRUNCATE, TRIGGER, and REFERENCES rights from `authenticated`
   on those same tables (they still keep SELECT/INSERT/UPDATE/DELETE via RLS policies).

## Tables affected
- `profiles` — new trigger `protect_profile_role` on INSERT/UPDATE
- `contact_insights` — revoke anon ALL; revoke authenticated TRUNCATE/TRIGGER/REFERENCES
- `contact_interactions` — same
- `generated_talking_points` — same
- `feedback` — same

## Security changes
- `protect_profile_role()` function: SECURITY INVOKER, search_path locked to
  pg_catalog,public. Execution revoked from public/anon/authenticated so only
  the table owner (via the trigger) can invoke it.
- Trigger fires BEFORE INSERT OR UPDATE on `profiles`.
  - INSERT: sets `role` to 'user' regardless of what the client sent.
  - UPDATE: raises error 42501 if `role` is being changed by an authenticated/anon JWT.
- Only JWT roles outside 'authenticated'/'anon' (i.e. service_role / postgres)
  bypass the check and can set or change the role freely.

## Important notes
1. The function is SECURITY INVOKER (not DEFINER) and execution is revoked from
   all client roles, so it cannot be called directly — only the trigger fires it.
2. The trigger replaces any existing `protect_profile_role` trigger (idempotent).
3. The DO block checks `to_regclass` before revoking, so it is safe even if a
   table has not been created yet.
4. This migration is safe to re-run.
*/

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

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contact_insights','contact_interactions','generated_talking_points','feedback']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
      EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
