# Product Specification - Email Mining Application

## Core User Journey

### 1. Instant Company Discovery
**User Experience**: User enters a search query like "investment banks in NYC" and immediately sees companies appearing in real-time.

**What Happens Behind the Scenes**:
- System first checks existing database for relevant companies (instant results)
- Simultaneously scrapes Google Maps for new companies
- Companies appear on screen as soon as they're found and saved
- Real-time progress indicators show discovery status

### 2. Real-time Contact Mining
**User Experience**: As each company appears, contacts start populating automatically with validated email addresses.

**Email Intelligence System**:
- **Blocked Email Providers**: For Gmail, Outlook, Yahoo etc. → Generate most likely email pattern instantly
- **Checkable Domains**: For company domains → Validate emails using localhost:8080 API
- **Pattern Generation**: Creates common patterns (first.last@company.com, first@company.com, etc.)
- **Confidence Scoring**: "Validated" for confirmed emails, "Pattern Generated" for likely emails

### 3. Smart Email Validation
**The system intelligently handles different email scenarios**:

- **Major Providers (Gmail, Outlook, etc.)**:
  - ❌ Cannot validate (providers block checking)
  - ✅ Generate most likely pattern based on company naming conventions
  - 🏷️ Label as "Pattern Generated" with high confidence

- **Custom Company Domains**:
  - ✅ Validate using Reacher API on localhost:8080
  - ✅ Test multiple email patterns until valid one found
  - 🏷️ Label as "Validated" with delivery confidence

### 4. Progressive Results Display
**Real-time Updates**:
- Companies appear immediately as discovered
- Existing companies load with their stored contacts instantly
- New contacts populate progressively as LinkedIn mining completes
- Only confirmed/likely emails are shown (no unverified addresses)

---

## Key Features

### Speed-First Architecture
- **Existing Data First**: Show known companies and contacts immediately
- **Parallel Processing**: Mine contacts for multiple companies simultaneously  
- **Smart Caching**: Never re-mine companies that already have contacts
- **Streaming Updates**: Live progress without page refreshes

### Email Quality Assurance
- **No Unconfirmed Emails**: Only show emails that are validated or generated with high confidence
- **Provider Intelligence**: Different strategies for different email providers
- **Pattern Confidence**: Clear labeling of email validation status
- **Delivery Tracking**: Focus on emails likely to reach recipients

### User Experience
- **Immediate Feedback**: Companies appear as soon as found
- **Progress Transparency**: Clear status updates during mining
- **Real-time Stats**: Live counters for companies, contacts, and emails found
- **Error Resilience**: Individual company failures don't break the entire search

---

## Database Design

### Core Tables
- **scraped_company**: Stores company information with normalized domains for deduplication
- **contact**: Individual contacts linked to companies via foreign key
- **contact_email**: Separate table for email addresses with validation metadata
- **prompt**: Tracks search queries and results for analytics

### Data Relationships
- One company → Many contacts
- One contact → Many emails (multiple patterns/addresses)
- One prompt → Many companies (search result tracking)

---

## Technical Implementation

### Backend (Python/FastAPI)
- **Streaming API**: Server-Sent Events for real-time updates
- **Email Domain Detection**: Automatic classification of email providers
- **Validation Pipeline**: Different strategies for different domain types
- **Error Handling**: Graceful failure recovery for individual companies

### Frontend (Next.js)
- **Stream Processing**: Real-time event handling for live updates
- **Progressive Loading**: Companies and contacts appear incrementally
- **Status Management**: Clear progress indicators and statistics
- **Error States**: User-friendly error messages and retry options

---

## Success Metrics

- **Speed**: Companies appear within seconds of search
- **Accuracy**: High-confidence emails only (validated or pattern-generated)
- **Completeness**: Maximum contact coverage per company
- **User Experience**: Smooth, real-time interface with clear progress
