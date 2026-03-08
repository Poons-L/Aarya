/*
  # Optimize RLS Policies to Use SELECT Subqueries

  1. Purpose
    - Fix performance issue where auth.uid() is re-evaluated for each row
    - Replace direct auth.uid() calls with (SELECT auth.uid())
    - Significantly improves query performance at scale

  2. Tables Affected
    - ai_usage_logs: 2 policies

  3. Performance Impact
    - Auth function is evaluated once per query instead of once per row
    - Reduces CPU usage and query execution time
    - Critical for production-scale performance

  4. Changes
    - Drop existing policies
    - Recreate with optimized SELECT subquery pattern
*/

-- Drop existing ai_usage_logs policies
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can insert their own usage logs" ON public.ai_usage_logs;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view their own usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
