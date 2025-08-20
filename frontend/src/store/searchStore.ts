import { create } from 'zustand';

interface Company {
  id: string;
  name: string;
  website: string;
  address?: string;
  phone_number?: string;
  is_existing?: boolean;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  emails: Array<{
    email: string;
    confidence: string;
    is_deliverable: boolean | null;
  }>;
  company_id: string;
  company_name: string;
  linkedin_url?: string;
}

interface SearchState {
  companies: Company[];
  contacts: Record<string, Contact[]>;
  isSearching: boolean;
  hasSearched: boolean;
  searchQuery: string;
  currentStatus: string;
  currentStage: string;
  selectedCompany: Company | null;
  isModalOpen: boolean;
  
  // Actions
  setCompanies: (companies: Company[] | ((prev: Company[]) => Company[])) => void;
  setContacts: (contacts: Record<string, Contact[]> | ((prev: Record<string, Contact[]>) => Record<string, Contact[]>)) => void;
  setIsSearching: (isSearching: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCurrentStatus: (status: string) => void;
  setCurrentStage: (stage: string) => void;
  setSelectedCompany: (company: Company | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  companies: [],
  contacts: {},
  isSearching: false,
  hasSearched: false,
  searchQuery: '',
  currentStatus: '',
  currentStage: '',
  selectedCompany: null,
  isModalOpen: false,
  
  setCompanies: (companies) => set((state) => ({
    companies: typeof companies === 'function' ? companies(state.companies) : companies
  })),
  setContacts: (contacts) => set((state) => ({
    contacts: typeof contacts === 'function' ? contacts(state.contacts) : contacts
  })),
  setIsSearching: (isSearching) => set({ isSearching }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCurrentStatus: (currentStatus) => set({ currentStatus }),
  setCurrentStage: (currentStage) => set({ currentStage }),
  setSelectedCompany: (selectedCompany) => set({ selectedCompany }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  clearResults: () => set({ companies: [], contacts: {}, currentStatus: '', currentStage: '', selectedCompany: null, isModalOpen: false }),
}));