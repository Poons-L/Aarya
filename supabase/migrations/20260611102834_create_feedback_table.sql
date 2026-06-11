CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category text NOT NULL CHECK (category IN ('Bug Report', 'Feature Request', 'General Feedback', 'UI/UX')),
  message text DEFAULT '' CHECK (char_length(message) <= 500),
  app_version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
