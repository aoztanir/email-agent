"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Building, Users, Mail, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchStore } from "@/store/searchStore";

const LOADING_MESSAGES = [
  "Scouring the digital landscape",
  "Hunting down company intel",
  "Unleashing the search algorithms",
  "Diving deep into business directories",
  "Connecting the professional dots",
  "Mapping the corporate universe",
  "Extracting valuable connections",
  "Decoding company networks",
  "Discovering hidden gems",
  "Assembling your business leads",
  "Scanning professional profiles",
  "Building your contact empire",
  "Weaving through corporate webs",
  "Harvesting business intelligence",
  "Crafting your lead pipeline",
];

export default function SimpleSearchResults() {
  const {
    companies,
    contacts,
    isSearching,
    currentStatus,
    currentStage,
    setSelectedCompany,
    setIsModalOpen,
  } = useSearchStore();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages every 2 seconds if no specific status
  useEffect(() => {
    if (isSearching && !currentStatus) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSearching, currentStatus]);

  const getConfirmedEmailsCount = (companyId: string): number => {
    if (!contacts) return 0;
    const companyContacts = contacts[companyId] || [];
    return companyContacts.reduce(
      (count, contact) =>
        count +
        contact.emails.filter(
          (email) =>
            email.is_deliverable === true ||
            email.confidence === "pattern_generated"
        ).length,
      0
    );
  };

  const totalContacts = Object.values(contacts || {}).flat().length;
  const totalEmails = Object.values(contacts || {})
    .flat()
    .reduce((sum, contact) => sum + contact.emails.length, 0);

  // Show loading screen only if no companies found yet
  if (isSearching && companies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <h2 className="text-2xl font-bold">Searching Companies...</h2>
        </div>
        <motion.p
          key={currentStatus || loadingMessageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground"
        >
          {currentStatus && !currentStatus.includes("...")
            ? currentStatus
            : LOADING_MESSAGES[loadingMessageIndex]}
        </motion.p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Search Results</h2>
        <p className="text-muted-foreground">
          Your search results will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator when still searching */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 border rounded-lg p-4"
        >
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {currentStatus || "Searching for more companies..."}
            </span>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-lg font-semibold">{companies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-lg font-semibold">{totalContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Emails</p>
                <p className="text-lg font-semibold">{totalEmails}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-lg font-semibold">
                  {companies.reduce(
                    (sum, company) => sum + getConfirmedEmailsCount(company.id),
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Companies Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold">Found Companies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company) => {
            const companyContacts = contacts ? contacts[company.id] || [] : [];
            const confirmedEmails = getConfirmedEmailsCount(company.id);

            return (
              <Card
                key={company.id}
                className="p-4 cursor-pointer shadow-xl"
                onClick={() => {
                  setSelectedCompany(company);
                  setIsModalOpen(true);
                }}
              >
                <div className="space-y-3">
                  {/* Company Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{company.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {company.website}
                      </p>
                      {company.address && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {company.address}
                        </p>
                      )}
                    </div>
                    {company.is_existing && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600 ml-2"
                      >
                        Existing
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {companyContacts.length} contacts
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {confirmedEmails} emails
                    </Badge>
                  </div>

                  {/* Quick preview of contacts */}
                  {companyContacts.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Recent contacts:
                      </h4>
                      <div className="space-y-1">
                        {companyContacts.slice(0, 2).map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="truncate">
                              {contact.first_name} {contact.last_name}
                            </span>
                            <div className="flex gap-1">
                              {contact.emails.slice(0, 1).map((email, idx) => (
                                <Badge
                                  key={idx}
                                  variant={
                                    email.is_deliverable === true
                                      ? "default"
                                      : "outline"
                                  }
                                  className="text-[10px] px-1 py-0"
                                >
                                  {email.email.split("@")[0]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                        {companyContacts.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{companyContacts.length - 2} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
