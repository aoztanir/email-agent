"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ExternalLink,
  Building,
  Globe,
  MapPin,
  Phone,
  Mail,
  Users,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchStore } from "@/store/searchStore";


export default function CompanyDetailsModal() {
  const {
    selectedCompany,
    isModalOpen,
    contacts,
    isSearching,
    currentStatus,
    setIsModalOpen,
    setSelectedCompany,
  } = useSearchStore();

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  };

  if (!selectedCompany) return null;

  const companyContacts = contacts[selectedCompany.id] || [];
  const confirmedEmails = companyContacts.reduce(
    (count, contact) =>
      count +
      contact.emails.filter(
        (email) =>
          email.is_deliverable === true ||
          email.confidence === "pattern_generated"
      ).length,
    0
  );

  const isLoadingContacts =
    isSearching && currentStatus?.includes(selectedCompany.name);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold truncate">
                  {selectedCompany.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {selectedCompany.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline truncate max-w-48"
                      >
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}
                  {selectedCompany.phone_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCompany.phone_number}</span>
                    </div>
                  )}
                </div>
                {selectedCompany.address && (
                  <div className="flex items-start gap-1 mt-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {selectedCompany.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCompany.is_existing && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Existing
                </Badge>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contacts</p>
                      <p className="text-lg font-semibold">
                        {companyContacts.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Emails
                      </p>
                      <p className="text-lg font-semibold">
                        {companyContacts.reduce(
                          (sum, contact) => sum + contact.emails.length,
                          0
                        )}
                      </p>
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
                      <p className="text-lg font-semibold">{confirmedEmails}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                      <p className="text-lg font-semibold">
                        {companyContacts.filter((c) => c.linkedin_url).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Contacts</h3>
              {isLoadingContacts && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding contacts...
                </div>
              )}
            </div>

            {companyContacts.length === 0 ? (
              <div className="text-center py-8">
                {isLoadingContacts ? (
                  <div>
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Discovering contacts for this company...
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No contacts found yet</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {companyContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-muted/50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            {contact.linkedin_url && (
                              <a
                                href={contact.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                aria-label={`View ${contact.first_name} ${contact.last_name} on LinkedIn`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <div className="space-y-1">
                            {contact.emails.map((email, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <Badge
                                  variant={
                                    email.is_deliverable === true
                                      ? "default"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {email.email}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {email.confidence}
                                </span>
                                {email.is_deliverable === true && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-green-600"
                                  >
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
