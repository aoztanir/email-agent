-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Company table
CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contact table
CREATE TABLE contact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    bio TEXT,
    linkedin_profile TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email campaigns table (for tracking email templates and groups)
CREATE TABLE email_campaign (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    group_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sent emails table (for tracking sent emails)
CREATE TABLE sent_email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES email_campaign(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    response_received BOOLEAN DEFAULT FALSE
);

-- Indexes for better performance
CREATE INDEX idx_company_place_id ON company(place_id);
CREATE INDEX idx_contact_company_id ON contact(company_id);
CREATE INDEX idx_contact_email ON contact(email);
CREATE INDEX idx_sent_email_contact_id ON sent_email(contact_id);
CREATE INDEX idx_sent_email_campaign_id ON sent_email(campaign_id);