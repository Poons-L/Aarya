/*
  # Fix Function Search Path Security

  1. Changes
    - Set immutable search_path on security-critical functions
    - Prevents search_path manipulation attacks
    - Functions updated:
      - is_admin(): Sets search_path to pg_catalog, public
      - update_updated_at_column(): Sets search_path to pg_catalog, public

  2. Security Impact
    - Prevents potential schema-based attacks
    - Ensures functions always use expected schema
    - Critical for production security
*/

-- Recreate is_admin with proper search_path
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Recreate update_updated_at_column with proper search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;