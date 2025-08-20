"use client";

import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Globe, Phone, Loader2 } from "lucide-react";
import { useState } from "react";
import CompanyContactsDialog from "./CompanyContactsDialog";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  linkedin_url?: string;
  bio?: string;
  emails: Array<{
    id: string;
    email: string;
    is_valid: boolean;
    is_deliverable: boolean;
    found_by: string;
  }>;
}

interface CompanyStats {
  contactCount: number;
  emailCount: number;
  isLoading: boolean;
  contacts: Contact[];
}

interface SearchResultsProps {
  searchResults: {
    companies: any[];
    total_found: number;
    saved_to_db: number;
    prompt_id: string;
  } | null;
  emailResults: {
    total_contacts: number;
    companies_processed: number;
  } | null;
  companyStats: Record<string, CompanyStats>;
  onCompanyClick: (company: any) => void;
}

export default function SearchResults({ 
  searchResults, 
  emailResults, 
  companyStats, 
  onCompanyClick 
}: SearchResultsProps) {
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCompanyClick = (company: any) => {
    setSelectedCompany(company);
    setDialogOpen(true);
    onCompanyClick(company);
  };

  const getCompanyStats = (companyId: string) => {
    return companyStats[companyId] || {
      contactCount: 0,
      emailCount: 0,
      isLoading: false,
      contacts: []
    };
  };

  return (
    <AnimatePresence>
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="mb-8 text-center">
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-semibold"
            >
              Found {searchResults.total_found} Companies
            </motion.h3>
            <p className="text-black/60 dark:text-white/60 mt-2">
              Click any company to view contacts and emails
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {searchResults.companies?.map(
              (company: any, index: number) => {
                const stats = getCompanyStats(company.id);
                
                return (
                  <Card 
                    key={`company-${company.id}-${index}`} 
                    className="shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => handleCompanyClick(company)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <CardTitle className="text-base">
                            {company.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {company.address}
                          </CardDescription>
                        </div>
                        {company.reviews_average && (
                          <div className="flex items-center space-x-1 shrink-0 ml-4">
                            <span className="text-black/60 dark:text-white/60">
                              ★
                            </span>
                            <span className="text-sm font-medium">
                              {company.reviews_average}
                            </span>
                            {company.reviews_count && (
                              <span className="text-xs text-black/50 dark:text-white/50">
                                ({company.reviews_count})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {company.place_type && (
                        <Badge variant="outline" className="mb-3 text-xs">
                          {company.place_type}
                        </Badge>
                      )}

                      {/* Contact and Email Stats */}
                      <div className="flex gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg flex-1">
                          {stats.isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <Users className="w-4 h-4 text-blue-500" />
                          )}
                          <div className="text-sm">
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              {stats.isLoading ? "..." : stats.contactCount}
                            </div>
                            <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                              Contacts
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg flex-1">
                          {stats.isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                          ) : (
                            <Mail className="w-4 h-4 text-green-500" />
                          )}
                          <div className="text-sm">
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              {stats.isLoading ? "..." : stats.emailCount}
                            </div>
                            <div className="text-xs text-green-600/70 dark:text-green-400/70">
                              Emails
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {company.website && (
                          <div className="flex items-center gap-1 text-black/80 dark:text-white/80">
                            <Globe className="w-3 h-3" />
                            <span>{company.website}</span>
                          </div>
                        )}
                        {company.phone_number && (
                          <div className="flex items-center gap-1 text-black/60 dark:text-white/60">
                            <Phone className="w-3 h-3" />
                            <span>{company.phone_number}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </motion.div>

          {/* Company Contacts Dialog */}
          <CompanyContactsDialog
            isOpen={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
            contacts={selectedCompany ? getCompanyStats(selectedCompany.id).contacts : []}
            isLoading={selectedCompany ? getCompanyStats(selectedCompany.id).isLoading : false}
            totalContacts={selectedCompany ? getCompanyStats(selectedCompany.id).contactCount : 0}
            totalEmails={selectedCompany ? getCompanyStats(selectedCompany.id).emailCount : 0}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}