-- Remove LinkedIn-specific fields from scraping_job table
ALTER TABLE scraping_job DROP COLUMN IF EXISTS linkedin_username;

-- Update any existing comments or references
COMMENT ON TABLE scraping_job IS 'Scraping jobs for employee contact mining using SearxNG';