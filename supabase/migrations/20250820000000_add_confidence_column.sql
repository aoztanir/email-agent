-- Add confidence column to contact_email table
ALTER TABLE contact_email 
ADD COLUMN confidence TEXT DEFAULT 'unknown';

-- Add validation_result column for storing detailed validation info
ALTER TABLE contact_email 
ADD COLUMN validation_result JSONB DEFAULT NULL;

-- Create index for confidence column for better performance
CREATE INDEX idx_contact_email_confidence ON contact_email(confidence);