/*
  # Add context_source field to contacts table

  1. Changes
    - Add `context_source` column to `contacts` table to track which data source was used for generating conversation starters
    - Possible values: 'interaction_history', 'notes', 'linkedin', 'fallback'
  
  2. Purpose
    - Allows the UI to show users which data source was used for AI generation
    - Helps users understand how to improve their contact data for better AI results
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'context_source'
  ) THEN
    ALTER TABLE contacts ADD COLUMN context_source text;
  END IF;
END $$;