/*
  # Fix Duplicate RLS Policies

  1. Changes
    - Remove duplicate RLS policies that conflict with admin policies
    - Clean up:
      - events table: Remove old "Users can create own events" policy (replaced by admin version)
      - sessions table: Remove old policies (replaced by admin versions)

  2. Impact
    - Eliminates policy conflicts
    - Improves query planning performance
    - Maintains security with single, comprehensive policies
*/

-- Drop duplicate event policies
DROP POLICY IF EXISTS "Users can create own events" ON events;

-- Drop duplicate session policies
DROP POLICY IF EXISTS "Users can view sessions in their events" ON sessions;
DROP POLICY IF EXISTS "Users can create sessions in their events" ON sessions;
DROP POLICY IF EXISTS "Users can update sessions in their events" ON sessions;
DROP POLICY IF EXISTS "Users can delete sessions in their events" ON sessions;