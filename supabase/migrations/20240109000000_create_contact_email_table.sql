-- Create contact_email table for storing contact email addresses found by MailScout
CREATE TABLE contact_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  is_deliverable BOOLEAN DEFAULT null,
  found_by TEXT DEFAULT 'mailscout',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_contact_email_contact_id ON contact_email(contact_id);
CREATE INDEX idx_contact_email_email ON contact_email(email);
CREATE INDEX idx_contact_email_is_valid ON contact_email(is_valid);

-- Add unique constraint to prevent duplicate emails for the same contact
CREATE UNIQUE INDEX idx_contact_email_unique ON contact_email(contact_id, email);

-- Add RLS (Row Level Security) policies
ALTER TABLE contact_email ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON contact_email
FOR ALL USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER contact_email_updated_at
  BEFORE UPDATE ON contact_email
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();