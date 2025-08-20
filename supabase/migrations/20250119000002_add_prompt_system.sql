-- Add prompt system tables and extend company table

-- Add new columns to existing company table
ALTER TABLE company ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE company ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE company ADD COLUMN IF NOT EXISTS reviews_count INTEGER;
ALTER TABLE company ADD COLUMN IF NOT EXISTS reviews_average DECIMAL(2,1);
ALTER TABLE company ADD COLUMN IF NOT EXISTS store_shopping TEXT DEFAULT 'No';
ALTER TABLE company ADD COLUMN IF NOT EXISTS in_store_pickup TEXT DEFAULT 'No';
ALTER TABLE company ADD COLUMN IF NOT EXISTS store_delivery TEXT DEFAULT 'No';
ALTER TABLE company ADD COLUMN IF NOT EXISTS place_type TEXT;
ALTER TABLE company ADD COLUMN IF NOT EXISTS opens_at TEXT;
ALTER TABLE company ADD COLUMN IF NOT EXISTS introduction TEXT;

-- Create prompts table
CREATE TABLE prompt (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  total_requested INTEGER DEFAULT 20,
  total_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create many-to-many relationship table between prompts and companies
CREATE TABLE prompt_company (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES prompt(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, company_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_company_prompt_id ON prompt_company(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_company_company_id ON prompt_company(company_id);

-- Enable RLS (Row Level Security)
ALTER TABLE prompt ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_company ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on prompt" ON prompt FOR ALL USING (true); 
CREATE POLICY "Allow all operations on prompt_company" ON prompt_company FOR ALL USING (true);