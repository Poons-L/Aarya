-- Add birthday field to contacts (stores month and day only as MM-DD string)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday text;

-- Add a check constraint to ensure format is valid MM-DD
ALTER TABLE contacts ADD CONSTRAINT birthday_format_check 
  CHECK (birthday IS NULL OR birthday ~ '^\d{2}-\d{2}$');

COMMENT ON COLUMN contacts.birthday IS 'Birthday stored as MM-DD format (month-day only, no year)';
