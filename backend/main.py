from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
import logging
from typing import List, Optional, Dict, Any
from services.maps_scraper import GoogleMapsScraper
from services.reacher_email_validator import ReacherEmailValidator
from services.searxng_scraper import SearxngScraper
from services.contact_service import ContactService
from database.supabase_client import get_supabase_client
from utils.domain_utils import normalize_domain
import uuid

logger = logging.getLogger(__name__)

app = FastAPI(title="Email Mining API - Clean", version="2.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
maps_scraper = GoogleMapsScraper()

class StreamSearchRequest(BaseModel):
    query: str
    total: int = 20

class ValidateEmailRequest(BaseModel):
    email: str
    proxy: Optional[dict] = None

# Email providers that block validation
BLOCKED_EMAIL_DOMAINS = {
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com',
    'live.com', 'msn.com', 'aol.com', 'protonmail.com', 'mail.com'
}

def is_blocked_domain(domain: str) -> bool:
    """Check if email domain blocks validation"""
    return domain.lower() in BLOCKED_EMAIL_DOMAINS

def generate_email_patterns(first_name: str, last_name: str, domain: str) -> List[str]:
    """Generate common email patterns for a person"""
    first = first_name.lower().strip()
    last = last_name.lower().strip() if last_name else ""
    
    patterns = []
    if last:
        patterns.extend([
            f"{first}.{last}@{domain}",
            f"{first}@{domain}",
            f"{first}{last}@{domain}",
            f"{first[0]}{last}@{domain}",
            f"{first}{last[0]}@{domain}"
        ])
    else:
        patterns.append(f"{first}@{domain}")
    
    return patterns

async def find_existing_companies(query: str) -> List[Dict[str, Any]]:
    """Fast search for existing companies in database"""
    try:
        supabase = get_supabase_client()
        
        # Search by company name (case insensitive)
        response = supabase.table('scraped_company').select('*').ilike('name', f'%{query}%').limit(10).execute()
        
        existing_companies = []
        for company in response.data:
            existing_companies.append({
                'id': company['id'],
                'name': company['name'],
                'website': company['website'],
                'address': company['address'],
                'phone_number': company['phone_number'],
                'is_existing': True
            })
        
        return existing_companies
    except Exception as e:
        logger.error(f"Error searching existing companies: {e}")
        return []

@app.get("/")
async def root():
    return {"message": "Email Mining API - Clean Version is running"}

@app.post("/stream-search")
async def stream_search(request: StreamSearchRequest):
    """Main endpoint: Stream company discovery with real-time contact finding and email validation"""
    
    async def generate_search_stream():
        try:
            # Step 1: Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': 'Starting search...', 'stage': 'initializing'})}\n\n"
            
            # Step 2: Search existing companies first (fast)
            existing_companies = await find_existing_companies(request.query)
            if existing_companies:
                yield f"data: {json.dumps({'type': 'existing_companies', 'companies': existing_companies, 'count': len(existing_companies)})}\n\n"
                
                # Send existing contacts for these companies immediately
                contact_service = ContactService()
                for company in existing_companies:
                    existing_contacts = contact_service.get_contacts_by_company(company['id'])
                    for contact in existing_contacts:
                        if contact.get('emails'):  # Only send contacts with confirmed emails
                            contact_data = {
                                'id': str(contact['id']),
                                'first_name': contact['first_name'],
                                'last_name': contact['last_name'] or '',
                                'emails': contact.get('emails', []),
                                'company_id': company['id'],
                                'company_name': company['name']
                            }
                            yield f"data: {json.dumps({'type': 'contact_found', 'contact': contact_data, 'company_id': company['id']})}\n\n"
            
            # Step 3: Scrape new companies from Google Maps
            yield f"data: {json.dumps({'type': 'status', 'message': 'Discovering new companies...', 'stage': 'scraping'})}\n\n"
            
            companies = await maps_scraper.scrape_places(request.query, request.total)
            companies_with_websites = [
                company for company in companies 
                if company.get('website') and company.get('website').strip()
            ]
            
            # Step 4: Save companies to database and send immediately
            supabase = get_supabase_client()
            prompt_data = {
                "query_text": request.query,
                "total_requested": request.total,
                "total_found": len(companies_with_websites)
            }
            
            prompt_result = supabase.table('prompt').insert([prompt_data]).execute()
            prompt_id = prompt_result.data[0]['id'] if prompt_result.data else None
            
            new_companies = []
            for company in companies_with_websites:
                try:
                    website = company.get('website', '')
                    normalized_domain = normalize_domain(website)
                    
                    if not normalized_domain:
                        continue
                    
                    scraped_company_data = {
                        "name": company.get('name', ''),
                        "address": company.get('address', ''),
                        "website": website,
                        "normalized_domain": normalized_domain,
                        "phone_number": company.get('phone_number', ''),
                        "reviews_count": company.get('reviews_count'),
                        "reviews_average": company.get('reviews_average'),
                        "store_shopping": company.get('store_shopping', 'No'),
                        "in_store_pickup": company.get('in_store_pickup', 'No'),
                        "store_delivery": company.get('store_delivery', 'No'),
                        "place_type": company.get('place_type', ''),
                        "opens_at": company.get('opens_at', ''),
                        "introduction": company.get('introduction', '')
                    }
                    
                    company_result = supabase.table('scraped_company').upsert([scraped_company_data], on_conflict='normalized_domain').execute()
                    
                    if company_result.data:
                        company_id = company_result.data[0]['id']
                        company_with_id = {**company, "id": company_id, "is_existing": False}
                        new_companies.append(company_with_id)
                        
                        # Send company immediately to frontend
                        yield f"data: {json.dumps({'type': 'company_found', 'company': company_with_id})}\n\n"
                        
                        if prompt_id:
                            link_data = {"prompt_id": prompt_id, "scraped_company_id": company_id}
                            supabase.table('prompt_to_scraped_company').upsert([link_data], on_conflict='prompt_id,scraped_company_id').execute()
                
                except Exception as e:
                    logger.error(f"Error saving company {company.get('name', 'Unknown')}: {e}")
                    continue
            
            # Step 5: Start contact discovery for new companies only
            yield f"data: {json.dumps({'type': 'status', 'message': 'Discovering contacts and emails...', 'stage': 'discovery'})}\n\n"
            
            # Initialize services
            scraper = SearxngScraper()
            contact_service = ContactService()
            
            # Process new companies for contact mining
            for company in new_companies:
                company_id = company['id']
                company_name = company['name']
                website = company['website']
                domain = normalize_domain(website)
                
                try:
                    yield f"data: {json.dumps({'type': 'status', 'message': f'Finding contacts for {company_name}...', 'company_id': company_id})}\n\n"
                    
                    # Find contacts
                    scrape_result = scraper.scrape_company_contacts(
                        company_id=company_id,
                        company_name=company_name,
                        limit=5,
                        max_pages=1
                    )
                    
                    # Get the newly found contacts
                    contacts = contact_service.get_contacts_by_company(company_id)
                    logger.info(f"Retrieved {len(contacts)} contacts for {company_name}")
                    
                    # Process each contact for email validation
                    for contact in contacts:
                        first_name = contact['first_name']
                        last_name = contact['last_name'] or ''
                        
                        # Check if domain blocks email validation
                        if is_blocked_domain(domain):
                            # Generate most likely email pattern (no validation)
                            patterns = generate_email_patterns(first_name, last_name, domain)
                            if patterns:
                                best_email = patterns[0]  # Use most common pattern
                                
                                # Save unvalidated email
                                contact_email_data = {
                                    'contact_id': str(contact['id']),
                                    'email': best_email,
                                    'confidence': 'pattern_generated',
                                    'is_deliverable': None,  # Cannot validate
                                    'validation_result': {'blocked_domain': True, 'pattern': 'most_likely'}
                                }
                                
                                try:
                                    supabase.table('contact_email').insert([contact_email_data]).execute()
                                    
                                    # Send to frontend
                                    contact_data = {
                                        'id': str(contact['id']),
                                        'first_name': first_name,
                                        'last_name': last_name,
                                        'emails': [{'email': best_email, 'confidence': 'pattern_generated', 'is_deliverable': None}],
                                        'company_id': company_id,
                                        'company_name': company_name
                                    }
                                    logger.info(f"Sending pattern email contact to frontend: {first_name} {last_name} - {best_email}")
                                    yield f"data: {json.dumps({'type': 'contact_found', 'contact': contact_data, 'company_id': company_id})}\n\n"
                                    
                                except Exception as e:
                                    logger.error(f"Error saving pattern email for {first_name} {last_name}: {e}")
                        
                        else:
                            # Use localhost:8080 API for validation
                            patterns = generate_email_patterns(first_name, last_name, domain)
                            
                            async with ReacherEmailValidator() as validator:
                                for pattern in patterns[:2]:  # Check top 2 patterns
                                    try:
                                        validation_result = await validator.validate_email(pattern)
                                        
                                        if validation_result.get('is_deliverable'):
                                            # Save validated email
                                            contact_email_data = {
                                                'contact_id': str(contact['id']),
                                                'email': pattern,
                                                'confidence': validation_result.get('confidence', 'unknown'),
                                                'is_deliverable': validation_result.get('is_deliverable'),
                                                'validation_result': validation_result
                                            }
                                            
                                            try:
                                                supabase.table('contact_email').insert([contact_email_data]).execute()
                                                
                                                # Send validated email to frontend
                                                contact_data = {
                                                    'id': str(contact['id']),
                                                    'first_name': first_name,
                                                    'last_name': last_name,
                                                    'emails': [{'email': pattern, 'confidence': validation_result.get('confidence'), 'is_deliverable': True}],
                                                    'company_id': company_id,
                                                    'company_name': company_name
                                                }
                                                logger.info(f"Sending validated email contact to frontend: {first_name} {last_name} - {pattern}")
                                                yield f"data: {json.dumps({'type': 'contact_found', 'contact': contact_data, 'company_id': company_id})}\n\n"
                                                break  # Found valid email, stop checking patterns
                                                
                                            except Exception as e:
                                                logger.error(f"Error saving validated email for {first_name} {last_name}: {e}")
                                                
                                    except Exception as e:
                                        logger.error(f"Error validating email {pattern}: {e}")
                                        continue
                    
                    # Small delay between companies
                    await asyncio.sleep(0.1)
                        
                except Exception as e:
                    logger.error(f"Error processing company {company_name}: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'company_id': company_id, 'message': str(e)})}\n\n"
            
            # Send completion
            total_companies = len(existing_companies) + len(new_companies)
            yield f"data: {json.dumps({'type': 'complete', 'total_companies': total_companies, 'existing_companies': len(existing_companies), 'new_companies': len(new_companies)})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in stream search: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate_search_stream(), media_type="text/stream")

@app.post("/validate-email")
async def validate_email(request: ValidateEmailRequest):
    """Validate a single email address using Reacher API"""
    try:
        async with ReacherEmailValidator() as validator:
            result = await validator.validate_email(request.email, request.proxy)
            return {
                "success": True,
                "result": result
            }
    except Exception as e:
        logger.error(f"Error validating email {request.email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-contacts/{company_id}")
async def get_contacts(company_id: str):
    """Get all contacts with emails for a specific company"""
    try:
        contact_service = ContactService()
        contacts = contact_service.get_contacts_by_company(company_id)
        
        # Filter to only include contacts with confirmed emails
        confirmed_contacts = [
            contact for contact in contacts 
            if contact.get('emails') and any(
                email.get('is_deliverable') is True or email.get('confidence') == 'pattern_generated'
                for email in contact.get('emails', [])
            )
        ]
        
        return {
            "success": True,
            "company_id": company_id,
            "contacts": confirmed_contacts,
            "total_contacts": len(confirmed_contacts),
            "total_emails": sum(len(contact.get('emails', [])) for contact in confirmed_contacts)
        }
    except Exception as e:
        logger.error(f"Error fetching contacts for company {company_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_clean:app", host="0.0.0.0", port=8000, reload=True)