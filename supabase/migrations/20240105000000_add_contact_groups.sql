-- Create contact groups table
CREATE TABLE contact_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6', -- Default blue color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_group_member table for many-to-many relationship
CREATE TABLE contact_group_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES contact_group(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, contact_id) -- Prevent duplicate memberships
);

-- Add group_id to scraping_job table for default group assignment
ALTER TABLE scraping_job ADD COLUMN group_id UUID REFERENCES contact_group(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_contact_group_member_group_id ON contact_group_member(group_id);
CREATE INDEX idx_contact_group_member_contact_id ON contact_group_member(contact_id);
CREATE INDEX idx_scraping_job_group_id ON scraping_job(group_id);

-- Enable Row Level Security
ALTER TABLE contact_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_member ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on contact_group" ON contact_group FOR ALL USING (true);
CREATE POLICY "Allow all operations on contact_group_member" ON contact_group_member FOR ALL USING (true);