/*
  # Create AI Usage Logs Table

  1. New Tables
    - `ai_usage_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contact_id` (uuid, references contacts, nullable)
      - `feature_type` (text) - e.g., 'conversation_starters', 'transcription', 'ocr', 'summarization'
      - `tokens_used` (integer, nullable)
      - `success` (boolean, default true)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `ai_usage_logs` table
    - Add policies for users to insert their own logs
    - Add policy for service role to read all logs (for admin stats)

  3. Indexes
    - Index on user_id for faster user-specific queries
    - Index on created_at for time-based queries
    - Index on feature_type for analytics
*/

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  feature_type text NOT NULL,
  tokens_used integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own usage logs"
  ON ai_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage logs"
  ON ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature_type ON ai_usage_logs(feature_type);
