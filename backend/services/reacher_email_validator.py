import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Tuple
from config.api_config import api_config

logger = logging.getLogger(__name__)

class ReacherEmailValidator:
    """Email validator using Reacher check-if-email-exists API"""
    
    # Major email providers that use predictable patterns
    MAJOR_PROVIDERS = {
        'gmail.com': ['firstname.lastname', 'firstname'],
        'outlook.com': ['firstname.lastname', 'firstname'],
        'hotmail.com': ['firstname.lastname', 'firstname'],
        'yahoo.com': ['firstname.lastname', 'firstname'],
        'live.com': ['firstname.lastname', 'firstname'],
        'icloud.com': ['firstname.lastname', 'firstname'],
        'protonmail.com': ['firstname.lastname', 'firstname'],
        'mailgun.net': ['firstname.lastname', 'firstnamelastname'],
        'sendgrid.net': ['firstname.lastname', 'firstnamelastname']
    }
    
    def __init__(self):
        self.session = None
        self.timeout = aiohttp.ClientTimeout(total=api_config.email_validation_timeout)
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _extract_domain(self, email: str) -> str:
        """Extract domain from email address"""
        return email.split('@')[-1].lower() if '@' in email else ''
    
    def _is_major_provider(self, email: str) -> bool:
        """Check if email is from a major provider"""
        domain = self._extract_domain(email)
        return domain in self.MAJOR_PROVIDERS
    
    def _generate_email_pattern(self, first_name: str, last_name: str, domain: str) -> str:
        """Generate most likely email pattern for major providers"""
        if not first_name:
            return None
            
        first = first_name.lower().strip()
        last = last_name.lower().strip() if last_name else ''
        
        patterns = self.MAJOR_PROVIDERS.get(domain, ['firstname.lastname'])
        
        # Use the first (most common) pattern
        pattern = patterns[0]
        
        if pattern == 'firstname.lastname' and last:
            return f"{first}.{last}@{domain}"
        elif pattern == 'firstnamelastname' and last:
            return f"{first}{last}@{domain}"
        else:
            return f"{first}@{domain}"
    
    async def validate_email(self, email: str, proxy: Optional[Dict] = None) -> Dict:
        """Validate a single email using Reacher API"""
        if not self.session:
            raise RuntimeError("ReacherEmailValidator must be used as an async context manager")
        
        try:
            payload = {"to_email": email}
            if proxy:
                payload["proxy"] = proxy
            
            headers = api_config.get_reacher_headers()
            endpoint = api_config.get_reacher_endpoint()
            
            async with self.session.post(endpoint, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return self._process_reacher_response(result)
                else:
                    error_text = await response.text()
                    logger.error(f"Reacher API error {response.status}: {error_text}")
                    return self._create_fallback_result(email, f"API error: {response.status}")
                    
        except asyncio.TimeoutError:
            logger.error(f"Timeout validating email: {email}")
            return self._create_fallback_result(email, "Validation timeout")
        except Exception as e:
            logger.error(f"Error validating email {email}: {e}")
            return self._create_fallback_result(email, str(e))
    
    def _process_reacher_response(self, reacher_result: Dict) -> Dict:
        """Process Reacher API response into our format"""
        email = reacher_result.get('input', '')
        is_reachable = reacher_result.get('is_reachable', 'unknown')
        
        # Extract detailed information
        syntax = reacher_result.get('syntax', {})
        mx = reacher_result.get('mx', {})
        smtp = reacher_result.get('smtp', {})
        misc = reacher_result.get('misc', {})
        
        # Determine our confidence level based on Reacher's response
        if is_reachable == 'safe':
            confidence = 'confirmed'
            status = 'deliverable'
        elif is_reachable == 'risky':
            if self._is_major_provider(email):
                confidence = 'unconfirmed'
                status = 'unconfirmed_major_provider'
            else:
                confidence = 'risky'
                status = 'risky'
        elif is_reachable == 'invalid':
            confidence = 'invalid'
            status = 'invalid'
        else:  # unknown
            if self._is_major_provider(email):
                confidence = 'unconfirmed'
                status = 'unconfirmed_major_provider'
            else:
                confidence = 'unknown'
                status = 'unknown'
        
        return {
            'email': email,
            'status': status,
            'confidence': confidence,
            'is_deliverable': smtp.get('is_deliverable', False),
            'is_disabled': smtp.get('is_disabled', False),
            'has_full_inbox': smtp.get('has_full_inbox', False),
            'is_catch_all': smtp.get('is_catch_all', False),
            'is_disposable': misc.get('is_disposable', False),
            'is_role_account': misc.get('is_role_account', False),
            'is_b2c': misc.get('is_b2c', None),
            'mx_accepts_mail': mx.get('accepts_mail', False),
            'mx_records': mx.get('records', []),
            'syntax_valid': syntax.get('is_valid_syntax', False),
            'domain': syntax.get('domain', ''),
            'username': syntax.get('username', ''),
            'suggestion': syntax.get('suggestion'),
            'gravatar_url': misc.get('gravatar_url'),
            'haveibeenpwned': misc.get('haveibeenpwned'),
            'raw_reacher_response': reacher_result
        }
    
    def _create_fallback_result(self, email: str, error: str) -> Dict:
        """Create a fallback result when Reacher API fails"""
        is_major = self._is_major_provider(email)
        
        return {
            'email': email,
            'status': 'unconfirmed_major_provider' if is_major else 'unknown',
            'confidence': 'unconfirmed' if is_major else 'unknown',
            'is_deliverable': None,
            'is_disabled': None,
            'has_full_inbox': None,
            'is_catch_all': None,
            'is_disposable': None,
            'is_role_account': None,
            'is_b2c': None,
            'mx_accepts_mail': None,
            'mx_records': [],
            'syntax_valid': '@' in email,
            'domain': self._extract_domain(email),
            'username': email.split('@')[0] if '@' in email else email,
            'suggestion': None,
            'gravatar_url': None,
            'haveibeenpwned': None,
            'error': error,
            'raw_reacher_response': None
        }
    
    async def validate_emails_batch(self, emails: List[str], proxy: Optional[Dict] = None) -> List[Dict]:
        """Validate multiple emails concurrently"""
        if not emails:
            return []
        
        # Limit batch size
        if len(emails) > api_config.batch_validation_limit:
            emails = emails[:api_config.batch_validation_limit]
            logger.warning(f"Batch size limited to {api_config.batch_validation_limit} emails")
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(10)  # Max 10 concurrent requests
        
        async def validate_with_semaphore(email):
            async with semaphore:
                return await self.validate_email(email, proxy)
        
        tasks = [validate_with_semaphore(email) for email in emails]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return valid results
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error validating email {emails[i]}: {result}")
                valid_results.append(self._create_fallback_result(emails[i], str(result)))
            else:
                valid_results.append(result)
        
        return valid_results
    
    def find_likely_email(self, first_name: str, last_name: str, company_website: str) -> Optional[str]:
        """Find most likely email pattern for a person at a company"""
        if not first_name or not company_website:
            return None
        
        # Extract domain from company website
        domain = self._extract_domain_from_website(company_website)
        if not domain:
            return None
        
        # Check if it's a major provider
        if domain in self.MAJOR_PROVIDERS:
            return self._generate_email_pattern(first_name, last_name, domain)
        
        # For non-major providers, use common corporate patterns
        first = first_name.lower().strip()
        last = last_name.lower().strip() if last_name else ''
        
        # Most common corporate pattern
        if last:
            return f"{first}.{last}@{domain}"
        else:
            return f"{first}@{domain}"
    
    def _extract_domain_from_website(self, website: str) -> str:
        """Extract domain from website URL"""
        if not website:
            return ''
        
        # Remove protocol
        if '://' in website:
            website = website.split('://', 1)[1]
        
        # Remove www prefix
        if website.startswith('www.'):
            website = website[4:]
        
        # Remove path
        if '/' in website:
            website = website.split('/', 1)[0]
        
        return website.lower()

# Async context manager usage:
# async with ReacherEmailValidator() as validator:
#     result = await validator.validate_email("test@example.com")
#     results = await validator.validate_emails_batch(["email1@test.com", "email2@test.com"])