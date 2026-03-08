/*
  # Remove Unused Indexes on ai_usage_logs

  1. Purpose
    - Remove indexes that are not being used by queries
    - Reduces storage overhead
    - Improves INSERT/UPDATE performance (fewer indexes to maintain)
    - Note: idx_ai_usage_logs_contact_id is now used (added in previous migration)

  2. Indexes to Remove
    - idx_ai_usage_logs_user_id (redundant - user_id queries use contact_id index path)
    - idx_ai_usage_logs_created_at (not used in current query patterns)
    - idx_ai_usage_logs_feature_type (not used in current query patterns)

  3. Impact
    - Faster writes to ai_usage_logs table
    - Reduced storage usage
    - If these indexes become needed in the future, they can be recreated
*/

DROP INDEX IF EXISTS public.idx_ai_usage_logs_user_id;
DROP INDEX IF EXISTS public.idx_ai_usage_logs_created_at;
DROP INDEX IF EXISTS public.idx_ai_usage_logs_feature_type;
