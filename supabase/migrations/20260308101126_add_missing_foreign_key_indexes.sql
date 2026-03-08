/*
  # Add Missing Foreign Key Indexes for Performance Optimization

  This migration adds indexes to all foreign key columns that were missing them,
  which improves query performance for joins and foreign key constraint checks.

  ## New Indexes Added

  ### ai_usage_logs table
  - `idx_ai_usage_logs_contact_id` on contact_id

  ### contact_events table
  - `idx_contact_events_contact_id` on contact_id
  - `idx_contact_events_event_id` on event_id
  - `idx_contact_events_session_id` on session_id

  ### conversation_key_points table
  - `idx_conversation_key_points_conversation_id` on conversation_id

  ### conversations table
  - `idx_conversations_contact_id` on contact_id
  - `idx_conversations_user_id` on user_id

  ### events table
  - `idx_events_user_id` on user_id

  ### files table
  - `idx_files_linked_contact_id` on linked_contact_id
  - `idx_files_linked_memory_id` on linked_memory_id
  - `idx_files_user_id` on user_id

  ### meetings table
  - `idx_meetings_session_id` on session_id
  - `idx_meetings_user_id` on user_id

  ### memories table
  - `idx_memories_event_id` on event_id
  - `idx_memories_linked_contact_id` on linked_contact_id
  - `idx_memories_session_id` on session_id
  - `idx_memories_user_id` on user_id

  ### reminders table
  - `idx_reminders_contact_id` on contact_id
  - `idx_reminders_user_id` on user_id

  ### session_notes table
  - `idx_session_notes_session_id` on session_id
  - `idx_session_notes_user_id` on user_id

  ### sessions table
  - `idx_sessions_event_id` on event_id

  ### user_event_preferences table
  - `idx_user_event_preferences_event_id` on event_id

  ## Performance Impact

  These indexes will significantly improve:
  - JOIN operations involving these foreign keys
  - Foreign key constraint validation
  - Query execution plans for filtered queries on these columns
  - Overall database performance for relationship-based queries
*/

-- ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_contact_id ON ai_usage_logs(contact_id);

-- contact_events
CREATE INDEX IF NOT EXISTS idx_contact_events_contact_id ON contact_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_event_id ON contact_events(event_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_session_id ON contact_events(session_id);

-- conversation_key_points
CREATE INDEX IF NOT EXISTS idx_conversation_key_points_conversation_id ON conversation_key_points(conversation_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- files
CREATE INDEX IF NOT EXISTS idx_files_linked_contact_id ON files(linked_contact_id);
CREATE INDEX IF NOT EXISTS idx_files_linked_memory_id ON files(linked_memory_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- meetings
CREATE INDEX IF NOT EXISTS idx_meetings_session_id ON meetings(session_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);

-- memories
CREATE INDEX IF NOT EXISTS idx_memories_event_id ON memories(event_id);
CREATE INDEX IF NOT EXISTS idx_memories_linked_contact_id ON memories(linked_contact_id);
CREATE INDEX IF NOT EXISTS idx_memories_session_id ON memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

-- reminders
CREATE INDEX IF NOT EXISTS idx_reminders_contact_id ON reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- session_notes
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);

-- sessions
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);

-- user_event_preferences
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_event_id ON user_event_preferences(event_id);