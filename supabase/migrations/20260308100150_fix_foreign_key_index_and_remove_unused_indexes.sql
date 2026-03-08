/*
  # Fix Foreign Key Index and Remove Unused Indexes

  ## Changes
  
  1. **Add Missing Foreign Key Index**
     - Add index on `ai_usage_logs.user_id` to support foreign key constraint
     - Improves query performance for user-based lookups
  
  2. **Remove Unused Indexes**
     Dropping the following unused indexes to improve write performance and reduce storage:
     - ai_usage_logs: idx_ai_usage_logs_contact_id
     - contact_events: idx_contact_events_contact_id, idx_contact_events_event_id, idx_contact_events_session_id
     - conversation_key_points: idx_conversation_key_points_conversation_id
     - conversations: idx_conversations_contact_id, idx_conversations_user_id
     - events: idx_events_user_id
     - files: idx_files_linked_contact_id, idx_files_linked_memory_id, idx_files_user_id
     - meetings: idx_meetings_session_id, idx_meetings_user_id
     - memories: idx_memories_event_id, idx_memories_linked_contact_id, idx_memories_session_id, idx_memories_user_id
     - reminders: idx_reminders_contact_id, idx_reminders_user_id
     - session_notes: idx_session_notes_session_id, idx_session_notes_user_id
     - sessions: idx_sessions_event_id
     - user_event_preferences: idx_user_event_preferences_event_id

  ## Security Impact
  - Improves query performance for foreign key lookups
  - Reduces storage overhead and improves write performance by removing unused indexes
  - Maintains all necessary indexes for RLS policies and active queries
*/

-- Add missing foreign key index on ai_usage_logs.user_id
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_ai_usage_logs_contact_id;
DROP INDEX IF EXISTS public.idx_contact_events_contact_id;
DROP INDEX IF EXISTS public.idx_contact_events_event_id;
DROP INDEX IF EXISTS public.idx_contact_events_session_id;
DROP INDEX IF EXISTS public.idx_conversation_key_points_conversation_id;
DROP INDEX IF EXISTS public.idx_conversations_contact_id;
DROP INDEX IF EXISTS public.idx_conversations_user_id;
DROP INDEX IF EXISTS public.idx_events_user_id;
DROP INDEX IF EXISTS public.idx_files_linked_contact_id;
DROP INDEX IF EXISTS public.idx_files_linked_memory_id;
DROP INDEX IF EXISTS public.idx_files_user_id;
DROP INDEX IF EXISTS public.idx_meetings_session_id;
DROP INDEX IF EXISTS public.idx_meetings_user_id;
DROP INDEX IF EXISTS public.idx_memories_event_id;
DROP INDEX IF EXISTS public.idx_memories_linked_contact_id;
DROP INDEX IF EXISTS public.idx_memories_session_id;
DROP INDEX IF EXISTS public.idx_memories_user_id;
DROP INDEX IF EXISTS public.idx_reminders_contact_id;
DROP INDEX IF EXISTS public.idx_reminders_user_id;
DROP INDEX IF EXISTS public.idx_session_notes_session_id;
DROP INDEX IF EXISTS public.idx_session_notes_user_id;
DROP INDEX IF EXISTS public.idx_sessions_event_id;
DROP INDEX IF EXISTS public.idx_user_event_preferences_event_id;