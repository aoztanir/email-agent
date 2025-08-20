"use client";

import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  User,
  Building2,
  Phone,
  Globe,
  Copy,
  CheckCircle,
  Shield,
  RefreshCw,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, EmailValidationResult } from "@/lib/api";
// import { COLORS } from "@/constants/COLORS";

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
    validation_result?: EmailValidationResult;
  }>;
}

interface CompanyContactsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id: string;
    name: string;
    website: string;
    address?: string;
    phone_number?: string;
  } | null;
  contacts: Contact[];
  isLoading: boolean;
  totalContacts: number;
  totalEmails: number;
}

const getConfidenceBadge = (email: Contact["emails"][0]) => {
  // Use new validation result if available
  if (email.validation_result) {
    const result = email.validation_result;
    switch (result.confidence) {
      case 'confirmed':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'unconfirmed':
        return (
          <Badge variant="secondary">
            <Mail className="h-3 w-3 mr-1" />
            Unconfirmed
          </Badge>
        );
      case 'risky':
        return (
          <Badge variant="outline">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Risky
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Invalid
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <HelpCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  }

  // Fallback to old logic if no validation result
  if (email.is_valid && email.is_deliverable) {
    return (
      <Badge variant="default">
        High
      </Badge>
    );
  } else if (email.is_valid) {
    return (
      <Badge variant="secondary">
        Medium
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline">
        Low
      </Badge>
    );
  }
};

export default function CompanyContactsDialog({
  isOpen,
  onClose,
  company,
  contacts,
  isLoading,
  totalContacts,
  totalEmails,
}: CompanyContactsDialogProps) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [emailValidations, setEmailValidations] = useState<Record<string, EmailValidationResult>>({});
  const [validatingEmails, setValidatingEmails] = useState<Set<string>>(new Set());

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success("Email copied to clipboard!");
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      toast.error("Failed to copy email");
    }
  };

  const validateEmails = async (emails: string[]) => {
    if (emails.length === 0) return;

    const emailsToValidate = emails.filter(email => !emailValidations[email]);
    if (emailsToValidate.length === 0) return;

    // Add emails to validating set
    setValidatingEmails(prev => new Set([...prev, ...emailsToValidate]));

    try {
      const response = await api.validateEmailsBatch({ emails: emailsToValidate });
      
      if (response.success) {
        const newValidations: Record<string, EmailValidationResult> = {};
        response.results.forEach(result => {
          newValidations[result.email] = result;
        });
        
        setEmailValidations(prev => ({ ...prev, ...newValidations }));
      }
    } catch (error) {
      console.error('Error validating emails:', error);
      toast.error('Failed to validate some emails');
    } finally {
      // Remove emails from validating set
      setValidatingEmails(prev => {
        const newSet = new Set(prev);
        emailsToValidate.forEach(email => newSet.delete(email));
        return newSet;
      });
    }
  };

  // Auto-validate emails when contacts load
  useEffect(() => {
    if (!isLoading && contacts.length > 0) {
      const allEmails = contacts.flatMap(contact => 
        contact.emails.map(emailInfo => emailInfo.email)
      );
      
      if (allEmails.length > 0) {
        validateEmails(allEmails);
      }
    }
  }, [contacts, isLoading]);

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
              <Building2 className="size-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-4xl">{company.name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {company.address}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Company Info Header */}
        <div className="border-b pb-4 mb-6">
          <div className="flex flex-wrap gap-4 text-sm">
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <a
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span>{company.phone_number}</span>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="flex gap-6 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {isLoading ? "..." : totalContacts}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Contacts Found
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {isLoading ? "..." : totalEmails}
              </div>
              <div className="text-xs text-green-600/70 dark:text-green-400/70">
                Emails Found
              </div>
            </div>
            
            {/* Email Validation Stats */}
            {Object.keys(emailValidations).length > 0 && (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Object.values(emailValidations).filter(v => v.confidence === 'confirmed').length}
                  </div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70">
                    Confirmed
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Object.values(emailValidations).filter(v => v.confidence === 'unconfirmed').length}
                  </div>
                  <div className="text-xs text-orange-600/70 dark:text-orange-400/70">
                    Unconfirmed
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Validation Actions */}
          {!isLoading && contacts.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allEmails = contacts.flatMap(contact => 
                    contact.emails.map(emailInfo => emailInfo.email)
                  );
                  validateEmails(allEmails);
                }}
                disabled={validatingEmails.size > 0}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {validatingEmails.size > 0 ? 'Validating...' : 'Validate All Emails'}
                {validatingEmails.size > 0 && (
                  <div className="animate-spin h-4 w-4 border border-blue-600 border-t-transparent rounded-full"></div>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : contacts.length > 0 ? (
            contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {contact.first_name} {contact.last_name}
                      </h4>

                      {contact.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {contact.bio}
                        </p>
                      )}

                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 text-sm mt-2 inline-block"
                        >
                          View LinkedIn Profile →
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      {contact.emails.length} email
                      {contact.emails.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* Emails List */}
                {contact.emails.length > 0 && (
                  <div className="mt-4 space-y-2 pl-14">
                    {contact.emails.map((emailInfo, emailIndex) => (
                      <motion.div
                        key={emailInfo.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + emailIndex * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          emailValidations[emailInfo.email]?.status === 'unconfirmed_major_provider'
                            ? 'bg-accent/50 border border-primary/50'
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Mail className={`w-4 h-4 ${
                            emailValidations[emailInfo.email]?.status === 'unconfirmed_major_provider'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }`} />
                          <span className={`font-mono text-sm ${
                            emailValidations[emailInfo.email]?.status === 'unconfirmed_major_provider'
                              ? 'text-primary font-medium'
                              : ''
                          }`}>
                            {emailInfo.email}
                          </span>
                          
                          {validatingEmails.has(emailInfo.email) ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full mr-1"></div>
                              Validating...
                            </Badge>
                          ) : (
                            getConfidenceBadge({
                              ...emailInfo,
                              validation_result: emailValidations[emailInfo.email]
                            })
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyEmail(emailInfo.email)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedEmail === emailInfo.email ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Additional info for unconfirmed major provider emails */}
                        {emailValidations[emailInfo.email]?.status === 'unconfirmed_major_provider' && (
                          <div className="mt-2 p-2 bg-accent/50 rounded border-l-4 border-primary">
                            <div className="text-xs text-foreground">
                              <strong>Major Provider Email:</strong> This email follows the most likely pattern for {emailValidations[emailInfo.email]?.domain} addresses. 
                              While we can't confirm delivery due to provider restrictions, the format is typically correct.
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found for this company
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
