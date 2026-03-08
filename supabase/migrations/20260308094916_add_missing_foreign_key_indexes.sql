/*
  # Add Missing Foreign Key Indexes for Performance

  1. Purpose
    - Add indexes on all foreign key columns that are missing them
    - Improves query performance for JOIN operations and foreign key lookups
    - Resolves security audit findings for unindexed foreign keys

  2. Tables Affected
    - ai_usage_logs: contact_id
    - contact_events: contact_id, event_id, session_id
    - conversation_key_points: conversation_id
    - conversations: contact_id, user_id
    - events: user_id
    - files: linked_contact_id, linked_memory_id, user_id
    - meetings: session_id, user_id
    - memories: event_id, linked_contact_id, session_id, user_id
    - reminders: contact_id, user_id
    - session_notes: session_id, user_id
    - sessions: event_id
    - user_event_preferences: event_id

  3. Performance Impact
    - Significantly improves JOIN performance
    - Speeds up foreign key constraint checks
    - Reduces table scan operations
    - Essential for production-scale performance
*/

-- ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_contact_id ON public.ai_usage_logs(contact_id);

-- contact_events
CREATE INDEX IF NOT EXISTS idx_contact_events_contact_id ON public.contact_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_event_id ON public.contact_events(event_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_session_id ON public.contact_events(session_id);

-- conversation_key_points
CREATE INDEX IF NOT EXISTS idx_conversation_key_points_conversation_id ON public.conversation_key_points(conversation_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- files
CREATE INDEX IF NOT EXISTS idx_files_linked_contact_id ON public.files(linked_contact_id);
CREATE INDEX IF NOT EXISTS idx_files_linked_memory_id ON public.files(linked_memory_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);

-- meetings
CREATE INDEX IF NOT EXISTS idx_meetings_session_id ON public.meetings(session_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);

-- memories
CREATE INDEX IF NOT EXISTS idx_memories_event_id ON public.memories(event_id);
CREATE INDEX IF NOT EXISTS idx_memories_linked_contact_id ON public.memories(linked_contact_id);
CREATE INDEX IF NOT EXISTS idx_memories_session_id ON public.memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);

-- reminders
CREATE INDEX IF NOT EXISTS idx_reminders_contact_id ON public.reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);

-- session_notes
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON public.session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON public.session_notes(user_id);

-- sessions
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON public.sessions(event_id);

-- user_event_preferences
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_event_id ON public.user_event_preferences(event_id);
