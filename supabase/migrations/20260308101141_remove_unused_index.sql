/*
  # Remove Unused Index

  Removes the unused index `idx_ai_usage_logs_user_id` on the ai_usage_logs table.
  This index has not been used and is redundant since we now have the contact_id index
  which is more relevant for the query patterns in this table.

  ## Changes
  - Drop `idx_ai_usage_logs_user_id` index

  ## Impact
  - Reduces storage overhead
  - Improves INSERT/UPDATE performance on ai_usage_logs table
  - No negative query performance impact (index was unused)
*/

DROP INDEX IF EXISTS idx_ai_usage_logs_user_id;