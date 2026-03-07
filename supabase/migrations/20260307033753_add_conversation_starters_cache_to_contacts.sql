/*
  # Add Conversation Starters Caching to Contacts

  1. Changes
    - Add `cached_starters` column (text array) to contacts table
    - Add `starters_generated_at` column (timestamptz) to contacts table
    
  2. Purpose
    - Cache AI-generated conversation starters to reduce API calls
    - Track when starters were last generated for freshness checks
    - Improve user experience with instant results for recently generated starters
  
  3. Notes
    - Cached results valid for 7 days
    - Helps enforce rate limiting by reducing unnecessary API calls
    - Users can see when starters were last generated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'cached_starters'
  ) THEN
    ALTER TABLE contacts ADD COLUMN cached_starters text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'starters_generated_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN starters_generated_at timestamptz;
  END IF;
END $$;
