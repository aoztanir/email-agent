import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, SearchCompaniesRequest, MineEmailsRequest, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

export const useSearchCompaniesMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SearchCompaniesRequest) => api.searchCompanies(data),
    onSuccess: (data) => {
      toast.success(
        `🎉 Found ${data.total_found} companies with websites! ${data.saved_to_db} saved to database.`
      );
    },
    onError: (error: ApiError) => {
      console.error('Search companies error:', error);
      const errorMessage = error.message || 'Search failed - please try again';
      toast.error(`Search failed: ${errorMessage}`);
    },
  });
};

export const useMineEmailsMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MineEmailsRequest) => api.mineEmails(data),
    onSuccess: (data) => {
      toast.success(
        `🎉 Found ${data.contacts_found} contacts across companies!`
      );
    },
    onError: (error: ApiError) => {
      console.error('Mine emails error:', error);
      const errorMessage = error.message || 'Email mining failed - please try again';
      toast.error(`Email mining failed: ${errorMessage}`);
    },
  });
};

// Helper function to batch mine emails for multiple companies
export const useBatchMineEmailsMutation = () => {
  const mineEmailsMutation = useMineEmailsMutation();
  
  return useMutation({
    mutationFn: async (companies: Array<{ id: string; name: string; website: string }>) => {
      const results = [];
      let totalContacts = 0;
      
      for (const company of companies) {
        try {
          const result = await api.mineEmails({
            company_id: company.id,
            company_name: company.name,
            website: company.website,
          });
          
          results.push(result);
          totalContacts += result.contacts_found;
          
          // Add delay between requests to avoid overwhelming the server
          if (companies.indexOf(company) < companies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`Error mining emails for ${company.name}:`, error);
          results.push({
            success: false,
            company_name: company.name,
            website: company.website,
            contacts_found: 0,
            total_contacts: 0,
            message: `Failed to mine emails for ${company.name}`,
          });
        }
      }
      
      return {
        results,
        total_contacts: totalContacts,
        companies_processed: companies.length,
      };
    },
    onSuccess: (data) => {
      toast.success(
        `🎉 Found ${data.total_contacts} contacts across ${data.companies_processed} companies!`
      );
    },
    onError: (error) => {
      console.error('Batch email mining error:', error);
      toast.error('Email mining failed - please try again');
    },
  });
};

// Real-time streaming email mining hook
export const useStreamingEmailMining = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCompany, setCurrentCompany] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [realtimeContacts, setRealtimeContacts] = useState<any[]>([]);
  const [streamingResults, setStreamingResults] = useState<{
    total_contacts: number;
    total_emails: number;
    companies_processed: number;
  } | null>(null);

  const startStreamingMining = useCallback(async (
    companies: Array<{ id: string; name: string; website: string }>,
    onUpdate?: (data: any) => void
  ) => {
    setIsStreaming(true);
    setProgress(0);
    setCurrentCompany(0);
    setTotalCompanies(companies.length);
    setRealtimeContacts([]);
    setStreamingResults(null);

    try {
      const response = await fetch('http://localhost:8000/batch-mine-emails-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companies),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (onUpdate) {
                onUpdate(data);
              }

              switch (data.type) {
                case 'status':
                  setProgress(data.progress);
                  setCurrentCompany(data.current_company);
                  setTotalCompanies(data.total_companies);
                  break;
                  
                case 'company_progress':
                  setProgress(data.progress);
                  setCurrentCompany(data.current_company);
                  break;
                  
                case 'contact_found':
                  setRealtimeContacts(prev => [...prev, data.contact]);
                  break;
                  
                case 'complete':
                  setStreamingResults({
                    total_contacts: data.total_emails || data.total_contacts,
                    total_emails: data.total_emails,
                    companies_processed: data.companies_processed
                  });
                  setProgress(100);
                  break;
                  
                case 'error':
                  console.error('Streaming error:', data.error);
                  toast.error('Email mining failed: ' + data.error);
                  break;
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      toast.error('Failed to start email mining stream');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    progress,
    currentCompany,
    totalCompanies,
    realtimeContacts,
    streamingResults,
    startStreamingMining,
  };
};