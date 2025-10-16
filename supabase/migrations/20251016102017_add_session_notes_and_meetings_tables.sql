/*
  # Add Session Notes and Meetings Tables

  1. New Tables
    - `session_notes`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `user_id` (uuid, foreign key to auth.users)
      - `raw_text` (text, required) - Original note content
      - `summary` (text) - AI-generated summary
      - `tags` (text[]) - Extracted tags
      - `source` (text) - 'voice', 'text', or 'ocr'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `meetings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_id` (uuid, foreign key to sessions, nullable)
      - `title` (text, required) - Meeting title
      - `attendees` (text[]) - Array of attendee names/emails
      - `start_time` (timestamptz, required)
      - `end_time` (timestamptz, required)
      - `location` (text) - Meeting location
      - `notes` (text) - Meeting notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Schema Updates
    - Add `room` column to sessions if it doesn't exist

  3. Security
    - Enable RLS on new tables
    - Users can only access their own session notes and meetings

  4. Indexes
    - Index on session_notes session_id and user_id
    - Index on meetings user_id and session_id
*/

-- Add room column to sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'room'
  ) THEN
    ALTER TABLE sessions ADD COLUMN room text;
  END IF;
END $$;

-- Create session_notes table
CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_text text NOT NULL,
  summary text,
  tags text[] DEFAULT '{}',
  source text NOT NULL CHECK (source IN ('voice', 'text', 'ocr')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  attendees text[] DEFAULT '{}',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_session_id ON meetings(session_id);
CREATE INDEX IF NOT EXISTS idx_meetings_times ON meetings(start_time, end_time);

-- RLS Policies for session_notes
CREATE POLICY "Users can view own session notes"
  ON session_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session notes"
  ON session_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session notes"
  ON session_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own session notes"
  ON session_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for meetings
CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for session_notes and meetings
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_notes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
