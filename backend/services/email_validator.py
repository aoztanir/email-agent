import re
import dns.resolver
from typing import Tuple, Dict, List
from urllib.parse import urlparse
import logging
import hashlib
import requests

logger = logging.getLogger(__name__)

class EmailValidator:
    """Fast custom email validation algorithm replacing MailScout"""
    
    # Email providers that typically block email verification
    VERIFICATION_BLOCKING_PROVIDERS = {
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
        'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
        'tutanota.com', 'mailbox.org'
    }
    
    # Common email patterns for corporate domains
    CORPORATE_EMAIL_PATTERNS = [
        '{first}.{last}@{domain}',
        '{first}{last}@{domain}', 
        '{first}@{domain}',
        '{first_initial}{last}@{domain}',
        '{first}{last_initial}@{domain}',
        '{first_initial}.{last}@{domain}',
        'info@{domain}',
        'contact@{domain}',
        'hello@{domain}',
        'support@{domain}'
    ]
    
    def __init__(self):
        self.dns_cache = {}
        self.gravatar_cache = {}
    
    def validate_email_format(self, email: str) -> bool:
        """Basic email format validation"""
        if not email or '@' not in email:
            return False
            
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def check_domain_mx_record(self, domain: str) -> bool:
        """Check if domain has MX record (cached)"""
        if domain in self.dns_cache:
            return self.dns_cache[domain]
            
        try:
            mx_records = dns.resolver.resolve(domain, 'MX')
            self.dns_cache[domain] = True
            return True
        except Exception:
            self.dns_cache[domain] = False
            return False
    
    def extract_domain_from_website(self, website: str) -> str:
        """Extract domain from website URL"""
        if not website:
            return ""
            
        if not website.startswith(('http://', 'https://')):
            website = 'https://' + website
            
        try:
            parsed = urlparse(website)
            domain = parsed.netloc.lower()
            # Remove www. prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except Exception:
            return ""
    
    def is_verification_blocking_provider(self, email: str) -> bool:
        """Check if email provider typically blocks verification"""
        domain = email.split('@')[-1].lower()
        return domain in self.VERIFICATION_BLOCKING_PROVIDERS
    
    def check_gravatar_exists(self, email: str) -> bool:
        """Check if email has a Gravatar profile (indicates real, active email)"""
        if email in self.gravatar_cache:
            return self.gravatar_cache[email]
        
        try:
            # Create MD5 hash of lowercased email (Gravatar requirement)
            email_hash = hashlib.md5(email.lower().encode()).hexdigest()
            
            # Check if Gravatar exists using default image fallback
            gravatar_url = f"https://www.gravatar.com/avatar/{email_hash}?d=404"
            response = requests.get(gravatar_url, timeout=5)
            
            # If status is 200, Gravatar exists; if 404, no Gravatar
            has_gravatar = response.status_code == 200
            self.gravatar_cache[email] = has_gravatar
            return has_gravatar
            
        except Exception:
            self.gravatar_cache[email] = False
            return False
    
    def generate_likely_email_patterns(self, first_name: str, last_name: str, website: str) -> List[Dict]:
        """Generate most likely email patterns for a person at a company"""
        domain = self.extract_domain_from_website(website)
        if not domain:
            return []
        
        # Check domain MX record FIRST - if no MX record, no emails possible
        if not self.check_domain_mx_record(domain):
            return []
        
        first = first_name.lower().strip()
        last = last_name.lower().strip() if last_name else ""
        
        emails = []
        
        # Most common corporate patterns in order of likelihood
        patterns = [
            f"{first}.{last}@{domain}",
            f"{first}{last}@{domain}",
            f"{first}@{domain}",
            f"{first[0]}{last}@{domain}" if first and last else None,
            f"{first}{last[0]}@{domain}" if first and last else None,
            f"{first[0]}.{last}@{domain}" if first and last else None,
        ]
        
        # Filter out None values and validate format
        for i, pattern in enumerate(patterns):
            if pattern and self.validate_email_format(pattern):
                confidence = self._calculate_pattern_confidence(pattern, i)
                pattern_type = self._get_pattern_type(pattern)
                emails.append({
                    'email': pattern,
                    'confidence': confidence,
                    'pattern_type': pattern_type
                })
        
        return emails
    
    def _calculate_pattern_confidence(self, email: str, pattern_index: int) -> str:
        """Calculate confidence level for email pattern"""
        domain = email.split('@')[-1]
        
        # Check if domain has MX record
        if not self.check_domain_mx_record(domain):
            return 'low'
        
        # Check if it's a verification-blocking provider
        if self.is_verification_blocking_provider(email):
            return 'uncertain'
        
        # Based on pattern commonality (earlier patterns are more common)
        if pattern_index <= 2:  # Most common patterns
            return 'high'
        else:
            return 'medium'
    
    def _get_pattern_type(self, email: str) -> str:
        """Identify the type of email pattern"""
        local_part = email.split('@')[0]
        
        if '.' in local_part:
            return 'first.last'
        elif len(local_part) > 8:  # Likely firstname+lastname
            return 'firstlast'
        elif len(local_part) <= 3:  # Likely initials
            return 'initials'
        else:
            return 'first_name'
    
    def validate_and_score_email(self, email: str, first_name: str = "", last_name: str = "", website: str = "") -> Dict:
        """Main validation function that returns email with confidence score"""
        if not self.validate_email_format(email):
            return {
                'email': email,
                'is_valid': False,
                'confidence': 'invalid',
                'reason': 'Invalid email format'
            }
        
        domain = email.split('@')[-1]
        
        # Check MX record
        if not self.check_domain_mx_record(domain):
            return {
                'email': email,
                'is_valid': False,
                'confidence': 'low',
                'reason': 'Domain has no MX record'
            }
        
        # Check if it's from a verification-blocking provider
        if self.is_verification_blocking_provider(email):
            confidence = 'uncertain'
            reason = 'Provider blocks email verification'
        else:
            # For corporate domains, try to match against likely patterns
            if website:
                expected_domain = self.extract_domain_from_website(website)
                if expected_domain and domain == expected_domain:
                    confidence = 'high'
                    reason = 'Matches company domain'
                else:
                    confidence = 'medium'
                    reason = 'Different from company domain'
            else:
                confidence = 'medium'
                reason = 'Format valid, domain has MX record'
        
        # Check Gravatar for additional confidence
        if confidence in ['high', 'medium']:
            has_gravatar = self.check_gravatar_exists(email)
            if has_gravatar:
                confidence = 'high'
                reason = f"{reason} + active Gravatar"
        
        return {
            'email': email,
            'is_valid': True,
            'confidence': confidence,
            'reason': reason
        }
    
    def find_best_email_for_contact(self, first_name: str, last_name: str, website: str) -> Dict:
        """Find the most likely email for a contact"""
        generated_emails = self.generate_likely_email_patterns(first_name, last_name, website)
        
        if not generated_emails:
            return {
                'email': None,
                'confidence': 'none',
                'reason': 'Could not generate valid email patterns'
            }
        
        # Return the highest confidence email (first one due to ordering)
        best_email = generated_emails[0]
        validation_result = self.validate_and_score_email(
            best_email['email'], first_name, last_name, website
        )
        
        return validation_result