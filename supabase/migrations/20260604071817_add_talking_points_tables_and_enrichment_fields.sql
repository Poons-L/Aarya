/*
  # Add Suggested Talking Points Pipeline Tables and Enrichment Fields

  1. Changes to `contacts` table
    - `enrichment_status` (text) - Status of LinkedIn/profile enrichment: pending, processing, completed, failed
    - `last_enriched_at` (timestamptz) - When the contact was last enriched
    - `profile_summary` (text) - Structured summary from LinkedIn/profile data
    - `profile_keywords` (text[]) - Keywords extracted from profile
    - `profile_headline` (text) - LinkedIn headline or equivalent
    - `profile_region` (text) - Geographic region
    - `profile_current_focus` (text) - Current professional focus areas
    - `enrichment_confidence` (numeric) - 0-1 confidence score of enrichment quality

  2. New Tables
    - `contact_interactions` - Structured interaction records with metadata
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `user_id` (uuid, references profiles)
      - `source_type` (text) - note, meeting, call, email, linkedin_message
      - `interaction_date` (timestamptz)
      - `raw_text` (text)
      - `summary` (text)
      - `keywords` (text[])
      - `created_at` (timestamptz)

    - `contact_insights` - Derived insights from contact data
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `user_id` (uuid, references profiles)
      - `insight_type` (text) - talking_point_context, relationship_summary, topic_affinity
      - `content` (jsonb)
      - `source_coverage` (jsonb) - Which sources contributed to this insight
      - `created_at` (timestamptz)

    - `generated_talking_points` - Cached talking point generation results
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `user_id` (uuid, references profiles)
      - `user_context` (text) - User-supplied context for this generation
      - `output` (jsonb) - The structured output (opener, points, questions, watchouts, confidence)
      - `source_summary` (jsonb) - Which sources were used and their coverage
      - `created_at` (timestamptz)

  3. Security
    - RLS enabled on all new tables
    - Policies restrict access to authenticated users who own the data
    - All access requires auth.uid() = user_id or ownership via contact
*/

-- Add enrichment fields to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'enrichment_status'
  ) THEN
    ALTER TABLE contacts ADD COLUMN enrichment_status text DEFAULT 'none';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_enriched_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_enriched_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'profile_summary'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'profile_keywords'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_keywords text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'profile_headline'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_headline text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'profile_region'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_region text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'profile_current_focus'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_current_focus text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'enrichment_confidence'
  ) THEN
    ALTER TABLE contacts ADD COLUMN enrichment_confidence numeric DEFAULT 0;
  END IF;
END $$;

-- Create contact_interactions table
CREATE TABLE IF NOT EXISTS contact_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL DEFAULT 'note',
  interaction_date timestamptz NOT NULL DEFAULT now(),
  raw_text text,
  summary text,
  keywords text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact interactions"
  ON contact_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact interactions"
  ON contact_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact interactions"
  ON contact_interactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact interactions"
  ON contact_interactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create contact_insights table
CREATE TABLE IF NOT EXISTS contact_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL DEFAULT 'talking_point_context',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE contact_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact insights"
  ON contact_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact insights"
  ON contact_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact insights"
  ON contact_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact insights"
  ON contact_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create generated_talking_points table
CREATE TABLE IF NOT EXISTS generated_talking_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_context text,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE generated_talking_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generated talking points"
  ON generated_talking_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated talking points"
  ON generated_talking_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated talking points"
  ON generated_talking_points FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id ON contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_user_id ON contact_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_date ON contact_interactions(interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_contact_insights_contact_id ON contact_insights(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_insights_user_id ON contact_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_talking_points_contact_id ON generated_talking_points(contact_id);
CREATE INDEX IF NOT EXISTS idx_generated_talking_points_user_id ON generated_talking_points(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_enrichment_status ON contacts(enrichment_status);
