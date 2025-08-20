import os
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class APIConfig:
    """Configuration for external API services"""
    
    def __init__(self):
        # Reacher API configuration
        self.reacher_api_url = os.getenv('REACHER_API_URL', 'http://localhost:8080')
        self.reacher_api_key = os.getenv('REACHER_API_KEY')  # Optional for local instance
        
        # SearXNG configuration
        self.searxng_api_url = os.getenv('SEARXNG_API_URL', 'http://localhost:8888')
        
        # Email validation settings
        self.email_validation_timeout = int(os.getenv('EMAIL_VALIDATION_TIMEOUT', '30'))
        self.batch_validation_limit = int(os.getenv('BATCH_VALIDATION_LIMIT', '100'))
        
        # Rate limiting
        self.rate_limit_per_minute = int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))
        
    def get_reacher_endpoint(self, version: str = "v0") -> str:
        """Get the Reacher API endpoint URL"""
        return f"{self.reacher_api_url}/{version}/check_email"
    
    def get_searxng_endpoint(self) -> str:
        """Get the SearXNG API endpoint URL"""
        return f"{self.searxng_api_url}/search"
    
    def get_reacher_headers(self) -> Dict[str, str]:
        """Get headers for Reacher API requests"""
        headers = {'Content-Type': 'application/json'}
        if self.reacher_api_key:
            headers['Authorization'] = f'Bearer {self.reacher_api_key}'
        return headers

# Global config instance
api_config = APIConfig()