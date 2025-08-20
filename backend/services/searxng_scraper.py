import requests
import time
import random
from typing import List, Dict, Optional
from database.supabase_client import get_supabase_client
from services.contact_service import ContactService
from services.contact_email_service import ContactEmailService
from models.models import ContactCreate, ContactEmailCreate
from services.email_validator import EmailValidator
from urllib.parse import urlparse

class SearxngScraper:
    def __init__(self, searxng_url: str = "http://localhost:8888"):
        """
        Initialize SearxNG scraper with MailScout integration
        """
        self.searxng_url = searxng_url
        self.search_url = f"{searxng_url}/search"
        self.contact_service = None
        self.contact_email_service = None
        
        # Initialize MailScout
        self.email_validator = EmailValidator()
    
    def search_employee_profiles(self, company_name: str, page: int = 1, timeout: int = 10) -> List[Dict]:
        """
        Search for employee profiles from a specific company using SearxNG
        """
        params = {
            "q": f'site:linkedin.com/in "{company_name}"',
            "format": "json",
            "categories": "general",
            "safesearch": 0,
            "pageno": page
        }
        
        try:
            response = requests.get(self.search_url, params=params, timeout=timeout)
            if response.status_code != 200:
                print(f"Error from SearxNG: {response.status_code}")
                return []

            data = response.json()
            results = data.get("results", [])
            profiles = []
            
            for result in results:
                url = result.get("url", "")
                title = result.get("title", "")
                snippet = result.get("content", "")  # Bio or description
                
                if "linkedin.com/in" in url:
                    # Extract name from title (usually "Name - Title - Company")
                    name_parts = title.split(" - ")[0].strip()
                    first_name, last_name = self._split_name(name_parts)
                    
                    profiles.append({
                        "first_name": first_name,
                        "last_name": last_name,
                        "linkedin_url": url,
                        "bio": snippet
                    })
            
            return profiles
            
        except Exception as e:
            print(f"Error searching employee profiles: {e}")
            return []
    
    def _split_name(self, full_name: str) -> tuple[str, str]:
        """
        Split full name into first and last name
        """
        if not full_name:
            return "", ""
        
        name_parts = full_name.strip().split()
        if len(name_parts) == 1:
            return name_parts[0], ""
        elif len(name_parts) >= 2:
            return name_parts[0], " ".join(name_parts[1:])
        else:
            return "", ""
    
    def _extract_domain_from_company(self, company_info: Dict) -> Optional[str]:
        """
        Extract domain from company website information
        """
        website = company_info.get('website')
        if not website:
            return None
        
        try:
            # Ensure the URL has a scheme
            if not website.startswith(('http://', 'https://')):
                website = 'https://' + website
            
            parsed = urlparse(website)
            domain = parsed.netloc.lower()
            
            # Remove www. prefix if present
            if domain.startswith('www.'):
                domain = domain[4:]
            
            return domain if domain else None
        
        except Exception as e:
            print(f"Error extracting domain from {website}: {e}")
            return None
    
    def find_contact_emails(self, contact_names: List[str], company_domain: str, contact_id: str, company_website: str = "") -> List[Dict]:
        """
        Use custom email validator to generate and validate email addresses for a contact
        """
        if not company_domain or not contact_names:
            return []
        
        try:
            # Initialize email service if not already done
            if self.contact_email_service is None:
                self.contact_email_service = ContactEmailService()
            
            valid_emails = []
            
            # Process each contact name
            for full_name in contact_names:
                # Split name into first and last
                name_parts = full_name.strip().split(' ', 1)
                first_name = name_parts[0] if name_parts else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                
                # Generate likely email patterns using our custom validator
                generated_emails = self.email_validator.generate_likely_email_patterns(
                    first_name, last_name, company_website or f"https://{company_domain}"
                )
                
                # Validate and store the most likely emails
                for email_info in generated_emails[:3]:  # Take top 3 most likely
                    email = email_info['email']
                    confidence = email_info['confidence']
                    
                    # Validate the email
                    validation_result = self.email_validator.validate_and_score_email(
                        email, first_name, last_name, company_website or f"https://{company_domain}"
                    )
                    
                    if validation_result['is_valid']:
                        try:
                            email_data = ContactEmailCreate(
                                contact_id=contact_id,
                                email=email,
                                is_valid=True,
                                is_deliverable=validation_result['confidence'] == 'high',
                                found_by="custom_validator"
                            )
                            
                            created_email = self.contact_email_service.create_contact_email(email_data)
                            if created_email:
                                valid_emails.append({
                                    'email': email,
                                    'confidence': validation_result['confidence'],
                                    'reason': validation_result['reason']
                                })
                                print(f"Generated and stored email: {email} ({validation_result['confidence']}) for contact {contact_id}")
                        
                        except Exception as e:
                            print(f"Error storing email {email} for contact {contact_id}: {e}")
                            continue
            
            return valid_emails
            
        except Exception as e:
            print(f"Error finding emails for contact {contact_id}: {e}")
            return []
    
    def scrape_company_contacts(self, company_id: str, company_name: str, limit: int = 20, max_pages: int = 3, group_id: str = None) -> Dict[str, any]:
        """
        Scrape contacts for a specific company and save to database with email finding
        """
        # Initialize services if not already done
        if self.contact_service is None:
            self.contact_service = ContactService()
        if self.contact_email_service is None:
            self.contact_email_service = ContactEmailService()
            
        # Get company information to extract domain for email finding
        try:
            supabase = get_supabase_client()
            company_result = supabase.table('scraped_company').select('*').eq('id', company_id).execute()
            company_info = company_result.data[0] if company_result.data else {}
            company_domain = self._extract_domain_from_company(company_info)
            print(f"Using domain {company_domain} for email finding for {company_name}")
        except Exception as e:
            print(f"Error getting company info: {e}")
            company_domain = None
            
        all_profiles = []
        
        # Search multiple pages to get more results
        for page in range(1, max_pages + 1):
            profiles = self.search_employee_profiles(company_name, page)
            all_profiles.extend(profiles)
            
            # Stop if we have enough profiles or no more results
            if len(all_profiles) >= limit or len(profiles) == 0:
                break
            
            # Add delay between pages to be respectful
            time.sleep(random.uniform(2, 4))
        
        # Limit to the requested number
        all_profiles = all_profiles[:limit]
        
        contacts_created = 0
        emails_found = 0
        errors = []
        
        for profile in all_profiles:
            try:
                if profile['first_name']:  # Only create if we have at least a first name
                    contact_data = ContactCreate(
                        company_id=company_id,
                        first_name=profile['first_name'],
                        last_name=profile['last_name'],
                        bio=profile['bio'],
                        linkedin_url=profile['linkedin_url']
                    )
                    
                    # Create contact and get the created contact info
                    created_contact = self.contact_service.create_contact(contact_data, group_id)
                    if created_contact:
                        contacts_created += 1
                        
                        # Try to find emails for this contact if we have a domain
                        if company_domain and created_contact.id:
                            contact_names = [profile['first_name']]
                            if profile['last_name']:
                                contact_names.append(profile['last_name'])
                                contact_names.append(f"{profile['first_name']} {profile['last_name']}")
                            
                            # Find emails using custom validator
                            found_emails = self.find_contact_emails(
                                contact_names, 
                                company_domain, 
                                str(created_contact.id),
                                company_info.get('website', '')
                            )
                            
                            emails_found += len(found_emails)
                            
                            # Add delay between email searches to be respectful
                            if found_emails:
                                time.sleep(random.uniform(1, 3))
                    
            except Exception as e:
                errors.append(f"Error creating contact for {profile['first_name']} {profile['last_name']}: {str(e)}")
                continue
        
        return {
            "contacts_created": contacts_created,
            "emails_found": emails_found,
            "total_profiles_found": len(all_profiles),
            "company_domain": company_domain,
            "errors": errors
        }
    
    def batch_scrape_companies(self, companies: List[Dict], contacts_per_company: int = 20) -> Dict[str, any]:
        """
        Scrape contacts for multiple companies with email finding
        """
        total_contacts = 0
        total_emails = 0
        processed_companies = 0
        all_errors = []
        
        for company in companies:
            try:
                print(f"Scraping contacts for: {company['name']}")
                
                result = self.scrape_company_contacts(
                    company['id'], 
                    company['name'], 
                    contacts_per_company
                )
                
                total_contacts += result['contacts_created']
                total_emails += result.get('emails_found', 0)
                processed_companies += 1
                
                if result['errors']:
                    all_errors.extend([f"Company {company['name']}: {error}" for error in result['errors']])
                
                print(f"Found {result['contacts_created']} contacts and {result.get('emails_found', 0)} emails for {company['name']}")
                if result.get('company_domain'):
                    print(f"Used domain: {result['company_domain']}")
                
                # Add delay between companies to be respectful
                time.sleep(random.uniform(5, 10))
                
            except Exception as e:
                error_msg = f"Company {company['name']}: {str(e)}"
                all_errors.append(error_msg)
                print(f"Error processing {company['name']}: {e}")
                continue
        
        return {
            "total_contacts_created": total_contacts,
            "total_emails_found": total_emails,
            "processed_companies": processed_companies,
            "total_companies": len(companies),
            "errors": all_errors
        }