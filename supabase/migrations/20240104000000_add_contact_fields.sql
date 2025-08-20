-- Add first_name, last_name, and bio columns to contact table
-- Replace the existing name column with first_name and last_name
ALTER TABLE contact ADD COLUMN first_name TEXT;
ALTER TABLE contact ADD COLUMN last_name TEXT;
ALTER TABLE contact ADD COLUMN bio TEXT;
ALTER TABLE contact ADD COLUMN linkedin_profile TEXT;

-- Update existing records to split name into first_name and last_name
UPDATE contact 
SET 
    first_name = CASE 
        WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
        ELSE name
    END,
    last_name = CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
        ELSE ''
    END
WHERE name IS NOT NULL;

-- Drop the old name column after data migration
ALTER TABLE contact DROP COLUMN name;