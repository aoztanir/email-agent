export interface SearchCompaniesRequest {
  query: string;
  total: number;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  website?: string;
  phone_number?: string;
  reviews_count?: number;
  reviews_average?: number;
  place_type?: string;
  opens_at?: string;
}

export interface SearchCompaniesResponse {
  companies: Company[];
  total_found: number;
  saved_to_db: number;
  prompt_id: string;
}

export interface MineEmailsRequest {
  company_id: string;
  company_name: string;
  website: string;
}

export interface MineEmailsResponse {
  success: boolean;
  company_name: string;
  website: string;
  contacts_found: number;
  total_contacts: number;
  message: string;
}

export interface EmailValidationResult {
  email: string;
  status: 'deliverable' | 'unconfirmed_major_provider' | 'risky' | 'invalid' | 'unknown';
  confidence: 'confirmed' | 'unconfirmed' | 'risky' | 'invalid' | 'unknown';
  is_deliverable: boolean | null;
  is_disabled: boolean | null;
  has_full_inbox: boolean | null;
  is_catch_all: boolean | null;
  is_disposable: boolean | null;
  is_role_account: boolean | null;
  is_b2c: boolean | null;
  mx_accepts_mail: boolean | null;
  mx_records: string[];
  syntax_valid: boolean;
  domain: string;
  username: string;
  suggestion: string | null;
  gravatar_url: string | null;
  haveibeenpwned: any;
  error?: string;
  raw_reacher_response: any;
}

export interface ValidateEmailRequest {
  email: string;
  proxy?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

export interface ValidateEmailResponse {
  success: boolean;
  result: EmailValidationResult;
}

export interface ValidateEmailsBatchRequest {
  emails: string[];
  proxy?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

export interface ValidateEmailsBatchResponse {
  success: boolean;
  total_processed: number;
  confirmed: number;
  unconfirmed: number;
  invalid: number;
  risky: number;
  results: EmailValidationResult[];
  summary: {
    confirmed_emails: EmailValidationResult[];
    unconfirmed_emails: EmailValidationResult[];
    invalid_emails: EmailValidationResult[];
    risky_emails: EmailValidationResult[];
  };
}

export interface FindEmailRequest {
  first_name: string;
  last_name?: string;
  company_website: string;
  validate?: boolean;
}

export interface FindEmailResponse {
  success: boolean;
  generated_email?: string;
  first_name: string;
  last_name?: string;
  company_website: string;
  validation?: EmailValidationResult;
  is_deliverable?: boolean | null;
  confidence?: string;
  status?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const api = {
  searchCompanies: async (data: SearchCompaniesRequest): Promise<SearchCompaniesResponse> => {
    return fetchApi<SearchCompaniesResponse>('/api/search-companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  mineEmails: async (data: MineEmailsRequest): Promise<MineEmailsResponse> => {
    return fetchApi<MineEmailsResponse>('/api/mine-emails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  validateEmail: async (data: ValidateEmailRequest): Promise<ValidateEmailResponse> => {
    return fetchApi<ValidateEmailResponse>('/api/validate-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  validateEmailsBatch: async (data: ValidateEmailsBatchRequest): Promise<ValidateEmailsBatchResponse> => {
    return fetchApi<ValidateEmailsBatchResponse>('/api/validate-emails-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  findEmail: async (data: FindEmailRequest): Promise<FindEmailResponse> => {
    return fetchApi<FindEmailResponse>('/api/find-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export { ApiError };