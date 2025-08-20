def normalize_domain(website_url: str) -> str:
    """
    Normalize a website URL to extract a clean domain for deduplication.
    
    Examples:
        https://www.example.com/path -> example.com
        http://example.com/ -> example.com
        www.example.com?param=value -> example.com
    """
    if not website_url or not website_url.strip():
        return ""
    
    domain = website_url.strip()
    
    # Remove protocol
    domain = domain.replace('https://', '').replace('http://', '')
    
    # Remove www prefix
    if domain.startswith('www.'):
        domain = domain[4:]
    
    # Remove trailing slash and everything after it (path, query, fragment)
    domain = domain.split('/')[0]
    
    # Remove query parameters and fragments (in case they're at domain level)
    domain = domain.split('?')[0].split('#')[0]
    
    # Convert to lowercase and strip whitespace
    domain = domain.lower().strip()
    
    # Remove trailing dots
    domain = domain.rstrip('.')
    
    return domain