from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json
from urllib.parse import urlparse
from services.maps_scraper import GoogleMapsScraper
from database.supabase_client import get_supabase_client
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


class CompanySearchRequest(BaseModel):
    query: str
    total: int = 20

def normalize_domain(website_url: str) -> str:
    """Extract and normalize domain from website URL"""
    try:
        if not website_url:
            return ""
        
        # Add protocol if missing
        if not website_url.startswith(('http://', 'https://')):
            website_url = 'https://' + website_url
        
        parsed = urlparse(website_url)
        domain = parsed.netloc.lower()
        
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
            
        return domain
    except Exception:
        return website_url.lower().strip()

maps_scraper = GoogleMapsScraper()

app = FastAPI()
origins = [
    "http://localhost:3000",  # your frontend dev server
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],     # allow all methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],     # allow all headers
)

@app.get("/")
async def root():
    return {"message": "Contact Mining API is running"}

@app.get("/test-stream")
async def stream():
    async def event_generator():
        for i in range(5):
            # Build a JSON payload
            data = {"step": i, "message": f"Update {i}"}
            # Yield as SSE event
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1)  # simulate work
        # Send a completion event
        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/find-companies-and-contacts")
async def find_companies_and_contacts(request: CompanySearchRequest):
    print(f"Received request: {request}")
    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': 'Discovering new companies...', 'stage': 'scraping'})}\n\n"

            #* Scrape companies from Google Maps
            companies = await maps_scraper.scrape_places(request.query, request.total)
            companies_with_websites = [
                company for company in companies 
                if company.get('website') and company.get('website').strip()
            ]
            # Database operations (using synchronous Supabase client)
            try:
                supabase = get_supabase_client()
                
                # Store the prompt data first
                prompt_data = {
                    "query_text": request.query,
                    "total_requested": request.total,
                    "total_found": len(companies_with_websites)
                }
                prompt_result = supabase.table('prompt').insert([prompt_data]).execute()
                prompt_id = prompt_result.data[0]['id']
                
                yield f"data: {json.dumps({'type': 'status', 'message': 'Storing companies in database...', 'stage': 'storing_data'})}\n\n"
                
                # Prepare companies for scraped_company table with normalized domains
                scraped_companies = []
                for company in companies_with_websites:
                    normalized_domain = normalize_domain(company.get('website', ''))
                    
                    scraped_company = {
                        'name': company.get('name', ''),
                        'address': company.get('address', ''),
                        'website': company.get('website', ''),
                        'normalized_domain': normalized_domain,
                        'phone_number': company.get('phone_number', ''),
                        'reviews_count': company.get('reviews_count'),
                        'reviews_average': company.get('reviews_average'),
                        'store_shopping': company.get('store_shopping', 'No'),
                        'in_store_pickup': company.get('in_store_pickup', 'No'),
                        'store_delivery': company.get('store_delivery', 'No'),
                        'place_type': company.get('place_type', ''),
                        'opens_at': company.get('opens_at', ''),
                        'introduction': company.get('introduction', '')
                    }
                    scraped_companies.append(scraped_company)
                
                # Insert companies using upsert to handle duplicates
                companies_result = supabase.table('scraped_company').upsert(
                    scraped_companies,
                    on_conflict='normalized_domain'
                ).execute()
                
                if companies_result.data:
                    stored_companies = companies_result.data
                    yield f"data: {json.dumps({'type': 'companies_stored', 'message': f'Successfully stored {len(stored_companies)} companies in database.'})}\n\n"
                    
                    # Create relationships in prompt_to_scraped_company table
                    yield f"data: {json.dumps({'type': 'status', 'message': 'Creating company-prompt relationships...', 'stage': 'linking_data'})}\n\n"
                    
                    relationships = []
                    for company in stored_companies:
                        relationships.append({
                            'prompt_id': prompt_id,
                            'scraped_company_id': company['id']
                        })
                    
                    # Insert relationships (using upsert to avoid duplicates)
                    relationship_result = supabase.table('prompt_to_scraped_company').upsert(
                        relationships,
                        on_conflict='prompt_id,scraped_company_id'
                    ).execute()
                    
                    if relationship_result.data:
                        yield f"data: {json.dumps({'type': 'relationships_created', 'message': f'Created {len(relationship_result.data)} company-prompt relationships.'})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'warning', 'message': 'Companies were processed but no data returned from database.'})}\n\n"
                
            except Exception as db_error:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Database error: {str(db_error)}'})}\n\n"
                print(f"Database error: {str(db_error)}")
                # Continue with the process even if database fails
            
            yield f"data: {json.dumps({'type': 'status', 'message': 'Finding contacts for each company...', 'stage': 'finding_contacts'})}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Process completed successfully.'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'An error occurred: {str(e)}'})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)