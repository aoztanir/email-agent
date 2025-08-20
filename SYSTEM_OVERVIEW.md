# Email Mining System - Complete Implementation

## 🎯 System Overview
This is a full-stack email mining application that allows users to search for companies and automatically build a database of business contacts with their email addresses.

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15.4.6 with TypeScript
- **UI**: Shadcn/ui components with Tailwind CSS
- **State Management**: React hooks
- **Notifications**: Sonner toast notifications
- **Database**: Direct Supabase integration

### Backend (Python FastAPI)
- **Framework**: FastAPI with async support
- **Scraping**: Playwright for Google Maps data extraction
- **Database**: Supabase PostgreSQL

## 📊 Database Schema

### Tables Created
1. **`company`** - Stores company information
   - `place_id` (unique) - Google Maps place identifier
   - `name`, `address`, `website`, `phone_number`
   - `reviews_count`, `reviews_average`
   - Business info: `place_type`, `opens_at`, etc.

2. **`prompt`** - Tracks user search queries
   - `query_text` - What the user searched for
   - `total_requested`, `total_found`
   - Timestamp tracking

3. **`prompt_company`** - Many-to-many relationship
   - Links prompts to companies
   - Allows same company to be found by multiple queries

## 🔧 Key Features Implemented

### 1. Company Search & Display
- **Search Interface**: Clean, centered input with suggestions
- **Loading States**: Spinner and progress indicators
- **Results Display**: 2x2 grid cards showing:
  - Company name and ratings
  - Business type badges
  - Contact information (website, phone)
  - Business hours

### 2. Database Integration
- **Smart Filtering**: Only companies with websites are saved
- **Duplicate Prevention**: `place_id` ensures uniqueness
- **Query Tracking**: Every search creates a prompt record
- **Many-to-Many Relations**: Companies can belong to multiple search results

### 3. Real-time Workflow
```
1. User enters search query → Creates prompt in DB
2. Backend scrapes Google Maps → Returns company data
3. Frontend filters companies with websites
4. User clicks "Save to Database" → Upserts companies & links to prompt
5. Toast notifications confirm success/errors
```

## 🚀 API Endpoints

### Backend (FastAPI)
- `GET /` - Health check
- `POST /search-companies` - Main search endpoint
  ```json
  {
    "query": "investment banks in NYC",
    "total": 20
  }
  ```

### Frontend (Next.js API Routes)
- `POST /api/search-companies` - Proxy to backend

## 🗄️ Database Operations

### Company Management
```typescript
// Upsert company (create if new, update if exists)
await dbUtils.upsertCompany(companyData)

// Link company to search prompt
await dbUtils.linkPromptToCompany(promptId, companyId)
```

### Query Tracking
```typescript
// Create search prompt
const prompt = await dbUtils.createPrompt(searchQuery, 20, 0)

// Update with actual results found
await dbUtils.updatePromptTotalFound(prompt.id, companiesFound)
```

## 🔍 Data Extraction Process

### Google Maps Scraping
1. **Search Execution**: Automated browser searches Google Maps
2. **Result Scrolling**: Loads all available results up to limit
3. **Detail Extraction**: Clicks each listing to extract:
   - Business name and address
   - Website and phone number
   - Reviews and ratings
   - Business hours and type
   - Google Maps place_id

### Place ID Extraction
- Extracts unique Google Maps identifiers from URLs
- Regex patterns handle various URL formats
- Fallback generation for edge cases

## 🛡️ Error Handling & UX

### Frontend
- **Toast Notifications**: Success/error feedback
- **Loading States**: Clear progress indicators
- **Form Validation**: Prevents empty searches
- **Network Errors**: Graceful error handling

### Backend
- **Async Operations**: Non-blocking database operations
- **Exception Handling**: Detailed error logging
- **Rate Limiting**: Respectful scraping practices

## 🎨 UI/UX Features

### Search Interface
- **Autocomplete Suggestions**: Common business types
- **Real-time Feedback**: Loading spinners and status updates
- **Responsive Design**: Works on mobile and desktop

### Results Display
- **Rich Cards**: Company information with ratings
- **Website Links**: Direct access to company sites
- **Save Controls**: One-click database storage
- **Visual Hierarchy**: Clear information organization

## 📱 Technology Stack

### Dependencies
- **Frontend**: React, Next.js, TypeScript, Tailwind, Shadcn
- **Backend**: FastAPI, Playwright, Python asyncio
- **Database**: Supabase (PostgreSQL)
- **Notifications**: Sonner toast library

## 🔐 Security & Performance

### Data Protection
- **Website-only Filter**: Only stores companies with domains
- **Input Validation**: Sanitized search queries
- **Error Boundaries**: Graceful failure handling

### Performance Optimizations
- **Async Operations**: Non-blocking database writes
- **Efficient Queries**: Optimized database operations
- **Smart Filtering**: Client-side result filtering

## 🎯 Business Logic

### Company Filtering Rules
```typescript
// Only save companies with websites
const companiesWithWebsites = results.companies.filter(company => 
  company.website && company.website.trim() !== ''
);
```

### Duplicate Handling
- **Place ID Uniqueness**: Prevents duplicate companies
- **Upsert Operations**: Updates existing records
- **Many-to-Many Links**: Same company, multiple searches

## 📈 Future Enhancements

The system is architected to support:
1. **Email Mining**: Individual contact extraction
2. **Contact Management**: Person-level data storage
3. **Campaign Management**: Email outreach tools
4. **Analytics**: Search and conversion tracking

## 🚀 Getting Started

### Database Setup
1. Run the SQL schema in Supabase:
   ```sql
   -- See database_schema.sql for complete setup
   ```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Running the Application
```bash
# Backend
cd backend && python main.py

# Frontend  
cd frontend && pnpm dev
```

## ✅ Complete Feature List

- [x] Google Maps company search
- [x] 2x2 grid display with rich company cards
- [x] Website-only filtering
- [x] Database schema with proper relationships
- [x] Query/prompt tracking system
- [x] Company uniqueness by place_id
- [x] Many-to-many prompt-company relationships
- [x] Real-time save to database functionality
- [x] Toast notifications for all operations
- [x] Loading states and error handling
- [x] Responsive UI design

The system provides a solid foundation for email mining operations with proper data management, user experience, and scalability.