/*
  # Fix Security Issues - Part 1: Add Missing Indexes

  1. Changes
    - Add indexes for all unindexed foreign keys to improve query performance
    - Indexes added for:
      - contact_events.session_id
      - conversation_key_points.conversation_id
      - files.linked_contact_id
      - memories.event_id
      - memories.session_id
      - reminders.contact_id

  2. Performance Impact
    - Improves JOIN performance on foreign key relationships
    - Reduces query execution time for related data lookups
    - Essential for production scalability
*/

CREATE INDEX IF NOT EXISTS idx_contact_events_session_id ON contact_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_key_points_conversation_id ON conversation_key_points(conversation_id);
CREATE INDEX IF NOT EXISTS idx_files_linked_contact_id ON files(linked_contact_id);
CREATE INDEX IF NOT EXISTS idx_memories_event_id ON memories(event_id);
CREATE INDEX IF NOT EXISTS idx_memories_session_id ON memories(session_id);
CREATE INDEX IF NOT EXISTS idx_reminders_contact_id ON reminders(contact_id);