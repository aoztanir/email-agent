"use client";

import { motion, AnimatePresence } from "motion/react";
import { Mail, User, Building2 } from "lucide-react";
import { COLORS } from "@/constants/COLORS";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  emails: Array<{
    email: string;
    confidence: 'high' | 'medium' | 'low' | 'uncertain';
    is_deliverable: boolean;
  }>;
}

interface RealtimeContactsProps {
  contacts: Contact[];
  isVisible: boolean;
}

const getEmailConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high':
      return COLORS.green.light_variant.class;
    case 'uncertain':
      return COLORS.orange.light_variant.class;
    case 'medium':
      return COLORS.blue.light_variant.class;
    case 'low':
      return COLORS.red.light_variant.class;
    default:
      return COLORS.gray.light_variant.class;
  }
};

export default function RealtimeContacts({ contacts, isVisible }: RealtimeContactsProps) {
  if (!isVisible || contacts.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4 max-w-4xl mx-auto"
      >
        <div className="text-center mb-6">
          <motion.h3
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-black dark:text-white flex items-center justify-center gap-2"
          >
            <Mail className="w-6 h-6" />
            Real-time Contact Discovery
          </motion.h3>
          <p className="text-black/60 dark:text-white/60 mt-2">
            Watch as we find and validate emails in real-time
          </p>
        </div>

        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-black dark:text-white">
                      {contact.first_name} {contact.last_name}
                    </h4>
                    <div className="flex items-center space-x-1 text-sm text-black/60 dark:text-white/60">
                      <Building2 className="w-4 h-4" />
                      <span>{contact.company_name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-black dark:text-white">
                    {contact.emails.length} email{contact.emails.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              {/* Email list */}
              {contact.emails.length > 0 && (
                <div className="mt-3 space-y-2">
                  {contact.emails.map((emailInfo, emailIndex) => (
                    <motion.div
                      key={emailIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (index * 0.1) + (emailIndex * 0.05) }}
                      className={`px-3 py-2 rounded-lg text-sm font-mono ${getEmailConfidenceColor(emailInfo.confidence)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{emailInfo.email}</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            emailInfo.confidence === 'high' ? 'bg-green-500' :
                            emailInfo.confidence === 'uncertain' ? 'bg-orange-500' :
                            emailInfo.confidence === 'medium' ? 'bg-blue-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs capitalize">
                            {emailInfo.confidence}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-black/60 dark:text-white/60 mt-6"
        >
          Showing {contacts.length} contacts found • Colors indicate email confidence levels
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}