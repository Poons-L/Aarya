/*
  # Add Missing Contact Fields for Production

  1. Changes
    - Add linkedin_url field to contacts table
    - Add interaction_history jsonb field for timestamped notes about past conversations
    - This enables full contact management features

  2. Fields Added
    - linkedin_url: Store LinkedIn profile URL
    - interaction_history: Array of {date, note, type} objects for tracking interactions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE contacts ADD COLUMN linkedin_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'interaction_history'
  ) THEN
    ALTER TABLE contacts ADD COLUMN interaction_history jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;