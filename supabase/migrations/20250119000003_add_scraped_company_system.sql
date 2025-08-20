-- Create scraped_company table and update junction table

-- Create scraped_company table to store all scraped data
CREATE TABLE scraped_company (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  website TEXT NOT NULL, -- Required since we only save companies with websites
  normalized_domain TEXT UNIQUE NOT NULL, -- Normalized domain for deduplication
  phone_number TEXT,
  reviews_count INTEGER,
  reviews_average DECIMAL(2,1),
  store_shopping TEXT DEFAULT 'No',
  in_store_pickup TEXT DEFAULT 'No', 
  store_delivery TEXT DEFAULT 'No',
  place_type TEXT,
  opens_at TEXT,
  introduction TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop old prompt_company table
DROP TABLE IF EXISTS prompt_company;

-- Create new junction table between prompts and scraped_companies
CREATE TABLE prompt_to_scraped_company (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES prompt(id) ON DELETE CASCADE,
  scraped_company_id UUID NOT NULL REFERENCES scraped_company(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, scraped_company_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraped_company_normalized_domain ON scraped_company(normalized_domain);
CREATE INDEX IF NOT EXISTS idx_scraped_company_website ON scraped_company(website);
CREATE INDEX IF NOT EXISTS idx_prompt_to_scraped_company_prompt_id ON prompt_to_scraped_company(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_to_scraped_company_company_id ON prompt_to_scraped_company(scraped_company_id);

-- Create update trigger for scraped_company updated_at
CREATE OR REPLACE FUNCTION update_scraped_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scraped_company_updated_at 
  BEFORE UPDATE ON scraped_company 
  FOR EACH ROW 
  EXECUTE FUNCTION update_scraped_company_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE scraped_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_to_scraped_company ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on scraped_company" ON scraped_company FOR ALL USING (true);
CREATE POLICY "Allow all operations on prompt_to_scraped_company" ON prompt_to_scraped_company FOR ALL USING (true);