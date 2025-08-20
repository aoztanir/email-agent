-- Rename tables to singular names
ALTER TABLE companies RENAME TO company;
ALTER TABLE contacts RENAME TO contact;
ALTER TABLE scraping_jobs RENAME TO scraping_job;

-- Rename related indexes
ALTER INDEX idx_companies_place_id RENAME TO idx_company_place_id;
ALTER INDEX idx_contacts_company_id RENAME TO idx_contact_company_id;
ALTER INDEX idx_contacts_email RENAME TO idx_contact_email;
ALTER INDEX idx_scraping_jobs_status RENAME TO idx_scraping_job_status;
ALTER INDEX idx_scraping_jobs_created_at RENAME TO idx_scraping_job_created_at;

-- Update foreign key reference in scraping_job table
-- The company_ids column already uses JSONB, so no need to change it
-- But update current_company_id to reference the renamed table
ALTER TABLE scraping_job DROP CONSTRAINT IF EXISTS scraping_jobs_current_company_id_fkey;
ALTER TABLE scraping_job ADD CONSTRAINT scraping_job_current_company_id_fkey 
    FOREIGN KEY (current_company_id) REFERENCES company(id);

-- Update policies for renamed tables
DROP POLICY IF EXISTS "Allow all operations on companies" ON company;
DROP POLICY IF EXISTS "Allow all operations on contacts" ON contact;
DROP POLICY IF EXISTS "Allow all operations on scraping_jobs" ON scraping_job;

CREATE POLICY "Allow all operations on company" ON company FOR ALL USING (true);
CREATE POLICY "Allow all operations on contact" ON contact FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraping_job" ON scraping_job FOR ALL USING (true);