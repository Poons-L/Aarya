/*
  # Add memory date field

  1. Changes
    - Add `memory_date` column to `memories` table
      - This represents when the memory/event actually occurred
      - Defaults to the current timestamp if not specified
      - Can be set to past or future dates
  
  2. Notes
    - This is different from `created_at` which tracks when the record was created
    - Users can backdate memories or set them for future reference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memories' AND column_name = 'memory_date'
  ) THEN
    ALTER TABLE memories ADD COLUMN memory_date timestamptz DEFAULT now();
  END IF;
END $$;