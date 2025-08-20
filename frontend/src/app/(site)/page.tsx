"use client";

import { useState, useEffect, useRef } from "react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import WelcomeSection from "./components/WelcomeSection";
import SearchInterface from "./components/SearchInterface";
import LoadingState from "./components/LoadingState";
import SearchResults from "./components/SearchResults";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SearchResponse {
  companies: any[];
  company_stats: Record<string, {
    contactCount: number;
    emailCount: number;
    contacts: any[];
  }>;
  total_found: number;
  prompt_id: string;
}

export default function MainPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [companyCount, setCompanyCount] = useState([5]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // Simplified mutation that handles everything in one call
  const searchMutation = useMutation({
    mutationFn: async (data: { query: string; total: number }) => {
      const response = await fetch('http://localhost:8000/search-and-mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
      const totalEmails = Object.values(data.company_stats).reduce((sum: number, stats: any) => sum + stats.emailCount, 0);
      toast.success(`🎉 Found ${data.total_found} companies with ${totalEmails} contacts!`);
    },
    onError: (error: any) => {
      toast.error(`Search failed: ${error.message || 'Please try again'}`);
    },
  });

  const isLoading = searchMutation.isPending;

  // Rotate through messages during loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % 8);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setMessageIndex(0);
    }
  }, [isLoading]);

  // Set hasSearched to true when search begins
  useEffect(() => {
    if (isLoading || searchResults) {
      setHasSearched(true);
    }
  }, [isLoading, searchResults]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchResults(null);
    setMessageIndex(0);
    searchMutation.mutate({
      query: searchQuery,
      total: companyCount[0],
    });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white relative">
      <DotPattern
        width={32}
        height={32}
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />

      {/* <GradientSpheres /> */}

      <div className="absolute top-6 right-6 z-30">
        <ModeToggle />
      </div>

      {hasSearched && (
        <div className="relative z-10 pt-20 pb-32">
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="space-y-12">
              <LoadingState isLoading={isLoading} messageIndex={messageIndex} />

              <SearchResults
                searchResults={searchResults ? {
                  companies: searchResults.companies,
                  total_found: searchResults.total_found,
                  saved_to_db: searchResults.companies.length,
                  prompt_id: searchResults.prompt_id
                } : null}
                emailResults={null}
                companyStats={searchResults ? Object.fromEntries(
                  Object.entries(searchResults.company_stats).map(([key, stats]) => [
                    key, 
                    { ...stats, isLoading: false }
                  ])
                ) : {}}
                onCompanyClick={() => {}} // No longer needed - all data comes from single API call
              />
            </div>
          </div>
        </div>
      )}

      <div
        ref={inputRef}
        className={`${
          hasSearched
            ? "fixed bottom-4 left-1/2 transform -translate-x-1/2"
            : "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        } w-full max-w-3xl px-4 z-20 transition-all duration-500 ease-in-out`}
      >
        <WelcomeSection hasSearched={hasSearched} />

        <SearchInterface
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          companyCount={companyCount}
          setCompanyCount={setCompanyCount}
          isLoading={isLoading}
          isEmailMining={false}
          onSearch={handleSearch}
        />
      </div>
    </main>
  );
}