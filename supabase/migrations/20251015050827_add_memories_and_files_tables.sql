/*
  # Add Memories and Files Tables for Re.Me v1.1

  1. New Tables
    - `memories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `text` (text) - Original captured text/transcription
      - `summary` (text) - AI-generated summary
      - `tags` (text[]) - Auto-generated tags
      - `source_type` (text) - voice, text, or ocr
      - `linked_contact_id` (uuid, nullable) - Link to contact if applicable
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_url` (text) - Storage URL for uploaded file
      - `file_type` (text) - image, audio, etc.
      - `ocr_text` (text, nullable) - Extracted text from OCR
      - `linked_contact_id` (uuid, nullable)
      - `linked_memory_id` (uuid, nullable)
      - `created_at` (timestamptz)

  2. Updates to Existing Tables
    - Add `source` field to `contacts` table (ocr, voice, text, manual)
    - Add indexes for performance

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  summary text,
  tags text[] DEFAULT '{}',
  source_type text CHECK (source_type IN ('voice', 'text', 'ocr')) DEFAULT 'text',
  linked_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('image', 'audio', 'document')) DEFAULT 'image',
  ocr_text text,
  linked_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  linked_memory_id uuid REFERENCES memories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Add source field to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'source'
  ) THEN
    ALTER TABLE contacts ADD COLUMN source text CHECK (source IN ('ocr', 'voice', 'text', 'manual')) DEFAULT 'manual';
  END IF;
END $$;

-- Add conversation field to contacts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'conversation'
  ) THEN
    ALTER TABLE contacts ADD COLUMN conversation text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memories_linked_contact ON memories(linked_contact_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_linked_memory ON files(linked_memory_id);

-- Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memories table
CREATE POLICY "Users can view own memories"
  ON memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for files table
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for memories updated_at
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
