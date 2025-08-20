from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
from services.maps_scraper import GoogleMapsScraper
from services.reacher_email_validator import ReacherEmailValidator
from database.supabase_client import get_supabase_client
from utils.domain_utils import normalize_domain
import uuid
import asyncio
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

app = FastAPI(title="Email Mining API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
maps_scraper = GoogleMapsScraper()

class SearchCompaniesRequest(BaseModel):
    query: str
    total: int = 20

class MineEmailsRequest(BaseModel):
    company_id: str
    company_name: str
    website: str

class ValidateEmailRequest(BaseModel):
    email: str
    proxy: Optional[dict] = None

class ValidateEmailsBatchRequest(BaseModel):
    emails: List[str]
    proxy: Optional[dict] = None

class FindEmailRequest(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    company_website: str
    validate: bool = True

@app.get("/")
async def root():
    return {"message": "Email Mining API is running"}

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

@app.post("/validate-emails-batch")
async def validate_emails_batch(request: ValidateEmailsBatchRequest):
    """Validate multiple email addresses using Reacher API"""
    try:
        if not request.emails:
            raise HTTPException(status_code=400, detail="No emails provided")
        
        async with ReacherEmailValidator() as validator:
            results = await validator.validate_emails_batch(request.emails, request.proxy)
            
            # Separate results by status
            confirmed = [r for r in results if r['confidence'] == 'confirmed']
            unconfirmed = [r for r in results if r['confidence'] == 'unconfirmed']
            invalid = [r for r in results if r['confidence'] == 'invalid']
            risky = [r for r in results if r['confidence'] in ['risky', 'unknown']]
            
            return {
                "success": True,
                "total_processed": len(results),
                "confirmed": len(confirmed),
                "unconfirmed": len(unconfirmed),
                "invalid": len(invalid),
                "risky": len(risky),
                "results": results,
                "summary": {
                    "confirmed_emails": confirmed,
                    "unconfirmed_emails": unconfirmed,
                    "invalid_emails": invalid,
                    "risky_emails": risky
                }
            }
    except Exception as e:
        logger.error(f"Error validating email batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/find-email")
async def find_email(request: FindEmailRequest):
    """Find and optionally validate the most likely email for a person"""
    try:
        async with ReacherEmailValidator() as validator:
            # Generate most likely email pattern
            likely_email = validator.find_likely_email(
                request.first_name, 
                request.last_name, 
                request.company_website
            )
            
            if not likely_email:
                return {
                    "success": False,
                    "error": "Could not generate email pattern",
                    "first_name": request.first_name,
                    "last_name": request.last_name,
                    "company_website": request.company_website
                }
            
            result = {
                "success": True,
                "generated_email": likely_email,
                "first_name": request.first_name,
                "last_name": request.last_name,
                "company_website": request.company_website
            }
            
            # Validate the email if requested
            if request.validate:
                validation_result = await validator.validate_email(likely_email)
                result["validation"] = validation_result
                result["is_deliverable"] = validation_result.get('is_deliverable')
                result["confidence"] = validation_result.get('confidence')
                result["status"] = validation_result.get('status')
            
            return result
            
    except Exception as e:
        logger.error(f"Error finding email for {request.first_name} {request.last_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-companies")
async def search_companies(request: SearchCompaniesRequest):
    """Search for companies using Google Maps scraper and automatically save companies with domains"""
    try:
        # 1. Scrape companies from Google Maps
        companies = await maps_scraper.scrape_places(request.query, request.total)
        
        # 2. Filter companies with websites only
        companies_with_websites = [
            company for company in companies 
            if company.get('website') and company.get('website').strip()
        ]
        
        # 3. Create prompt record in database
        supabase = get_supabase_client()
        prompt_data = {
            "query_text": request.query,
            "total_requested": request.total,
            "total_found": len(companies_with_websites)
        }
        
        prompt_result = supabase.table('prompt').insert([prompt_data]).execute()
        if not prompt_result.data:
            raise Exception("Failed to create prompt record")
        
        prompt_id = prompt_result.data[0]['id']
        
        # 4. Save scraped companies with websites to database
        saved_companies = []
        for company in companies_with_websites:
            try:
                # Normalize the domain for deduplication
                website = company.get('website', '')
                normalized_domain = normalize_domain(website)
                
                if not normalized_domain:
                    print(f"Skipping company {company.get('name', 'Unknown')} - no valid domain")
                    continue
                
                # Prepare company data for database (no place_id needed)
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
                
                # Upsert scraped company using normalized_domain for deduplication
                company_result = supabase.table('scraped_company').upsert([scraped_company_data], on_conflict='normalized_domain').execute()
                
                if company_result.data:
                    company_id = company_result.data[0]['id']
                    
                    # Link prompt to scraped company
                    link_data = {
                        "prompt_id": prompt_id,
                        "scraped_company_id": company_id
                    }
                    
                    # Use upsert to avoid duplicate key errors
                    supabase.table('prompt_to_scraped_company').upsert([link_data], on_conflict='prompt_id,scraped_company_id').execute()
                    
                    # Add the company ID to the company data for frontend use
                    company_with_id = {**company, "id": company_id}
                    saved_companies.append(company_with_id)
                    
            except Exception as e:
                print(f"Error saving company {company.get('name', 'Unknown')}: {e}")
                # Continue with other companies even if one fails
                continue
        
        # Return the saved companies with IDs for frontend use
        return {
            "companies": saved_companies if saved_companies else companies_with_websites,
            "total_found": len(companies_with_websites),
            "saved_to_db": len(saved_companies),
            "prompt_id": prompt_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-and-mine")
async def search_and_mine(request: SearchCompaniesRequest):
    """Simplified endpoint that searches companies and automatically mines emails for all companies"""
    try:
        from services.searxng_scraper import SearxngScraper
        from services.contact_service import ContactService
        
        # 1. Search and save companies (reuse existing logic)
        search_result = await search_companies(request)
        companies = search_result["companies"]
        
        if not companies:
            return {
                "companies": [],
                "company_stats": {},
                "total_found": 0,
                "prompt_id": search_result["prompt_id"]
            }
        
        # 2. Initialize services for email mining
        scraper = SearxngScraper()
        contact_service = ContactService()
        company_stats = {}
        
        # 3. Mine emails for all companies automatically
        for company in companies:
            company_id = company.get('id')
            company_name = company.get('name', '')
            
            try:
                # Check if contacts already exist
                existing_contacts = contact_service.get_contacts_by_company(company_id)
                
                if not existing_contacts:
                    # Mine new contacts
                    scrape_result = scraper.scrape_company_contacts(
                        company_id=company_id,
                        company_name=company_name,
                        limit=10,
                        max_pages=2
                    )
                    contacts_created = scrape_result["contacts_created"]
                    emails_found = scrape_result["emails_found"]
                else:
                    # Use existing contacts
                    contacts_created = len(existing_contacts)
                    emails_found = sum(1 for contact in existing_contacts if hasattr(contact, 'email') and contact.email)
                
                # Get final contact data for response
                final_contacts = contact_service.get_contacts_by_company(company_id)
                
                company_stats[company_id] = {
                    "contactCount": len(final_contacts),
                    "emailCount": sum(len(contact.get('emails', [])) for contact in final_contacts),
                    "contacts": final_contacts
                }
                
            except Exception as e:
                print(f"Error mining emails for {company_name}: {e}")
                company_stats[company_id] = {
                    "contactCount": 0,
                    "emailCount": 0,
                    "contacts": []
                }
        
        return {
            "companies": companies,
            "company_stats": company_stats,
            "total_found": search_result["total_found"],
            "prompt_id": search_result["prompt_id"]
        }
        
    except Exception as e:
        print(f"Error in search-and-mine: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mine-emails")
async def mine_emails(request: MineEmailsRequest):
    """Mine emails and contacts for a specific company using SearXNG scraper"""
    try:
        from services.searxng_scraper import SearxngScraper
        from services.contact_service import ContactService
        
        # Initialize the SearXNG scraper
        scraper = SearxngScraper()
        contact_service = ContactService()
        
        # Add small delay to show loading
        await asyncio.sleep(0.5)
        
        # Check if contacts already exist for this scraped company
        existing_contacts = contact_service.get_contacts_by_company(request.company_id)
        
        if not existing_contacts:
            print(f"Scraping LinkedIn contacts for company: {request.company_name}")
            
            # Use SearXNG to find real LinkedIn contacts
            scrape_result = scraper.scrape_company_contacts(
                company_id=request.company_id,
                company_name=request.company_name,
                limit=10,  # Find up to 10 contacts per company
                max_pages=2
            )
            
            contacts_created = scrape_result["contacts_created"]
            emails_found = scrape_result["emails_found"]
            
            print(f"SearXNG scraper found {contacts_created} contacts and {emails_found} emails")
            
        else:
            # If contacts exist, just count them
            contacts_created = len(existing_contacts)
            # Count existing emails
            emails_found = sum(1 for contact in existing_contacts if hasattr(contact, 'email') and contact.email)
            print(f"Found existing {contacts_created} contacts with {emails_found} emails")
        
        return {
            "success": True,
            "company_name": request.company_name,
            "website": request.website,
            "contacts_found": emails_found,
            "total_contacts": contacts_created,
            "message": f"Successfully found {emails_found} valid emails from {contacts_created} LinkedIn contacts for {request.company_name}"
        }
        
    except Exception as e:
        print(f"Error in mine_emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-contacts/{company_id}")
async def get_contacts(company_id: str):
    """Get all contacts with emails for a specific company"""
    try:
        from services.contact_service import ContactService
        contact_service = ContactService()
        contacts = contact_service.get_contacts_by_company(company_id)
        
        return {
            "success": True,
            "company_id": company_id,
            "contacts": contacts,
            "total_contacts": len(contacts),
            "total_emails": sum(len(contact.get('emails', [])) for contact in contacts)
        }
    except Exception as e:
        print(f"Error fetching contacts for company {company_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-mine-emails-stream")
async def batch_mine_emails_stream(companies: List[dict]):
    """Stream real-time updates for batch email mining"""
    
    async def generate_mining_updates():
        try:
            from services.searxng_scraper import SearxngScraper
            
            scraper = SearxngScraper()
            total_companies = len(companies)
            total_contacts = 0
            total_emails = 0
            
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': 'Starting email mining process', 'progress': 0, 'current_company': 0, 'total_companies': total_companies})}\n\n"
            
            for i, company in enumerate(companies):
                company_id = company.get('id')
                company_name = company.get('name')
                company_website = company.get('website', '')
                
                # Send company progress update
                progress = (i / total_companies) * 100
                yield f"data: {json.dumps({'type': 'company_progress', 'company_name': company_name, 'progress': progress, 'current_company': i + 1, 'total_companies': total_companies})}\n\n"
                
                try:
                    # Mine contacts for this company
                    result = scraper.scrape_company_contacts(
                        company_id=company_id,
                        company_name=company_name,
                        limit=10,
                        max_pages=2
                    )
                    
                    contacts_found = result.get('contacts_created', 0)
                    emails_found = result.get('emails_found', 0)
                    
                    total_contacts += contacts_found
                    total_emails += emails_found
                    
                    # Send company completion with real-time email data
                    yield f"data: {json.dumps({'type': 'company_complete', 'company_id': company_id, 'company_name': company_name, 'contacts_found': contacts_found, 'emails_found': emails_found, 'progress': progress})}\n\n"
                    
                    # If we found contacts, send email details
                    if contacts_found > 0:
                        # Get the actual contact and email data to send to frontend
                        from services.contact_service import ContactService
                        contact_service = ContactService()
                        contacts = contact_service.get_contacts_by_company(company_id)
                        
                        for contact in contacts[:5]:  # Send first 5 for real-time display
                            contact_emails = []
                            if contact.get('emails'):
                                for email_obj in contact['emails']:
                                    email_data = {
                                        'email': email_obj.get('email', ''),
                                        'confidence': 'medium',  # Default confidence since we don't store it in DB
                                        'is_deliverable': email_obj.get('is_deliverable', True)
                                    }
                                    contact_emails.append(email_data)
                            
                            contact_data = {
                                'id': str(contact['id']),
                                'first_name': contact['first_name'],
                                'last_name': contact['last_name'] or '',
                                'emails': contact_emails,
                                'company_name': company_name
                            }
                            
                            yield f"data: {json.dumps({'type': 'contact_found', 'contact': contact_data, 'company_id': company_id})}\n\n"
                    
                    # Small delay between companies
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    print(f"Error processing company {company_name}: {e}")
                    yield f"data: {json.dumps({'type': 'company_error', 'company_name': company_name, 'error': str(e)})}\n\n"
                    continue
            
            # Send final completion
            yield f"data: {json.dumps({'type': 'complete', 'total_contacts': total_contacts, 'total_emails': total_emails, 'companies_processed': total_companies})}\n\n"
            
        except Exception as e:
            print(f"Error in streaming mining: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(generate_mining_updates(), media_type="text/stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)