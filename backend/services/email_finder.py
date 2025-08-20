import re
import requests
import time
from typing import List, Dict, Optional
from urllib.parse import urlparse
from services.contact_service import ContactService

class EmailFinder:
    def __init__(self):
        self.contact_service = ContactService()
        
    def generate_email_patterns(self, first_name: str, last_name: str, domain: str) -> List[str]:
        """
        Generate common email patterns based on name and domain
        """
        first = first_name.lower().replace(' ', '')
        last = last_name.lower().replace(' ', '')
        
        patterns = [
            f"{first}.{last}@{domain}",
            f"{first}@{domain}",
            f"{last}@{domain}",
            f"{first}{last}@{domain}",
            f"{first[0]}{last}@{domain}",
            f"{first}{last[0]}@{domain}",
            f"{first[0]}.{last}@{domain}",
            f"{first}.{last[0]}@{domain}",
            f"{first}_{last}@{domain}",
            f"{last}.{first}@{domain}",
            f"{last}{first}@{domain}",
        ]
        
        return patterns
    
    def extract_domain_from_website(self, website: str) -> Optional[str]:
        """
        Extract domain from website URL
        """
        try:
            if not website.startswith(('http://', 'https://')):
                website = 'https://' + website
            
            parsed = urlparse(website)
            domain = parsed.netloc.lower()
            
            # Remove www. if present
            if domain.startswith('www.'):
                domain = domain[4:]
            
            return domain
        except Exception:
            return None
    
    def verify_email_format(self, email: str) -> bool:
        """
        Basic email format validation
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def check_email_deliverability(self, email: str) -> bool:
        """
        Basic email deliverability check
        Note: This is a simplified version. In production, you'd use a proper email verification service
        """
        try:
            # Extract domain
            domain = email.split('@')[1]
            
            # Simple MX record check using DNS lookup
            import socket
            try:
                socket.gethostbyname(domain)
                return True
            except socket.gaierror:
                return False
                
        except Exception:
            return False
    
    def find_email_for_contact(self, contact_id: str, company_website: str) -> Optional[str]:
        """
        Find email for a specific contact
        """
        try:
            # Get contact details
            contact = self.contact_service.get_contact_by_id(contact_id)
            if not contact or not contact.first_name:
                return None
            
            # Use the separate name fields
            first_name = contact.first_name
            last_name = contact.last_name or ""
            
            # Extract domain from company website
            domain = self.extract_domain_from_website(company_website)
            if not domain:
                return None
            
            # Generate email patterns
            email_patterns = self.generate_email_patterns(first_name, last_name, domain)
            
            # Test each pattern
            for email in email_patterns:
                if self.verify_email_format(email):
                    if self.check_email_deliverability(email):
                        return email
                
                # Add small delay to avoid overwhelming servers
                time.sleep(0.1)
            
            return None
            
        except Exception as e:
            print(f"Error finding email for contact {contact_id}: {e}")
            return None
    
    def process_contacts_without_emails(self, batch_size: int = 50) -> Dict[str, any]:
        """
        Process contacts that don't have email addresses
        """
        try:
            # Get contacts without emails
            contacts = self.contact_service.get_contacts_without_email(limit=batch_size)
            
            processed = 0
            emails_found = 0
            errors = []
            
            for contact in contacts:
                try:
                    # Get company details to find website
                    from services.company_service import CompanyService
                    company_service = CompanyService()
                    company = company_service.get_company_by_id(str(contact.company_id))
                    
                    if not company.website:
                        errors.append(f"Contact {contact.first_name} {contact.last_name or ''}: No company website available")
                        continue
                    
                    # Find email
                    email = self.find_email_for_contact(str(contact.id), company.website)
                    
                    if email:
                        # Update contact with found email
                        self.contact_service.update_contact_email(str(contact.id), email)
                        emails_found += 1
                    
                    processed += 1
                    
                    # Add delay between contacts
                    time.sleep(1)
                    
                except Exception as e:
                    errors.append(f"Contact {contact.first_name} {contact.last_name or ''}: {str(e)}")
                    continue
            
            return {
                "processed": processed,
                "emails_found": emails_found,
                "errors": errors
            }
            
        except Exception as e:
            return {
                "error": f"Failed to process contacts: {str(e)}",
                "processed": 0,
                "emails_found": 0
            }
    
    def find_email_with_hunter_io(self, first_name: str, last_name: str, domain: str, api_key: str) -> Optional[str]:
        """
        Use Hunter.io API to find email (requires API key)
        This is a more reliable method for production use
        """
        try:
            url = "https://api.hunter.io/v2/email-finder"
            params = {
                "domain": domain,
                "first_name": first_name,
                "last_name": last_name,
                "api_key": api_key
            }
            
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("data") and data["data"].get("email"):
                    return data["data"]["email"]
            
            return None
            
        except Exception as e:
            print(f"Error using Hunter.io API: {e}")
            return None