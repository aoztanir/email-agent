# Technical Architecture

## Frontend Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **Shadcn/ui** components
- **pnpm** for package management
- **React Query (@tanstack/react-query)** for state management
- **Sonner** for toast notifications
- **Framer Motion** for animations

### Frontend-Backend Communication

- **Real-time streaming** via Server-Sent Events (SSE) for live updates
- **Direct Supabase queries** for simple database operations (faster than API calls)
- **Python API calls** only for complex operations requiring external services
- **Stream processing** for real-time company discovery and contact mining

## Backend Stack

- **Python 3** with **FastAPI** framework
- **Async/await** patterns for non-blocking operations
- **Streaming responses** for real-time client updates
- **Parallel processing** for email validation and contact mining

### Core Services

- **GoogleMapsScraper**: Company discovery from Google Maps
- **SearxngScraper**: LinkedIn contact extraction
- **ReacherEmailValidator**: Email validation via localhost:8080 API
- **ContactService**: Database operations for contacts and emails

### Email Validation Strategy

- **Blocked domains check**: Instant pattern generation for Gmail, Outlook, etc.
- **Validation API**: Real email verification for custom domains
- **Pattern generation**: Common email formats (first.last@domain, first@domain, etc.)
- **Confidence scoring**: Validated vs pattern-generated emails

## Database (Supabase PostgreSQL)

### Core Tables
- `scraped_company`: Company information with normalized domains
- `contact`: Individual contacts linked to companies  
- `contact_email`: Validated email addresses with confidence scores
- `prompt`: Search query tracking
- `prompt_to_scraped_company`: Query-company relationships

### Naming Convention
- **Singular table names** (`user` not `users`)
- **UUID primary keys** for all entities
- **Normalized domains** for deduplication

## Performance Optimizations

### Speed-First Architecture
- **Existing company search**: Immediate database query before external scraping
- **Streaming responses**: Companies appear as soon as found
- **Parallel processing**: Contact mining happens simultaneously across companies
- **Selective validation**: Only validate checkable domains
- **Pattern fallback**: Instant email generation for blocked providers

### Real-time Updates
- **SSE streaming**: Live progress updates to frontend
- **Incremental data**: Companies and contacts appear as discovered
- **Status tracking**: Clear progress indicators for each stage
- **Error isolation**: Individual company failures don't break the entire search
