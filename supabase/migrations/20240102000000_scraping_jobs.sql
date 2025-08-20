-- Create scraping jobs table
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company_ids JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_companies INTEGER NOT NULL,
    processed_companies INTEGER DEFAULT 0,
    total_contacts_found INTEGER DEFAULT 0,
    linkedin_username TEXT NOT NULL,
    contacts_per_company INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    current_company_id UUID,
    current_company_name TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Enable Row Level Security
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on scraping_jobs" ON scraping_jobs FOR ALL USING (true);