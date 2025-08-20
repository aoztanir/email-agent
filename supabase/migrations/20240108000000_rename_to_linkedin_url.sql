-- Rename profile_url column to linkedin_url to accurately represent what it contains
ALTER TABLE contact RENAME COLUMN profile_url TO linkedin_url;