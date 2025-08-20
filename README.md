# Email Mining Application

A full-stack application for mining company data, enriching contact information, and sending targeted email campaigns.

## Features

1. **Data Collection**: Upload CSV files with company data (name, place_id, website)
2. **Data Enrichment**: Scrape LinkedIn for contact information
3. **Email Extraction**: Automatically find email addresses for contacts
4. **Email Campaigns**: Create and send targeted email campaigns

## Tech Stack

- **Frontend**: Next.js with Shadcn UI components
- **Backend**: Python FastAPI
- **Database**: Supabase PostgreSQL
- **Email**: SMTP integration

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Run the database schema:
```sql
-- Execute the SQL in database/schema.sql in your Supabase project
```

5. Start the backend server:
```bash
python main.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

## Database Schema

### Companies Table
- `id`: UUID (primary key)
- `place_id`: Text (unique, Google Maps Place ID)
- `name`: Text (company name)
- `website`: Text (company website)

### Contacts Table
- `id`: UUID (primary key)
- `company_id`: UUID (foreign key to companies)
- `name`: Text (contact name)
- `email`: Text (email address)
- `linkedin_profile`: Text (LinkedIn profile URL)

### Email Campaigns Table
- `id`: UUID (primary key)
- `name`: Text (campaign name)
- `template`: Text (email template)
- `group_type`: Text (target group type)

### Sent Emails Table
- `id`: UUID (primary key)
- `contact_id`: UUID (foreign key to contacts)
- `campaign_id`: UUID (foreign key to email_campaigns)
- `sent_at`: Timestamp
- `status`: Text (sent/failed)
- `response_received`: Boolean

## API Endpoints

### Company Management
- `POST /companies/upload-csv`: Upload CSV with company data
- `GET /companies`: List companies
- `GET /companies/{id}`: Get company by ID

### Contact Management
- `POST /contacts`: Create contact
- `GET /contacts`: List contacts
- `GET /companies/{id}/contacts`: Get company contacts
- `GET /contacts/without-email`: Get contacts without emails

### LinkedIn Scraping
- `POST /scrape/linkedin`: Scrape LinkedIn for company contacts

### Email Finding
- `POST /contacts/find-emails`: Find emails for contacts

### Email Campaigns
- `POST /campaigns`: Create campaign
- `GET /campaigns`: List campaigns
- `POST /campaigns/{id}/send`: Send campaign emails
- `GET /campaigns/{id}/stats`: Get campaign statistics

## Usage Workflow

1. **Upload Company Data**: Use the frontend to upload a CSV file with company information
2. **Scrape LinkedIn**: Gather contact information from LinkedIn for each company
3. **Find Emails**: Automatically discover email addresses for contacts
4. **Create Campaign**: Design email templates and campaigns
5. **Send Emails**: Execute email campaigns with tracking

## Security Notes

- LinkedIn credentials are required for scraping (use responsibly)
- Email sending requires SMTP credentials
- Environment variables should be kept secure
- Rate limiting is implemented for API calls

## License

This project is for educational purposes. Ensure compliance with LinkedIn's terms of service and email regulations.# email-agent
