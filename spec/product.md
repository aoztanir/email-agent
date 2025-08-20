# new app design in (/(site))

- User goes to main page and types in a type of company "e.g. investment banking companies in NYC" into the center input
- 20 companies are loaded and returned
- For each of those companies, individual emails are found using similar end points as in the old ui/design

# old app design (in /(dashboard))

# Email Mining

### 1. Data Collection

Description: The client can manually provide initial company data.

- This is a CSV of companies, google maps ID (place ID), google maps URL, company URL

---

### 2. Client Uploads Data

Description: The client uploads the previously collected company data into the system and the company data into a certain group (i.e. VC firms, software engineering companies, legal firms, etc…)

Sub-steps:

- Validate file format (e.g., CSV, Excel)
- Confirm mandatory fields are present (Company name, website, Place ID)
- Upload to postgres “company” table
  - company table:
    - id: UUID: unique
    - place_id: text: unique
    - name: text
    - website: text

---

### 3. Data Enrichment

Description: The system enriches uploaded company data by scraping additional company information from LinkedIn

Sub-steps:

- Scrape SearXng search with site:linked.com/in {company_name} for contact names associated with each company, and bio [DO NOT CURL or request linkedin's website itself to prevent from search results getting limited]
- Scrape as many as possible at once without going above rate limits
- Put Contacts into postgres “contact” table
  - id: UUID: unique
  - company_id: UUID: related to company table
  - name: text
  - Email

---

### 4. Email Extraction

Description: The system automatically finds valid email addresses for each contact.

Sub-steps:

- Go through each contact without an email address, and a company_id in their row and find their company email address by using an email address checker (libraries for this). This is called mining for contacts on a set of companies, it can take a while to get done.

---

# Email Sender

### 5. Initial Outreach

Description: The system can be queued to start emailing to a certain group of people, it goes through contacts and emails them with a template provided for that group and emails them, once emailed it tracks the sent email in the postgres db
