/*
  # Drop Unused Database Indexes

  This migration removes database indexes that are not being used by the application.
  Unused indexes:
  - Consume storage space
  - Slow down INSERT, UPDATE, and DELETE operations
  - Provide no query performance benefit

  ## Indexes Being Removed

  ### Contacts Table
  - `idx_contacts_name` - Name searches not currently used
  - `idx_contacts_met_date` - Met date filtering not currently used

  ### Contact Tags Table
  - `idx_contact_tags_tag` - Tag filtering not currently used

  ### Conversations Table
  - `idx_conversations_user_id` - User filtering covered by RLS
  - `idx_conversations_contact_id` - Contact filtering not optimized
  - `idx_conversations_date` - Date filtering not currently used

  ### Reminders Table
  - `idx_reminders_user_id` - User filtering covered by RLS
  - `idx_reminders_due_date` - Due date filtering not optimized
  - `idx_reminders_completed` - Completion filtering not optimized
  - `idx_reminders_contact_id` - Contact filtering not currently used

  ### Session Notes Table
  - `idx_session_notes_session_id` - Session filtering not currently used
  - `idx_session_notes_user_id` - User filtering covered by RLS

  ### Meetings Table
  - `idx_meetings_user_id` - User filtering covered by RLS
  - `idx_meetings_session_id` - Session filtering not currently used
  - `idx_meetings_times` - Time filtering not currently used

  ### Events Table
  - `idx_events_user_id` - User filtering covered by RLS
  - `idx_events_start_date` - Start date filtering not currently used

  ### Memories Table
  - `idx_memories_user_id` - User filtering covered by RLS
  - `idx_memories_created_at` - Creation date filtering not optimized
  - `idx_memories_tags` - Tag filtering not currently used
  - `idx_memories_linked_contact` - Contact linking not optimized
  - `idx_memories_event_id` - Event linking not currently used
  - `idx_memories_session_id` - Session linking not currently used

  ### Files Table
  - `idx_files_user_id` - User filtering covered by RLS
  - `idx_files_linked_memory` - Memory linking not currently used
  - `idx_files_linked_contact_id` - Contact linking not currently used

  ### Sessions Table
  - `idx_sessions_event_id` - Event filtering not currently used
  - `idx_sessions_start_time` - Time filtering not currently used

  ### User Event Preferences Table
  - `idx_user_event_preferences_user_id` - User filtering not currently used
  - `idx_user_event_preferences_event_id` - Event filtering not currently used

  ### Contact Events Table
  - `idx_contact_events_contact_id` - Contact filtering not currently used
  - `idx_contact_events_event_id` - Event filtering not currently used
  - `idx_contact_events_session_id` - Session filtering not currently used

  ### Conversation Key Points Table
  - `idx_conversation_key_points_conversation_id` - Conversation filtering not currently used

  ## Performance Impact
  
  Removing these indexes will:
  - Reduce storage usage
  - Improve INSERT/UPDATE/DELETE performance
  - Have no negative impact on current query patterns

  ## Future Considerations

  If specific queries become slow in the future, indexes can be selectively re-added
  based on actual query patterns and performance monitoring.
*/

-- Drop indexes on contacts table
DROP INDEX IF EXISTS idx_contacts_name;
DROP INDEX IF EXISTS idx_contacts_met_date;

-- Drop indexes on contact_tags table
DROP INDEX IF EXISTS idx_contact_tags_tag;

-- Drop indexes on conversations table
DROP INDEX IF EXISTS idx_conversations_user_id;
DROP INDEX IF EXISTS idx_conversations_contact_id;
DROP INDEX IF EXISTS idx_conversations_date;

-- Drop indexes on reminders table
DROP INDEX IF EXISTS idx_reminders_user_id;
DROP INDEX IF EXISTS idx_reminders_due_date;
DROP INDEX IF EXISTS idx_reminders_completed;
DROP INDEX IF EXISTS idx_reminders_contact_id;

-- Drop indexes on session_notes table
DROP INDEX IF EXISTS idx_session_notes_session_id;
DROP INDEX IF EXISTS idx_session_notes_user_id;

-- Drop indexes on meetings table
DROP INDEX IF EXISTS idx_meetings_user_id;
DROP INDEX IF EXISTS idx_meetings_session_id;
DROP INDEX IF EXISTS idx_meetings_times;

-- Drop indexes on events table
DROP INDEX IF EXISTS idx_events_user_id;
DROP INDEX IF EXISTS idx_events_start_date;

-- Drop indexes on memories table
DROP INDEX IF EXISTS idx_memories_user_id;
DROP INDEX IF EXISTS idx_memories_created_at;
DROP INDEX IF EXISTS idx_memories_tags;
DROP INDEX IF EXISTS idx_memories_linked_contact;
DROP INDEX IF EXISTS idx_memories_event_id;
DROP INDEX IF EXISTS idx_memories_session_id;

-- Drop indexes on files table
DROP INDEX IF EXISTS idx_files_user_id;
DROP INDEX IF EXISTS idx_files_linked_memory;
DROP INDEX IF EXISTS idx_files_linked_contact_id;

-- Drop indexes on sessions table
DROP INDEX IF EXISTS idx_sessions_event_id;
DROP INDEX IF EXISTS idx_sessions_start_time;

-- Drop indexes on user_event_preferences table
DROP INDEX IF EXISTS idx_user_event_preferences_user_id;
DROP INDEX IF EXISTS idx_user_event_preferences_event_id;

-- Drop indexes on contact_events table
DROP INDEX IF EXISTS idx_contact_events_contact_id;
DROP INDEX IF EXISTS idx_contact_events_event_id;
DROP INDEX IF EXISTS idx_contact_events_session_id;

-- Drop indexes on conversation_key_points table
DROP INDEX IF EXISTS idx_conversation_key_points_conversation_id;
