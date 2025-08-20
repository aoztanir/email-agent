export interface SearchSuggestion {
  id: string;
  text: string;
  category: 'starter' | 'industry' | 'location' | 'company_type' | 'recent' | 'popular';
  icon?: string;
  description?: string;
  popularity?: number;
}

export class AutocompleteService {
  private static instance: AutocompleteService;
  
  // Starter suggestions to help users begin their search
  private readonly starterSuggestions: SearchSuggestion[] = [
    {
      id: 'tech-companies-sf',
      text: 'technology companies in San Francisco',
      category: 'starter',
      icon: '💻',
      description: 'Find tech startups and companies in SF',
      popularity: 95
    },
    {
      id: 'investment-banking-nyc',
      text: 'investment banking firms in NYC',
      category: 'starter',
      icon: '🏦',
      description: 'Major investment banks in New York',
      popularity: 90
    },
    {
      id: 'law-firms-los-angeles',
      text: 'law firms in Los Angeles',
      category: 'starter',
      icon: '⚖️',
      description: 'Legal practices and law offices in LA',
      popularity: 85
    },
    {
      id: 'consulting-firms-boston',
      text: 'consulting firms in Boston',
      category: 'starter',
      icon: '📊',
      description: 'Management and business consulting',
      popularity: 80
    },
    {
      id: 'healthcare-companies-chicago',
      text: 'healthcare companies in Chicago',
      category: 'starter',
      icon: '🏥',
      description: 'Medical and health technology companies',
      popularity: 75
    },
    {
      id: 'real-estate-miami',
      text: 'real estate companies in Miami',
      category: 'starter',
      icon: '🏢',
      description: 'Real estate agencies and property firms',
      popularity: 70
    }
  ];

  // Industry categories
  private readonly industries: SearchSuggestion[] = [
    { id: 'technology', text: 'technology companies', category: 'industry', icon: '💻' },
    { id: 'finance', text: 'financial services', category: 'industry', icon: '💰' },
    { id: 'healthcare', text: 'healthcare organizations', category: 'industry', icon: '🏥' },
    { id: 'consulting', text: 'consulting firms', category: 'industry', icon: '📊' },
    { id: 'law', text: 'law firms', category: 'industry', icon: '⚖️' },
    { id: 'real-estate', text: 'real estate companies', category: 'industry', icon: '🏢' },
    { id: 'marketing', text: 'marketing agencies', category: 'industry', icon: '📱' },
    { id: 'manufacturing', text: 'manufacturing companies', category: 'industry', icon: '🏭' },
    { id: 'retail', text: 'retail companies', category: 'industry', icon: '🛍️' },
    { id: 'education', text: 'educational institutions', category: 'industry', icon: '🎓' },
    { id: 'nonprofit', text: 'nonprofit organizations', category: 'industry', icon: '🤝' },
    { id: 'energy', text: 'energy companies', category: 'industry', icon: '⚡' },
    { id: 'media', text: 'media companies', category: 'industry', icon: '📺' },
    { id: 'biotech', text: 'biotech companies', category: 'industry', icon: '🧬' },
    { id: 'fintech', text: 'fintech startups', category: 'industry', icon: '💳' }
  ];

  // Major cities and locations
  private readonly locations: SearchSuggestion[] = [
    { id: 'nyc', text: 'in New York City', category: 'location', icon: '🗽' },
    { id: 'sf', text: 'in San Francisco', category: 'location', icon: '🌉' },
    { id: 'la', text: 'in Los Angeles', category: 'location', icon: '🌴' },
    { id: 'chicago', text: 'in Chicago', category: 'location', icon: '🌆' },
    { id: 'boston', text: 'in Boston', category: 'location', icon: '🦞' },
    { id: 'seattle', text: 'in Seattle', category: 'location', icon: '☕' },
    { id: 'austin', text: 'in Austin', category: 'location', icon: '🤠' },
    { id: 'denver', text: 'in Denver', category: 'location', icon: '🏔️' },
    { id: 'miami', text: 'in Miami', category: 'location', icon: '🏖️' },
    { id: 'atlanta', text: 'in Atlanta', category: 'location', icon: '🍑' },
    { id: 'dc', text: 'in Washington DC', category: 'location', icon: '🏛️' },
    { id: 'dallas', text: 'in Dallas', category: 'location', icon: '🤠' },
    { id: 'phoenix', text: 'in Phoenix', category: 'location', icon: '🌵' },
    { id: 'philadelphia', text: 'in Philadelphia', category: 'location', icon: '🔔' },
    { id: 'san-diego', text: 'in San Diego', category: 'location', icon: '🏄‍♂️' }
  ];

  // Company types and sizes
  private readonly companyTypes: SearchSuggestion[] = [
    { id: 'startups', text: 'startups', category: 'company_type', icon: '🚀' },
    { id: 'fortune500', text: 'Fortune 500 companies', category: 'company_type', icon: '🏆' },
    { id: 'small-business', text: 'small businesses', category: 'company_type', icon: '🏪' },
    { id: 'enterprise', text: 'enterprise companies', category: 'company_type', icon: '🏢' },
    { id: 'agencies', text: 'agencies', category: 'company_type', icon: '🎯' },
    { id: 'firms', text: 'firms', category: 'company_type', icon: '💼' },
    { id: 'corporations', text: 'corporations', category: 'company_type', icon: '🏛️' },
    { id: 'saas', text: 'SaaS companies', category: 'company_type', icon: '☁️' }
  ];

  private recentSearches: SearchSuggestion[] = [];
  private popularSearches: SearchSuggestion[] = [];

  public static getInstance(): AutocompleteService {
    if (!AutocompleteService.instance) {
      AutocompleteService.instance = new AutocompleteService();
    }
    return AutocompleteService.instance;
  }

  private constructor() {
    this.loadRecentSearches();
    this.initializePopularSearches();
  }

  private loadRecentSearches() {
    try {
      const stored = localStorage.getItem('recent_company_searches');
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }

  private saveRecentSearches() {
    try {
      localStorage.setItem('recent_company_searches', JSON.stringify(this.recentSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }

  private initializePopularSearches() {
    // These would typically come from analytics data
    this.popularSearches = [
      { id: 'pop1', text: 'tech companies in Silicon Valley', category: 'popular', popularity: 100 },
      { id: 'pop2', text: 'venture capital firms', category: 'popular', popularity: 95 },
      { id: 'pop3', text: 'AI startups in San Francisco', category: 'popular', popularity: 90 },
      { id: 'pop4', text: 'investment banks in Wall Street', category: 'popular', popularity: 85 },
      { id: 'pop5', text: 'law firms in Manhattan', category: 'popular', popularity: 80 }
    ];
  }

  public addToRecentSearches(query: string) {
    const suggestion: SearchSuggestion = {
      id: `recent-${Date.now()}`,
      text: query,
      category: 'recent',
      icon: '🕒'
    };

    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(s => s.text !== query);
    
    // Add to beginning
    this.recentSearches.unshift(suggestion);
    
    // Keep only last 10
    this.recentSearches = this.recentSearches.slice(0, 10);
    
    this.saveRecentSearches();
  }

  public getSuggestions(query: string = '', limit: number = 10): SearchSuggestion[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    // If no query, show starter suggestions
    if (!normalizedQuery) {
      const suggestions = [
        ...this.recentSearches.slice(0, 3),
        ...this.starterSuggestions.slice(0, 6),
        ...this.popularSearches.slice(0, 3)
      ];
      return suggestions.slice(0, limit);
    }

    // Get all possible suggestions
    const allSuggestions = [
      ...this.recentSearches,
      ...this.starterSuggestions,
      ...this.industries,
      ...this.locations,
      ...this.companyTypes,
      ...this.popularSearches
    ];

    // Filter and score suggestions
    const scoredSuggestions = allSuggestions
      .map(suggestion => {
        const text = suggestion.text.toLowerCase();
        let score = 0;

        // Exact match gets highest score
        if (text === normalizedQuery) {
          score = 1000;
        }
        // Starts with query
        else if (text.startsWith(normalizedQuery)) {
          score = 500 + (normalizedQuery.length / text.length) * 100;
        }
        // Contains query
        else if (text.includes(normalizedQuery)) {
          score = 200 + (normalizedQuery.length / text.length) * 50;
        }
        // Fuzzy matching for individual words
        else {
          const words = normalizedQuery.split(' ');
          const matchedWords = words.filter(word => 
            word.length > 2 && text.includes(word)
          );
          if (matchedWords.length > 0) {
            score = 50 + (matchedWords.length / words.length) * 100;
          }
        }

        // Boost score based on category priority
        if (suggestion.category === 'recent') score += 200;
        if (suggestion.category === 'popular') score += 100;
        if (suggestion.category === 'starter') score += 50;

        // Boost score based on popularity
        if (suggestion.popularity) {
          score += suggestion.popularity / 10;
        }

        return { ...suggestion, score };
      })
      .filter(suggestion => suggestion.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredSuggestions;
  }

  public getSmartCompletions(query: string): SearchSuggestion[] {
    const normalizedQuery = query.toLowerCase().trim();
    const completions: SearchSuggestion[] = [];

    // If query contains industry but no location, suggest locations
    const hasIndustry = this.industries.some(ind => 
      normalizedQuery.includes(ind.text.replace(' companies', '').replace(' firms', ''))
    );
    
    if (hasIndustry && !this.hasLocation(normalizedQuery)) {
      const topLocations = this.locations.slice(0, 5).map(loc => ({
        ...loc,
        text: `${query} ${loc.text}`,
        id: `completion-${loc.id}`
      }));
      completions.push(...topLocations);
    }

    // If query has location but no industry, suggest industries
    const hasLocation = this.hasLocation(normalizedQuery);
    if (hasLocation && !hasIndustry) {
      const topIndustries = this.industries.slice(0, 5).map(ind => ({
        ...ind,
        text: `${ind.text} ${this.extractLocation(normalizedQuery)}`,
        id: `completion-${ind.id}`
      }));
      completions.push(...topIndustries);
    }

    // If query is just a city/location, suggest popular industry + location combos
    if (this.isJustLocation(normalizedQuery)) {
      const location = this.extractLocation(normalizedQuery);
      const topCombos = [
        { industry: 'technology companies', icon: '💻' },
        { industry: 'investment banking firms', icon: '🏦' },
        { industry: 'law firms', icon: '⚖️' },
        { industry: 'consulting firms', icon: '📊' }
      ].map((combo, index) => ({
        id: `combo-${index}`,
        text: `${combo.industry} ${location}`,
        category: 'starter' as const,
        icon: combo.icon
      }));
      completions.push(...topCombos);
    }

    return completions.slice(0, 8);
  }

  private hasLocation(query: string): boolean {
    return this.locations.some(loc => 
      query.includes(loc.text.replace('in ', '').toLowerCase())
    );
  }

  private extractLocation(query: string): string {
    for (const loc of this.locations) {
      const locationName = loc.text.replace('in ', '');
      if (query.includes(locationName.toLowerCase())) {
        return loc.text;
      }
    }
    return '';
  }

  private isJustLocation(query: string): boolean {
    return this.locations.some(loc => {
      const locationName = loc.text.replace('in ', '').toLowerCase();
      const cleanQuery = query.replace(/^(in\s+)?/, '').trim();
      return cleanQuery === locationName;
    });
  }

  public getCategorizedSuggestions(query: string = ''): Record<string, SearchSuggestion[]> {
    const suggestions = this.getSuggestions(query, 20);
    const categorized: Record<string, SearchSuggestion[]> = {};
    
    for (const suggestion of suggestions) {
      if (!categorized[suggestion.category]) {
        categorized[suggestion.category] = [];
      }
      categorized[suggestion.category].push(suggestion);
    }
    
    return categorized;
  }
}

export const autocompleteService = AutocompleteService.getInstance();